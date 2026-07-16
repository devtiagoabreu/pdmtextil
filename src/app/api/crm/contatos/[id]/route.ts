import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { eq } from "drizzle-orm"
import { notificar } from "@/lib/notificar"
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
      .from(crmContatos)
      .where(eq(crmContatos.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Contato não encontrado" }, { status: 404 })
    }

    const values: Record<string, any> = { updatedAt: new Date() }
    if (body.nome !== undefined) values.nome = body.nome
    if (body.cargo !== undefined) values.cargo = body.cargo || null
    if (body.email !== undefined) values.email = body.email || null
    if (body.telefone !== undefined) values.telefone = body.telefone || null
    if (body.celular !== undefined) values.celular = body.celular || null
    if (body.whatsapp !== undefined) values.whatsapp = body.whatsapp || null
    if (body.principal !== undefined) values.principal = body.principal
    if (body.observacoes !== undefined) values.observacoes = body.observacoes || null
    if (body.empresaId !== undefined) values.empresaId = body.empresaId

    const [atualizado] = await db
      .update(crmContatos)
      .set(values)
      .where(eq(crmContatos.id, parseInt(id)))
      .returning()

    await notificar("CONTATO_ATUALIZADO", `Contato #${id} atualizado`, `/comercial/crm/contatos/${id}`, session.user.name)

    return NextResponse.json(atualizado)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/contatos/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    await db.delete(crmContatos).where(eq(crmContatos.id, parseInt(id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/contatos/[id]")
  }
}
