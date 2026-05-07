import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { basesUrdume } from "@/lib/db/schema/bases-urdume"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = parseInt((await params).id)
    const base = await db.select().from(basesUrdume).where(eq(basesUrdume.id, id)).limit(1)

    if (!base[0]) {
      return NextResponse.json({ error: "Base não encontrada" }, { status: 404 })
    }

    return NextResponse.json(base[0])
  } catch (error) {
    console.error("[GET /api/cadastros/bases-urdume/[id]]", error)
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

    const baseAtualizada = await db
      .update(basesUrdume)
      .set({
        nome: body.nome,
        descricao: body.descricao || null,
        composicaoFios: body.composicaoFios || null,
        densidade: body.densidade || null,
        tratamentoEncolagem: body.tratamentoEncolagem || null,
        tensaoUrdume: body.tensaoUrdume || null,
        largura: body.largura || null,
        observacoes: body.observacoes || null,
        ativo: body.ativo ?? true,
        updatedAt: new Date(),
      })
      .where(eq(basesUrdume.id, id))
      .returning()

    if (!baseAtualizada[0]) {
      return NextResponse.json({ error: "Base não encontrada" }, { status: 404 })
    }

    return NextResponse.json(baseAtualizada[0])
  } catch (error) {
    console.error("[PUT /api/cadastros/bases-urdume/[id]]", error)
    return NextResponse.json({ error: "Erro ao atualizar base" }, { status: 500 })
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
    await db.delete(basesUrdume).where(eq(basesUrdume.id, id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/bases-urdume/[id]]", error)
    return NextResponse.json({ error: "Erro ao excluir base" }, { status: 500 })
  }
}