import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { estampas } from "@/lib/db/schema/estampas"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = parseInt((await params).id)
    const estampa = await db.select().from(estampas).where(eq(estampas.id, id)).limit(1)

    if (!estampa[0]) {
      return NextResponse.json({ error: "Estampa não encontrada" }, { status: 404 })
    }

    return NextResponse.json(estampa[0])
  } catch (error) {
    console.error("[GET /api/cadastros/estampas/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = parseInt((await params).id)
    const body = await req.json()

    const estampaAtualizada = await db
      .update(estampas)
      .set({
        nome: body.nome,
        codigoDesenho: body.codigoDesenho,
        variante: body.variante || "01",
        tipo: body.tipo || null,
        imagemUrl: body.imagemUrl || null,
        ativo: body.ativo ?? true,
        updatedAt: new Date(),
      })
      .where(eq(estampas.id, id))
      .returning()

    if (!estampaAtualizada[0]) {
      return NextResponse.json({ error: "Estampa não encontrada" }, { status: 404 })
    }

    return NextResponse.json(estampaAtualizada[0])
  } catch (error) {
    console.error("[PUT /api/cadastros/estampas/[id]]", error)
    return NextResponse.json({ error: "Erro ao atualizar estampa" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = parseInt((await params).id)
    await db.delete(estampas).where(eq(estampas.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/estampas/[id]]", error)
    return NextResponse.json({ error: "Erro ao excluir estampa" }, { status: 500 })
  }
}