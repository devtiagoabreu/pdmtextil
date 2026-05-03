import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const resultado = await db
      .select()
      .from(solicitacoes)
      .where(eq(solicitacoes.id, parseInt(id)))
      .limit(1)

    if (!resultado[0]) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 })
    }

    return NextResponse.json(resultado[0])
  } catch (error) {
    console.error("[GET /api/solicitacoes/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const [solicitacaoAtualizada] = await db
      .update(solicitacoes)
      .set({
        ...body,
        updatedAt: new Date(),
      })
      .where(eq(solicitacoes.id, parseInt(id)))
      .returning()

    return NextResponse.json(solicitacaoAtualizada)
  } catch (error: any) {
    console.error("[PUT /api/solicitacoes/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db
      .delete(solicitacoes)
      .where(eq(solicitacoes.id, parseInt(id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/solicitacoes/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}