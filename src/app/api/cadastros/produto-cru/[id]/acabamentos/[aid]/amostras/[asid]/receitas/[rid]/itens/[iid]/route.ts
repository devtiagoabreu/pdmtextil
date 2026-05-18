import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruReceitaItem as receitaItens } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ iid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { iid } = await params
    const body = await req.json()

    await db.update(receitaItens).set({
      quimicoId: body.quimicoId ?? null,
      descricao: body.descricao || null,
      unidade: body.unidade || "g/L",
      quantidadeMetro: body.quantidadeMetro,
      estagio: body.estagio || "A",
      ordem: body.ordem,
    }).where(eq(receitaItens.id, parseInt(iid)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PUT item]", error)
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ iid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { iid } = await params
    await db.delete(receitaItens).where(eq(receitaItens.id, parseInt(iid)))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE item]", error)
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 })
  }
}
