import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAcabamento, produtoCruAcabamentoAmostra, produtosCru } from "@/lib/db/schema/produto-cru"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { eq, and } from "drizzle-orm"
import { notificar, registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateAcabamentoChain } from "@/lib/validate-ownership"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string; asid: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userIdResult = auth.userId

    const { id, aid, asid } = await params

    const err = await validateAcabamentoChain(parseInt(id), parseInt(aid))
    if (err) return err

    const body = await req.json()

    const isAprovacao = body.status.startsWith("APROVADA") || body.status === "REPROVADA"

    if (isAprovacao && !["COMERCIAL", "ADMIN", "SUDO"].includes(session.user.role)) {
      return NextResponse.json({ error: "Apenas COMERCIAL, ADMIN e SUDO podem aprovar/reprovar amostras" }, { status: 403 })
    }

    if (isAprovacao && !body.motivoAprovacao?.trim()) {
      return NextResponse.json({ error: "Motivo é obrigatório para aprovar ou reprovar" }, { status: 400 })
    }

    // Buscar estado atual para pegar o historico existente
    const [atual] = await db
      .select({ status: produtoCruAcabamentoAmostra.status, historico: produtoCruAcabamentoAmostra.historico })
      .from(produtoCruAcabamentoAmostra)
      .where(eq(produtoCruAcabamentoAmostra.id, parseInt(asid)))
      .limit(1)

    const historicoAtual: any[] = (atual?.historico as any[]) || []
    const statusAnterior = atual?.status

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

    const atualizado = await db
      .update(produtoCruAcabamentoAmostra)
      .set({
        descricao: body.descricao,
        status: body.status,
        historico: historicoAtual,
        motivoAprovacao: isAprovacao ? body.motivoAprovacao : body.motivoAprovacao || null,
        observacoes: body.observacoes || null,
        quantidadeProduzida: body.quantidadeProduzida || null,
        links: body.links !== undefined ? body.links : undefined,
        dados: body.dados !== undefined ? body.dados : undefined,
      })
      .where(
        and(
          eq(produtoCruAcabamentoAmostra.id, parseInt(asid)),
          eq(produtoCruAcabamentoAmostra.acabamentoId, parseInt(aid))
        )
      )
      .returning()

    if (atualizado[0]) {
      if (isAprovacao) {
        await notificar(
          body.status.startsWith("APROVADA") ? "AMOSTRA_APROVADA" : "AMOSTRA_REPROVADA",
          `Amostra de acabamento #${asid} (acabamento #${aid}) do produto cru #${id} foi ${body.status.startsWith("APROVADA") ? "aprovada" : "reprovada"} por ${session.user.name}${body.motivoAprovacao ? ` — Motivo: ${body.motivoAprovacao}` : ""}`,
          `/cadastros/produto-cru/${id}?tab=amostras&amostraId=amostra-acab-${aid}-${asid}`,
          session.user.name
        )
      } else {
        await notificar(
          "AMOSTRA_ATUALIZADA",
          `Amostra de acabamento #${asid} (acabamento #${aid}) do produto cru #${id} foi editada por ${session.user.name}`,
          `/cadastros/produto-cru/${id}?tab=amostras&amostraId=amostra-acab-${aid}-${asid}`,
          session.user.name
        )
      }
    }

    // Se a amostra entrou em produção no beneficiamento, avança solicitação para Pilotagem
    if (body.status === "EM_PRODUCAO_BEN") {
      const [acab] = await db
        .select({ produtoCruId: produtoCruAcabamento.produtoCruId })
        .from(produtoCruAcabamento)
        .where(eq(produtoCruAcabamento.id, parseInt(aid)))
        .limit(1)
      if (acab?.produtoCruId) {
        const [prod] = await db
          .select({ solicitacaoDesenvolvimentoId: produtosCru.solicitacaoDesenvolvimentoId })
          .from(produtosCru)
          .where(eq(produtosCru.id, acab.produtoCruId))
          .limit(1)
        if (prod?.solicitacaoDesenvolvimentoId) {
          await db
            .update(solicitacoes)
            .set({ status: "PILOTAGEM", updatedAt: new Date() })
            .where(eq(solicitacoes.id, prod.solicitacaoDesenvolvimentoId))
          await notificar("SOLICITACAO_ATUALIZADA", `Solicitação #${prod.solicitacaoDesenvolvimentoId} avançou para Pilotagem (amostra acabamento #${asid})`, `/comercial/solicitacoes/${prod.solicitacaoDesenvolvimentoId}`, session.user.name)
        }
      }
    }

    await registrarLog({ tipo: "ATUALIZACAO", acao: "atualizar_status", descricao: `Amostra acabamento #${asid} alterada para ${body.status}`, entidade: "AmostraAcabamento", entidadeId: parseInt(asid), usuarioNome: session.user.name })

    return NextResponse.json(atualizado[0])
  } catch (error) {
    console.error("[PUT /api/cadastros/produto-cru/[id]/acabamentos/[aid]/amostras/[asid]]", error)
    return NextResponse.json({ error: "Erro ao atualizar amostra" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string; asid: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    if (session.user.role !== "ADMIN" && session.user.role !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir amostras" }, { status: 403 })
    }

    const { id, aid, asid } = await params

    const err = await validateAcabamentoChain(parseInt(id), parseInt(aid))
    if (err) return err

    await db
      .delete(produtoCruAcabamentoAmostra)
      .where(
        and(
          eq(produtoCruAcabamentoAmostra.id, parseInt(asid)),
          eq(produtoCruAcabamentoAmostra.acabamentoId, parseInt(aid))
        )
      )

    await notificar(
      "AMOSTRA_EXCLUIDA",
      `Amostra de acabamento #${asid} (acabamento #${aid}) do produto cru #${id} foi excluída por ${session.user.name}`,
      `/cadastros/produto-cru/${id}?tab=amostras`,
      session.user.name
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/cadastros/produto-cru/[id]/acabamentos/[aid]/amostras/[asid]")
  }
}
