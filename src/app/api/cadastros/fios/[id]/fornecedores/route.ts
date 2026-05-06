import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { fiosFornecedores, fornecedores, fios } from "@/lib/db/schema/fios"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params

    const resultado = await db
      .select({
        id: fiosFornecedores.id,
        fioId: fiosFornecedores.fioId,
        fornecedorId: fiosFornecedores.fornecedorId,
        codigoFornecedor: fiosFornecedores.codigoFornecedor,
        observacoes: fiosFornecedores.observacoes,
        createdAt: fiosFornecedores.createdAt,
        fornecedorNome: fornecedores.nome,
        fornecedorCnpj: fornecedores.cnpj,
      })
      .from(fiosFornecedores)
      .leftJoin(fornecedores, eq(fiosFornecedores.fornecedorId, fornecedores.id))
      .where(eq(fiosFornecedores.fioId, parseInt(id)))

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("[GET /api/cadastros/fios/[id]/fornecedores]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const novo = await db
      .insert(fiosFornecedores)
      .values({
        fioId: parseInt(id),
        fornecedorId: body.fornecedorId,
        codigoFornecedor: body.codigoFornecedor || null,
        observacoes: body.observacoes || null,
      })
      .returning()

    return NextResponse.json(novo[0])
  } catch (error) {
    console.error("[POST /api/cadastros/fios/[id]/fornecedores]", error)
    return NextResponse.json({ error: "Erro ao adicionar fornecedor" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fornecedorId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { fornecedorId } = await params

    const deleted = await db
      .delete(fiosFornecedores)
      .where(eq(fiosFornecedores.id, parseInt(fornecedorId)))
      .returning()

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Relação não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/fios/[id]/fornecedores]", error)
    return NextResponse.json({ error: "Erro ao remover fornecedor" }, { status: 500 })
  }
}