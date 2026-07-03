import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { eq, desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get("empresaId")

    let query = db
      .select()
      .from(crmContatos)
      .orderBy(desc(crmContatos.createdAt))

    if (empresaId) {
      query.where(eq(crmContatos.empresaId, parseInt(empresaId)))
    }

    const lista = await query
    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/contatos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()

    const [novo] = await db
      .insert(crmContatos)
      .values({
        nome: body.nome,
        cargo: body.cargo || null,
        email: body.email || null,
        telefone: body.telefone || null,
        celular: body.celular || null,
        whatsapp: body.whatsapp || null,
        principal: body.principal || false,
        observacoes: body.observacoes || null,
        empresaId: body.empresaId,
      })
      .returning()

    return NextResponse.json(novo, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/contatos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
