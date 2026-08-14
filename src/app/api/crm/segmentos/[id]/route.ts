import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmSegmentos } from "@/lib/db/schema/crm-segmentos"
import { eq } from "drizzle-orm"
import { registrarLog, notificar, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const body = await req.json()

    const [existente] = await db
      .select()
      .from(crmSegmentos)
      .where(eq(crmSegmentos.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Segmento não encontrado" }, { status: 404 })
    }

    const values: Record<string, any> = {}
    if (body.nome !== undefined) values.nome = body.nome
    if (body.ativo !== undefined) values.ativo = body.ativo
    values.updatedAt = new Date()

    const [atualizado] = await db
      .update(crmSegmentos)
      .set(values)
      .where(eq(crmSegmentos.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Segmento #${id} atualizado`,
      entidade: "CrmSegmento",
      entidadeId: atualizado.id,
      usuarioNome: session.user.name,
    })

    await notificar("SEGMENTO_ATUALIZADO", `Segmento #${id} atualizado`, `/comercial/crm/segmentos`, session.user.name)

    return NextResponse.json(atualizado)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/segmentos/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if ((auth.session.user?.role ?? "") !== "ADMIN" && (auth.session.user?.role ?? "") !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 })
    }

    const { id } = await params
    await db.delete(crmSegmentos).where(eq(crmSegmentos.id, parseInt(id)))

    await notificarDelecao("Segmento CRM", id, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/segmentos/[id]")
  }
}
