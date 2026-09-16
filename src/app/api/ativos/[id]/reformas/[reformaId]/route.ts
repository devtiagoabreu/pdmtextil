import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { ativosReformas } from "@/lib/db/schema/ativos"
import { eq, and } from "drizzle-orm"
import { registrarLog, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { ativoReformaSchema } from "@/lib/validation"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reformaId: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id, reformaId } = await params
    const body = await req.json()
    const parsed = validateRequest(ativoReformaSchema, body)
    if ("error" in parsed) return parsed.error

    const [existente] = await db
      .select()
      .from(ativosReformas)
      .where(
        and(eq(ativosReformas.ativoId, parseInt(id)), eq(ativosReformas.id, parseInt(reformaId)))
      )
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Reforma não encontrada" }, { status: 404 })
    }

    const [atualizada] = await db
      .update(ativosReformas)
      .set({
        data: parsed.data.data,
        valor: parsed.data.valor ?? existente.valor,
        extensaoVidaUtilAnos: parsed.data.extensaoVidaUtilAnos ?? existente.extensaoVidaUtilAnos,
        motivo: parsed.data.motivo ?? existente.motivo,
        descricao: parsed.data.descricao ?? existente.descricao,
        updatedAt: new Date(),
      })
      .where(eq(ativosReformas.id, parseInt(reformaId)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Reforma #${reformaId} do ativo #${id} atualizada`,
      entidade: "AtivoReforma",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/ativos/[id]/reformas/[reformaId]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; reformaId: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if ((auth.session.user?.role ?? "") !== "ADMIN" && (auth.session.user?.role ?? "") !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 })
    }

    const { id, reformaId } = await params

    const [existente] = await db
      .select()
      .from(ativosReformas)
      .where(
        and(eq(ativosReformas.ativoId, parseInt(id)), eq(ativosReformas.id, parseInt(reformaId)))
      )
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Reforma não encontrada" }, { status: 404 })
    }

    await db.delete(ativosReformas).where(eq(ativosReformas.id, parseInt(reformaId)))

    await notificarDelecao(
      "Reforma de ativo",
      `#${existente.id} (${existente.data})`,
      auth.session.user.name
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/ativos/[id]/reformas/[reformaId]")
  }
}
