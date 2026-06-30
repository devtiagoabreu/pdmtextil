import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAmostra, produtoCruAcabamento, produtoCruAcabamentoAmostra, produtosCru } from "@/lib/db/schema/produto-cru"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { eq, and } from "drizzle-orm"
import { getValidStatuses } from "@/lib/status-utils"
import { registrarLog, notificar } from "@/lib/notificar"

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userId = auth.userId

    const body = await req.json()
    const { tipo, id, status: novoStatus, produtoCruId, acabamentoId, motivo } = body

    if (!tipo || !id || !novoStatus) {
      return NextResponse.json({ error: "tipo, id e status são obrigatórios" }, { status: 400 })
    }

    const precisaMotivo = novoStatus.startsWith("APROVADA") || novoStatus === "REPROVADA"
    if (precisaMotivo && !motivo?.trim()) {
      return NextResponse.json({ error: "Motivo é obrigatório para aprovar ou reprovar" }, { status: 400 })
    }

    const validStatuses = await getValidStatuses("AMOSTRA")
    if (!validStatuses.includes(novoStatus)) {
      return NextResponse.json({ error: `Status inválido para amostra. Use: ${validStatuses.join(", ")}` }, { status: 400 })
    }

    if (tipo === "tecido_cru") {
      if (!produtoCruId) {
        return NextResponse.json({ error: "produtoCruId é obrigatório para amostras de tecido cru" }, { status: 400 })
      }

      const [amostra] = await db
        .select({ status: produtoCruAmostra.status, historico: produtoCruAmostra.historico, observacoes: produtoCruAmostra.observacoes })
        .from(produtoCruAmostra)
        .where(and(eq(produtoCruAmostra.id, id), eq(produtoCruAmostra.produtoCruId, produtoCruId)))

      if (!amostra) {
        return NextResponse.json({ error: "Amostra não encontrada" }, { status: 404 })
      }

      const historico = (Array.isArray(amostra.historico) ? amostra.historico : []) as any[]
      historico.push({
        data: new Date().toISOString(),
        usuario: session?.user?.name || "Sistema",
        usuarioId: userId,
        acao: "MUDANCA_STATUS",
        de: amostra.status,
        para: novoStatus,
        motivo: motivo || null,
      })

      const observacoesAtual = amostra.observacoes || ""
      const observacoesFinal = motivo?.trim()
        ? [observacoesAtual, `⛔ ${novoStatus.startsWith("APROVADA") ? "Aprovado" : "Reprovado"} por ${session?.user?.name || "Sistema"}: ${motivo.trim()}`].filter(Boolean).join("\n")
        : observacoesAtual

      const [updated] = await db
        .update(produtoCruAmostra)
        .set({ status: novoStatus, historico, motivoAprovacao: motivo || null, observacoes: observacoesFinal })
        .where(eq(produtoCruAmostra.id, id))
        .returning()

      await registrarLog({
        tipo: "ATUALIZACAO",
        acao: "status_amostra",
        descricao: `Amostra tecido cru #${id} alterada de ${amostra.status} para ${novoStatus}`,
        entidade: "Amostra",
        entidadeId: id,
        usuarioNome: session?.user?.name || "Sistema",
      })

      if (precisaMotivo) {
        await notificar(
          novoStatus.startsWith("APROVADA") ? "AMOSTRA_APROVADA" : "AMOSTRA_REPROVADA",
          `Amostra tecido cru #${id} foi ${novoStatus.startsWith("APROVADA") ? "aprovada" : "reprovada"} por ${session?.user?.name || "Sistema"}${motivo ? ` — Motivo: ${motivo}` : ""}`,
          `/cadastros/produto-cru/${produtoCruId}?tab=amostras&amostraId=amostra-${id}`,
          session?.user?.name || "Sistema"
        )
      }

      // Se estava em produção e foi reprovada, volta solicitação para Em Desenvolvimento
      if (novoStatus === "REPROVADA" && (amostra.status === "EM_PRODUCAO_TEC" || amostra.status === "EM_PRODUCAO_BEN")) {
        const [prod] = await db
          .select({ solicitacaoDesenvolvimentoId: produtosCru.solicitacaoDesenvolvimentoId })
          .from(produtosCru)
          .where(eq(produtosCru.id, produtoCruId))
          .limit(1)
        if (prod?.solicitacaoDesenvolvimentoId) {
          await db
            .update(solicitacoes)
            .set({ status: "EM_DESENVOLVIMENTO", updatedAt: new Date() })
            .where(eq(solicitacoes.id, prod.solicitacaoDesenvolvimentoId))
          await notificar("SOLICITACAO_ATUALIZADA", `Solicitação #${prod.solicitacaoDesenvolvimentoId} voltou para Em Desenvolvimento (amostra tecido cru #${id} reprovada)`, `/comercial/solicitacoes/${prod.solicitacaoDesenvolvimentoId}`, session?.user?.name || "Sistema")
        }
      }

      // Se foi movida para produção, avança solicitação vinculada para Pilotagem
      if (novoStatus === "EM_PRODUCAO_TEC") {
        const [prod] = await db
          .select({ solicitacaoDesenvolvimentoId: produtosCru.solicitacaoDesenvolvimentoId })
          .from(produtosCru)
          .where(eq(produtosCru.id, produtoCruId))
          .limit(1)
        if (prod?.solicitacaoDesenvolvimentoId) {
          const [sol] = await db
            .select({ status: solicitacoes.status })
            .from(solicitacoes)
            .where(eq(solicitacoes.id, prod.solicitacaoDesenvolvimentoId))
            .limit(1)
          if (sol && sol.status === "EM_DESENVOLVIMENTO") {
            await db
              .update(solicitacoes)
              .set({ status: "PILOTAGEM", updatedAt: new Date() })
              .where(eq(solicitacoes.id, prod.solicitacaoDesenvolvimentoId))
            await notificar("SOLICITACAO_ATUALIZADA", `Solicitação #${prod.solicitacaoDesenvolvimentoId} avançou para Pilotagem (amostra tecido cru #${id} em produção)`, `/comercial/solicitacoes/${prod.solicitacaoDesenvolvimentoId}`, session?.user?.name || "Sistema")
          }
        }
      }

      return NextResponse.json(updated)

    } else if (tipo === "acabamento") {
      if (!acabamentoId) {
        return NextResponse.json({ error: "acabamentoId é obrigatório para amostras de acabamento" }, { status: 400 })
      }

      const [amostra] = await db
        .select({ status: produtoCruAcabamentoAmostra.status, historico: produtoCruAcabamentoAmostra.historico, observacoes: produtoCruAcabamentoAmostra.observacoes })
        .from(produtoCruAcabamentoAmostra)
        .where(and(eq(produtoCruAcabamentoAmostra.id, id), eq(produtoCruAcabamentoAmostra.acabamentoId, acabamentoId)))

      if (!amostra) {
        return NextResponse.json({ error: "Amostra não encontrada" }, { status: 404 })
      }

      const historico = (Array.isArray(amostra.historico) ? amostra.historico : []) as any[]
      historico.push({
        data: new Date().toISOString(),
        usuario: session?.user?.name || "Sistema",
        usuarioId: userId,
        acao: "MUDANCA_STATUS",
        de: amostra.status,
        para: novoStatus,
        motivo: motivo || null,
      })

      const observacoesAtual = amostra.observacoes || ""
      const observacoesFinal = motivo?.trim()
        ? [observacoesAtual, `⛔ ${novoStatus.startsWith("APROVADA") ? "Aprovado" : "Reprovado"} por ${session?.user?.name || "Sistema"}: ${motivo.trim()}`].filter(Boolean).join("\n")
        : observacoesAtual

      const [updated] = await db
        .update(produtoCruAcabamentoAmostra)
        .set({ status: novoStatus, historico, motivoAprovacao: motivo || null, observacoes: observacoesFinal })
        .where(eq(produtoCruAcabamentoAmostra.id, id))
        .returning()

      await registrarLog({
        tipo: "ATUALIZACAO",
        acao: "status_amostra",
        descricao: `Amostra acabamento #${id} alterada de ${amostra.status} para ${novoStatus}`,
        entidade: "Amostra",
        entidadeId: id,
        usuarioNome: session?.user?.name || "Sistema",
      })

      if (precisaMotivo) {
        const pid = produtoCruId || acabamentoId
        await notificar(
          novoStatus.startsWith("APROVADA") ? "AMOSTRA_APROVADA" : "AMOSTRA_REPROVADA",
          `Amostra acabamento #${id} foi ${novoStatus.startsWith("APROVADA") ? "aprovada" : "reprovada"} por ${session?.user?.name || "Sistema"}${motivo ? ` — Motivo: ${motivo}` : ""}`,
          `/cadastros/produto-cru/${pid}?tab=amostras&amostraId=amostra-acab-${acabamentoId}-${id}`,
          session?.user?.name || "Sistema"
        )
      }

      // Se estava em produção e foi reprovada, volta solicitação para Em Desenvolvimento
      if (novoStatus === "REPROVADA" && (amostra.status === "EM_PRODUCAO_BEN" || amostra.status === "EM_PRODUCAO_TEC")) {
        const pid = produtoCruId
        if (pid) {
          const [prod] = await db
            .select({ solicitacaoDesenvolvimentoId: produtosCru.solicitacaoDesenvolvimentoId })
            .from(produtosCru)
            .where(eq(produtosCru.id, pid))
            .limit(1)
          if (prod?.solicitacaoDesenvolvimentoId) {
            await db
              .update(solicitacoes)
              .set({ status: "EM_DESENVOLVIMENTO", updatedAt: new Date() })
              .where(eq(solicitacoes.id, prod.solicitacaoDesenvolvimentoId))
            await notificar("SOLICITACAO_ATUALIZADA", `Solicitação #${prod.solicitacaoDesenvolvimentoId} voltou para Em Desenvolvimento (amostra acabamento #${id} reprovada)`, `/comercial/solicitacoes/${prod.solicitacaoDesenvolvimentoId}`, session?.user?.name || "Sistema")
          }
        }
      }

      // Se foi movida para produção, avança solicitação vinculada para Pilotagem
      if (novoStatus === "EM_PRODUCAO_BEN") {
        const pid = produtoCruId
        if (pid) {
          const [prod] = await db
            .select({ solicitacaoDesenvolvimentoId: produtosCru.solicitacaoDesenvolvimentoId })
            .from(produtosCru)
            .where(eq(produtosCru.id, pid))
            .limit(1)
          if (prod?.solicitacaoDesenvolvimentoId) {
            const [sol] = await db
              .select({ status: solicitacoes.status })
              .from(solicitacoes)
              .where(eq(solicitacoes.id, prod.solicitacaoDesenvolvimentoId))
              .limit(1)
            if (sol && sol.status === "EM_DESENVOLVIMENTO") {
              await db
                .update(solicitacoes)
                .set({ status: "PILOTAGEM", updatedAt: new Date() })
                .where(eq(solicitacoes.id, prod.solicitacaoDesenvolvimentoId))
              await notificar("SOLICITACAO_ATUALIZADA", `Solicitação #${prod.solicitacaoDesenvolvimentoId} avançou para Pilotagem (amostra acabamento #${id} em produção)`, `/comercial/solicitacoes/${prod.solicitacaoDesenvolvimentoId}`, session?.user?.name || "Sistema")
            }
          }
        }
      }

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: "tipo deve ser 'tecido_cru' ou 'acabamento'" }, { status: 400 })
  } catch (error) {
    console.error("[PATCH /api/amostras/status]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
