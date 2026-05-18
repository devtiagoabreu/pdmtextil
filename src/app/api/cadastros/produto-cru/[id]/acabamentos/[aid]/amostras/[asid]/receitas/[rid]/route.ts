import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruReceita as receitas } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, aid: string, asid: string, rid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { rid } = await params
    const [receita] = await db.select().from(receitas).where(eq(receitas.id, parseInt(rid))).limit(1)
    if (!receita) return NextResponse.json({ error: "Não encontrada" }, { status: 404 })
    return NextResponse.json(receita)
  } catch (error) {
    console.error("[GET receita]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, aid: string, asid: string, rid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { rid } = await params
    const body = await req.json()

    await db.update(receitas).set({
      descricao: body.descricao,
      instrucoes: body.instrucoes || null,
      updatedAt: new Date(),
    }).where(eq(receitas.id, parseInt(rid)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT receita]", error)
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string, aid: string, asid: string, rid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { rid } = await params
    await db.delete(receitas).where(eq(receitas.id, parseInt(rid)))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE receita]", error)
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 })
  }
}
