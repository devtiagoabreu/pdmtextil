import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruReceita as receitas } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, aid: string, asid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { asid } = await params
    const lista = await db.select().from(receitas)
      .where(eq(receitas.amostraId, parseInt(asid)))
      .orderBy(desc(receitas.createdAt))
    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET receitas]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, aid: string, asid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { asid } = await params
    const body = await req.json()

    if (!body.descricao) {
      return NextResponse.json({ error: "Descrição obrigatória" }, { status: 400 })
    }

    const [nova] = await db.insert(receitas).values({
      amostraId: parseInt(asid),
      descricao: body.descricao,
      instrucoes: body.instrucoes || null,
    }).returning()

    return NextResponse.json(nova)
  } catch (error) {
    console.error("[POST receitas]", error)
    return NextResponse.json({ error: "Erro ao criar" }, { status: 500 })
  }
}
