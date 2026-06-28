import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { requisicoesAmostraComercial } from "@/lib/db/schema/requisicoes-amostra-comercial"
import { eq } from "drizzle-orm"
import { getValidStatuses } from "@/lib/status-utils"
import { registrarLog } from "@/lib/log"

export const dynamic = "force-dynamic"

export async function PATCH(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { session } = auth

    const body = await req.json()
    const { id, novoStatus, motivo } = body

    if (!id || !novoStatus) {
      return NextResponse.json({ error: "id e novoStatus são obrigatórios" }, { status: 400 })
    }

    const validStatuses = await getValidStatuses("AMOSTRA_COMERCIAL")
    if (!validStatuses.includes(novoStatus)) {
      return NextResponse.json({ error: `Status inválido. Use: ${validStatuses.join(", ")}` }, { status: 400 })
    }

    const [existing] = await db
      .select()
      .from(requisicoesAmostraComercial)
      .where(eq(requisicoesAmostraComercial.id, parseInt(id)))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Requisição não encontrada" }, { status: 404 })
    }

    const historico = (Array.isArray(existing.historico) ? existing.historico : []) as Array<Record<string, unknown>>
    historico.push({
      data: new Date().toISOString(),
      usuario: session.user.name,
      acao: "MUDANCA_STATUS",
      de: existing.status,
      para: novoStatus,
      motivo: motivo || null,
    })

    const [updated] = await db
      .update(requisicoesAmostraComercial)
      .set({
        status: novoStatus,
        historico,
        updatedAt: new Date(),
      })
      .where(eq(requisicoesAmostraComercial.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "status_requisicao_amostra_comercial",
      descricao: `Requisição de amostra comercial #${id} alterada de ${existing.status} para ${novoStatus}`,
      entidade: "RequisicaoAmostraComercial",
      entidadeId: parseInt(id),
      usuarioNome: session.user.name,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[PATCH /api/requisicoes-amostra-comercial/status]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
