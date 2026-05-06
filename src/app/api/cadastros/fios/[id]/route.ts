import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { fios } from "@/lib/db/schema/fios"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const fio = await db
      .select()
      .from(fios)
      .where(eq(fios.id, parseInt(id)))
      .limit(1)

    if (fio.length === 0) {
      return NextResponse.json({ error: "Fio não encontrado" }, { status: 404 })
    }

    return NextResponse.json(fio[0])
  } catch (error) {
    console.error("[GET /api/cadastros/fios/[id]]", error)
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

    const { id } = await params
    const body = await req.json()

    const atualizado = await db
      .update(fios)
      .set({
        codigoFio: body.codigoFio,
        nome: body.nome,
        nomeComercial: body.nomeComercial || null,
        composicao: body.composicao || null,
        titulo: body.titulo || null,
        torcao: body.torcao || null,
        resistencia: body.resistencia ? parseFloat(body.resistencia) : null,
        alongamento: body.alongamento ? parseFloat(body.alongamento) : null,
        fornecedor: body.fornecedor || null,
        observacoes: body.observacoes || null,
        ativo: body.ativo,
        updatedAt: new Date(),
      })
      .where(eq(fios.id, parseInt(id)))
      .returning()

    if (atualizado.length === 0) {
      return NextResponse.json({ error: "Fio não encontrado" }, { status: 404 })
    }

    return NextResponse.json(atualizado[0])
  } catch (error) {
    console.error("[PUT /api/cadastros/fios/[id]]", error)
    return NextResponse.json({ error: "Erro ao atualizar fio" }, { status: 500 })
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
    const deleted = await db
      .delete(fios)
      .where(eq(fios.id, parseInt(id)))
      .returning()

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Fio não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/fios/[id]]", error)
    return NextResponse.json({ error: "Erro ao excluir fio" }, { status: 500 })
  }
}