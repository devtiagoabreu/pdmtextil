import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmPaises } from "@/lib/db/schema/crm-paises"
import { eq } from "drizzle-orm"

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
      .from(crmPaises)
      .where(eq(crmPaises.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "País não encontrado" }, { status: 404 })
    }

    const values: Record<string, any> = {}
    if (body.nome !== undefined) values.nome = String(body.nome).trim()
    if (body.codigo !== undefined) values.codigo = String(body.codigo).trim()

    const [atualizado] = await db
      .update(crmPaises)
      .set(values)
      .where(eq(crmPaises.id, parseInt(id)))
      .returning()

    return NextResponse.json(atualizado)
  } catch (error) {
    console.error("[PUT /api/crm/paises/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
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
    await db.delete(crmPaises).where(eq(crmPaises.id, parseInt(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/crm/paises/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
