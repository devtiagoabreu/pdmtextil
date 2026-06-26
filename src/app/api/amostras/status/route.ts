import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAmostra, produtoCruAcabamento, produtoCruAcabamentoAmostra } from "@/lib/db/schema/produto-cru"
import { eq, and } from "drizzle-orm"
import { getValidStatuses } from "@/lib/status-utils"
import { registrarLog } from "@/lib/notificar"

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userId = auth.userId

    const body = await req.json()
    const { tipo, id, status: novoStatus, produtoCruId, acabamentoId } = body

    if (!tipo || !id || !novoStatus) {
      return NextResponse.json({ error: "tipo, id e status são obrigatórios" }, { status: 400 })
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
        .select({ status: produtoCruAmostra.status, historico: produtoCruAmostra.historico })
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
      })

      const [updated] = await db
        .update(produtoCruAmostra)
        .set({ status: novoStatus, historico })
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

      return NextResponse.json(updated)

    } else if (tipo === "acabamento") {
      if (!acabamentoId) {
        return NextResponse.json({ error: "acabamentoId é obrigatório para amostras de acabamento" }, { status: 400 })
      }

      const [amostra] = await db
        .select({ status: produtoCruAcabamentoAmostra.status, historico: produtoCruAcabamentoAmostra.historico })
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
      })

      const [updated] = await db
        .update(produtoCruAcabamentoAmostra)
        .set({ status: novoStatus, historico })
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

      return NextResponse.json(updated)
    }

    return NextResponse.json({ error: "tipo deve ser 'tecido_cru' ou 'acabamento'" }, { status: 400 })
  } catch (error) {
    console.error("[PATCH /api/amostras/status]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
