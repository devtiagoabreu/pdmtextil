import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtosQuimicos } from "@/lib/db/schema/produtos-quimicos"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const [item] = await db.select().from(produtosQuimicos).where(eq(produtosQuimicos.id, parseInt(id))).limit(1)
    if (!item) return NextResponse.json({ error: "Não encontrado" }, { status: 404 })
    return NextResponse.json(item)
  } catch (error) {
    console.error("[GET /api/cadastros/produtos-quimicos/[id]]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    await db.update(produtosQuimicos).set({
      codigo: body.codigo,
      nome: body.nome,
      descricao: body.descricao || null,
      categoria: body.categoria || null,
      unidadePadrao: body.unidadePadrao || "kg",
      tipo: body.tipo || null,
      concentracao: body.concentracao || null,
      densidade: body.densidade || null,
      ph: body.ph || null,
      observacoes: body.observacoes || null,
      fichaSeguranca: body.fichaSeguranca || null,
      idIntegracao: body.idIntegracao || null,
      ativo: body.ativo ?? true,
      updatedAt: new Date(),
    }).where(eq(produtosQuimicos.id, parseInt(id)))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message?.includes("duplicate")) {
      return NextResponse.json({ error: "Código já existe" }, { status: 400 })
    }
    console.error("[PUT /api/cadastros/produtos-quimicos/[id]]", error)
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    await db.delete(produtosQuimicos).where(eq(produtosQuimicos.id, parseInt(id)))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/produtos-quimicos/[id]]", error)
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 })
  }
}
