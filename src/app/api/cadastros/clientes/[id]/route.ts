import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [cliente] = await db
      .select()
      .from(clientes)
      .where(eq(clientes.id, parseInt(id)))
      .limit(1)

    if (!cliente) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    return NextResponse.json(cliente)
  } catch (error) {
    console.error("[GET /api/cadastros/clientes/[id]]", error)
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

    const { nome, cnpj, razaoSocial, email, telefone, contato, endereco, cidade, uf, idIntegracao, ativo } = body

    const [atualizado] = await db
      .update(clientes)
      .set({
        nome: nome?.trim(),
        cnpj: cnpj?.trim(),
        razaoSocial: razaoSocial?.trim() || null,
        email: email?.trim() || null,
        telefone: telefone?.trim() || null,
        contato: contato?.trim() || null,
        endereco: endereco?.trim() || null,
        cidade: cidade?.trim() || null,
        uf: uf?.trim() || null,
        idIntegracao: idIntegracao || null,
        ativo: ativo ?? true,
        updatedAt: new Date(),
      })
      .where(eq(clientes.id, parseInt(id)))
      .returning()

    return NextResponse.json(atualizado)
  } catch (error) {
    console.error("[PUT /api/cadastros/clientes/[id]]", error)
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
      .delete(clientes)
      .where(eq(clientes.id, parseInt(id)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/clientes/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
