import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { eq } from "drizzle-orm"
import { registrarLog, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [visita] = await db
      .select()
      .from(crmVisitas)
      .where(eq(crmVisitas.id, parseInt(id)))
      .limit(1)

    if (!visita) {
      return NextResponse.json({ error: "Visita não encontrada" }, { status: 404 })
    }

    return NextResponse.json(visita)
  } catch (error) {
    return handleApiError(error, "GET /api/crm/visitas/[id]")
  }
}

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
      .from(crmVisitas)
      .where(eq(crmVisitas.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Visita não encontrada" }, { status: 404 })
    }

    const values: Record<string, any> = { updatedAt: new Date() }
    if (body.empresaId !== undefined) values.empresaId = body.empresaId
    if (body.oportunidadeId !== undefined) values.oportunidadeId = body.oportunidadeId
    if (body.contatoId !== undefined) values.contatoId = body.contatoId
    if (body.dataVisita !== undefined) values.dataVisita = body.dataVisita
    if (body.tipo !== undefined) values.tipo = body.tipo
    if (body.status !== undefined) values.status = body.status
    if (body.motivoCancelamento !== undefined) values.motivoCancelamento = body.motivoCancelamento
    if (body.relato !== undefined) values.relato = body.relato
    if (body.fotos !== undefined) values.fotos = body.fotos

    const [atualizada] = await db
      .update(crmVisitas)
      .set(values)
      .where(eq(crmVisitas.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Visita #${id} atualizada`,
      entidade: "CrmVisita",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/visitas/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if (auth.session.user.role !== "ADMIN" && auth.session.user.role !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 })
    }

    const { id } = await params
    await db.delete(crmVisitas).where(eq(crmVisitas.id, parseInt(id)))

    await notificarDelecao("Visita CRM", id, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/visitas/[id]")
  }
}
