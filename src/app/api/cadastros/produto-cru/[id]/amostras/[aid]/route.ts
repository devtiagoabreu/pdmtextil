import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAmostra, produtosCru } from "@/lib/db/schema/produto-cru"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { eq, and } from "drizzle-orm"
import { notificar, registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userIdResult = auth.userId

    const { id, aid } = await params
    const body = await req.json()

    const isAprovacao = body.status ? (body.status.startsWith("APROVADA") || body.status === "REPROVADA") : false

    if (isAprovacao && !["COMERCIAL", "ADMIN", "SUDO", "PCP", "TECELAGEM"].includes(session.user.role)) {
      return NextResponse.json({ error: "Apenas COMERCIAL, ADMIN, SUDO, PCP e TECELAGEM podem aprovar/reprovar amostras" }, { status: 403 })
    }

    if (isAprovacao && !body.motivoAprovacao?.trim()) {
      return NextResponse.json({ error: "Motivo é obrigatório para aprovar ou reprovar" }, { status: 400 })
    }

    // Buscar estado atual para pegar o historico e observacoes existentes
    const [atual] = await db
      .select({
        status: produtoCruAmostra.status,
        historico: produtoCruAmostra.historico,
        observacoes: produtoCruAmostra.observacoes,
      })
      .from(produtoCruAmostra)
      .where(eq(produtoCruAmostra.id, parseInt(aid)))
      .limit(1)

    const historicoAtual: any[] = (atual?.historico as any[]) || []
    const statusAnterior = atual?.status

    // Se for reprovação, anexa o motivo nas observações
    const observacoesAtual = atual?.observacoes || ""
    const observacoesFinal = body.status === "REPROVADA" && body.motivoAprovacao?.trim()
      ? [observacoesAtual, `⛔ Reprovado por ${session.user.name}: ${body.motivoAprovacao.trim()}`].filter(Boolean).join("\n")
      : body.observacoes

    if (body.status && body.status !== statusAnterior) {
      historicoAtual.push({
        data: new Date().toISOString(),
        usuario: session.user.name,
        usuarioId: userIdResult,
        acao: "MUDANCA_STATUS",
        de: statusAnterior,
        para: body.status,
        motivo: isAprovacao ? body.motivoAprovacao : null,
      })
    }

    const [atualizado] = await db
      .update(produtoCruAmostra)
      .set({
        descricao: body.descricao,
        status: body.status !== undefined ? body.status : undefined,
        historico: historicoAtual,
        motivoAprovacao: isAprovacao ? body.motivoAprovacao : body.motivoAprovacao || null,
        observacoes: observacoesFinal,
        quantidadeProduzida: body.quantidadeProduzida || null,
        idIntegracaoErpCru: body.idIntegracaoErpCru || null,
        links: body.links !== undefined ? body.links : undefined,
        dados: body.dados !== undefined ? body.dados : undefined,
      })
      .where(eq(produtoCruAmostra.id, parseInt(aid)))
      .returning({
        id: produtoCruAmostra.id,
        produtoCruId: produtoCruAmostra.produtoCruId,
        descricao: produtoCruAmostra.descricao,
        status: produtoCruAmostra.status,
        motivoAprovacao: produtoCruAmostra.motivoAprovacao,
        observacoes: produtoCruAmostra.observacoes,
        quantidadeProduzida: produtoCruAmostra.quantidadeProduzida,
        idIntegracaoErpCru: produtoCruAmostra.idIntegracaoErpCru,
        links: produtoCruAmostra.links,
        dados: produtoCruAmostra.dados,
        historico: produtoCruAmostra.historico,
        data: produtoCruAmostra.data,
        createdAt: produtoCruAmostra.createdAt,
      })

    if (atualizado) {
      if (isAprovacao) {
        await notificar(
          body.status.startsWith("APROVADA") ? "AMOSTRA_APROVADA" : "AMOSTRA_REPROVADA",
           `Amostra #${aid} do produto #${id} foi ${body.status.startsWith("APROVADA") ? "aprovada" : "reprovada"} por ${session.user.name}${body.motivoAprovacao ? ` — Motivo: ${body.motivoAprovacao}` : ""}`,
          `/cadastros/produto-cru/${id}?tab=amostras&amostraId=amostra-${aid}`,
          session.user.name
        )
      } else {
        await notificar(
          "AMOSTRA_ATUALIZADA",
           `Amostra #${aid} do produto #${id} foi editada por ${session.user.name}`,
          `/cadastros/produto-cru/${id}?tab=amostras&amostraId=amostra-${aid}`,
          session.user.name
        )
      }
    }

    // Se a amostra entrou em produção na tecelagem, avança solicitação para Pilotagem
    if (body.status === "EM_PRODUCAO_TEC") {
      const [prod] = await db
        .select({ solicitacaoDesenvolvimentoId: produtosCru.solicitacaoDesenvolvimentoId })
        .from(produtosCru)
        .where(eq(produtosCru.id, parseInt(id)))
        .limit(1)
      if (prod?.solicitacaoDesenvolvimentoId) {
        await db
          .update(solicitacoes)
          .set({ status: "PILOTAGEM", updatedAt: new Date() })
          .where(eq(solicitacoes.id, prod.solicitacaoDesenvolvimentoId))
        await notificar("SOLICITACAO_ATUALIZADA", `Solicitação #${prod.solicitacaoDesenvolvimentoId} avançou para Pilotagem (amostra tecido cru #${aid})`, `/comercial/solicitacoes/${prod.solicitacaoDesenvolvimentoId}`, session.user.name)
      }
    }

    // Se a amostra estava em produção e foi reprovada, volta solicitação para Em Desenvolvimento
    if (body.status === "REPROVADA" && (statusAnterior === "EM_PRODUCAO_TEC" || statusAnterior === "EM_PRODUCAO_BEN")) {
      const [prod] = await db
        .select({ solicitacaoDesenvolvimentoId: produtosCru.solicitacaoDesenvolvimentoId })
        .from(produtosCru)
        .where(eq(produtosCru.id, parseInt(id)))
        .limit(1)
      if (prod?.solicitacaoDesenvolvimentoId) {
        await db
          .update(solicitacoes)
          .set({ status: "EM_DESENVOLVIMENTO", updatedAt: new Date() })
          .where(eq(solicitacoes.id, prod.solicitacaoDesenvolvimentoId))
        await notificar("SOLICITACAO_ATUALIZADA", `Solicitação #${prod.solicitacaoDesenvolvimentoId} voltou para Em Desenvolvimento (amostra tecido cru #${aid} reprovada)`, `/comercial/solicitacoes/${prod.solicitacaoDesenvolvimentoId}`, session.user.name)
      }
    }

    await registrarLog({ tipo: "ATUALIZACAO", acao: "atualizar_status", descricao: `Amostra tecido cru #${aid} alterada para ${body.status}`, entidade: "AmostraTecidoCru", entidadeId: parseInt(aid), usuarioNome: session.user.name })

    return NextResponse.json(atualizado)
  } catch (error) {
    console.error("[PUT /api/cadastros/produto-cru/[id]/amostras/[aid]]", error)
    return NextResponse.json({ error: "Erro ao atualizar amostra" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    if (session.user.role !== "ADMIN" && session.user.role !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir amostras" }, { status: 403 })
    }

    const { id, aid } = await params

    await db
      .delete(produtoCruAmostra)
      .where(
        and(
          eq(produtoCruAmostra.id, parseInt(aid)),
          eq(produtoCruAmostra.produtoCruId, parseInt(id))
        )
      )

    await notificar(
      "AMOSTRA_EXCLUIDA",
       `Amostra #${aid} do produto #${id} foi excluída por ${session.user.name}`,
      `/cadastros/produto-cru/${id}?tab=amostras`,
      session.user.name
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/cadastros/produto-cru/[id]/amostras/[aid]")
  }
}
