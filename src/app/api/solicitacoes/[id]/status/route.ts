import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { produtosCru, produtoCruAmostra, produtoCruAcabamento, produtoCruAcabamentoAmostra } from "@/lib/db/schema/produto-cru"
import { and, eq, inArray } from "drizzle-orm"
import { notificar, registrarLog } from "@/lib/notificar"
import { getValidStatuses } from "@/lib/status-utils"

// PATCH - Mudar status da solicitação
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userIdResult = auth.userId

    const { id: idStr } = await params
    const id = parseInt(idStr)
    if (isNaN(id)) return NextResponse.json({ error: "ID inválido" }, { status: 400 })

    const { status, comentario } = await req.json()

    const validStatuses = await getValidStatuses("SOLICITACAO_DESENVOLVIMENTO")
    if (!status || !validStatuses.includes(status)) {
      return NextResponse.json({ error: `Status inválido. Use: ${validStatuses.join(", ")}` }, { status: 400 })
    }

    const [solicitacaoAtual] = await db
      .select({
        status: solicitacoes.status,
        historicoComunicacao: solicitacoes.historicoComunicacao,
      })
      .from(solicitacoes)
      .where(eq(solicitacoes.id, id))
      .limit(1)

    if (!solicitacaoAtual) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 })
    }

    const historico = (solicitacaoAtual.historicoComunicacao as any[]) || []
    historico.push({
      data: new Date().toISOString(),
      usuario: session.user.name,
      usuarioId: userIdResult,
      acao: "MUDANCA_STATUS",
      de: solicitacaoAtual.status,
      para: status,
      mensagem: comentario || `Status alterado para ${status}`,
    })

    const updateData: any = {
      status,
      historicoComunicacao: historico,
      updatedAt: new Date(),
    }

    if (status === "CONCLUIDO" || status === "CONCLUIDO_DEV") {
      updateData.dataConclusao = new Date()
    }

    const [atualizada] = await db
      .update(solicitacoes)
      .set(updateData)
      .where(eq(solicitacoes.id, id))
      .returning()

    // Sincronizar amostras quando status da solicitação muda
    await sincronizarAmostras(id, solicitacaoAtual.status, status, session.user.name || "Sistema")

    if (status === "APROVADO_CLI") {
      await notificar(
        "SOLICITACAO_APROVADA",
        `Solicitação #${id} foi aprovada pelo cliente por ${session.user.name}${comentario ? ` — ${comentario}` : ""}`,
        `/comercial/solicitacoes/${id}`,
        session.user.name
      )
    }

    return NextResponse.json(atualizada)
  } catch (error) {
    console.error("[PATCH /api/solicitacoes/[id]/status]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

async function sincronizarAmostras(solicitacaoId: number, statusAntigo: string, statusNovo: string, usuarioNome: string) {
  const produtos = await db
    .select({ id: produtosCru.id })
    .from(produtosCru)
    .where(eq(produtosCru.solicitacaoDesenvolvimentoId, solicitacaoId))

  if (produtos.length === 0) return
  const produtoIds = produtos.map(p => p.id)

  if (statusNovo === "PENDENTE" || statusNovo === "EM_DESENVOLVIMENTO") {
    const tecidoNovoStatus = "PENDENTE"
    const benNovoStatus = "PENDENTE"

    for (const pid of produtoIds) {
      await db
        .update(produtoCruAmostra)
        .set({ status: tecidoNovoStatus })
        .where(and(eq(produtoCruAmostra.produtoCruId, pid), inArray(produtoCruAmostra.status, ["EM_PRODUCAO_TEC"])))
    }

    for (const pid of produtoIds) {
      const acabamentos = await db
        .select({ id: produtoCruAcabamento.id })
        .from(produtoCruAcabamento)
        .where(eq(produtoCruAcabamento.produtoCruId, pid))
      const acabamentoIds = acabamentos.map(a => a.id)
      if (acabamentoIds.length > 0) {
        await db
          .update(produtoCruAcabamentoAmostra)
          .set({ status: benNovoStatus })
          .where(and(inArray(produtoCruAcabamentoAmostra.acabamentoId, acabamentoIds), inArray(produtoCruAcabamentoAmostra.status, ["EM_PRODUCAO_BEN"])))
      }
    }

    await registrarLog({ tipo: "ATUALIZACAO", acao: "status_em_massa", descricao: `Amostras da solicitação #${solicitacaoId} redefinidas para ${tecidoNovoStatus} ao mover para ${statusNovo}`, entidade: "SolicitacaoDesenvolvimento", entidadeId: solicitacaoId, usuarioNome: usuarioNome })

  } else if (statusNovo === "CONCLUIDO_DEV") {
    for (const pid of produtoIds) {
      await db
        .update(produtoCruAmostra)
        .set({ status: "APROVADO_DESENVOLVIMENTO" })
        .where(and(eq(produtoCruAmostra.produtoCruId, pid), inArray(produtoCruAmostra.status, ["EM_PRODUCAO_TEC"])))
    }

    for (const pid of produtoIds) {
      const acabamentos = await db
        .select({ id: produtoCruAcabamento.id })
        .from(produtoCruAcabamento)
        .where(eq(produtoCruAcabamento.produtoCruId, pid))
      const acabamentoIds = acabamentos.map(a => a.id)
      if (acabamentoIds.length > 0) {
        await db
          .update(produtoCruAcabamentoAmostra)
          .set({ status: "APROVADO_DESENVOLVIMENTO" })
          .where(and(inArray(produtoCruAcabamentoAmostra.acabamentoId, acabamentoIds), inArray(produtoCruAcabamentoAmostra.status, ["EM_PRODUCAO_BEN"])))
      }
    }

    await registrarLog({ tipo: "ATUALIZACAO", acao: "status_em_massa", descricao: `Amostras da solicitação #${solicitacaoId} aprovadas para Desenvolvimento ao mover para ${statusNovo}`, entidade: "SolicitacaoDesenvolvimento", entidadeId: solicitacaoId, usuarioNome: usuarioNome })

  } else if (statusNovo === "APROVADO_CLI") {
    for (const pid of produtoIds) {
      await db
        .update(produtoCruAmostra)
        .set({ status: "APROVADO_COMERCIAL" })
        .where(and(eq(produtoCruAmostra.produtoCruId, pid), inArray(produtoCruAmostra.status, ["APROVADO_DESENVOLVIMENTO"])))
    }

    for (const pid of produtoIds) {
      const acabamentos = await db
        .select({ id: produtoCruAcabamento.id })
        .from(produtoCruAcabamento)
        .where(eq(produtoCruAcabamento.produtoCruId, pid))
      const acabamentoIds = acabamentos.map(a => a.id)
      if (acabamentoIds.length > 0) {
        await db
          .update(produtoCruAcabamentoAmostra)
          .set({ status: "APROVADO_COMERCIAL" })
          .where(and(inArray(produtoCruAcabamentoAmostra.acabamentoId, acabamentoIds), inArray(produtoCruAcabamentoAmostra.status, ["APROVADO_DESENVOLVIMENTO"])))
      }
    }

    await registrarLog({ tipo: "ATUALIZACAO", acao: "status_em_massa", descricao: `Amostras da solicitação #${solicitacaoId} aprovadas para Comercial ao mover para ${statusNovo}`, entidade: "SolicitacaoDesenvolvimento", entidadeId: solicitacaoId, usuarioNome: usuarioNome })
  }
}
