import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtoCruAmostra } from "@/lib/db/schema/produto-cru"
import { eq, and } from "drizzle-orm"

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { aid } = await params
    const body = await req.json()

    const atualizado = await db
      .update(produtoCruAmostra)
      .set({
        descricao: body.descricao,
        status: body.status,
        observacoes: body.observacoes || null,
      })
      .where(eq(produtoCruAmostra.id, parseInt(aid)))
      .returning()

    return NextResponse.json(atualizado[0])
  } catch (error) {
    console.error("[PUT /api/cadastros/produto-cru/[id]/amostras/[aid]]", error)
    return NextResponse.json({ error: "Erro ao atualizar amostra" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; aid: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id, aid } = await params
    await db
      .delete(produtoCruAmostra)
      .where(
        and(
          eq(produtoCruAmostra.id, parseInt(aid)),
          eq(produtoCruAmostra.produtoCruId, parseInt(id))
        )
      )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/produto-cru/[id]/amostras/[aid]]", error)
    return NextResponse.json({ error: "Erro ao excluir amostra" }, { status: 500 })
  }
}
