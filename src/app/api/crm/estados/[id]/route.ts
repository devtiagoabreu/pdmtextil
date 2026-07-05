import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmEstados } from "@/lib/db/schema/crm-estados"
import { eq } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const body = await req.json()

    const [existente] = await db
      .select()
      .from(crmEstados)
      .where(eq(crmEstados.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Estado não encontrado" }, { status: 404 })
    }

    const values: Record<string, any> = {}
    if (body.nome !== undefined) values.nome = body.nome
    if (body.uf !== undefined) values.uf = String(body.uf).toUpperCase().trim()
    if (body.regiao !== undefined) values.regiao = String(body.regiao).toUpperCase().trim() || null

    const [atualizado] = await db
      .update(crmEstados)
      .set(values)
      .where(eq(crmEstados.id, parseInt(id)))
      .returning()

    return NextResponse.json(atualizado)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/estados/[id]")
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
    await db.delete(crmEstados).where(eq(crmEstados.id, parseInt(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/estados/[id]")
  }
}
