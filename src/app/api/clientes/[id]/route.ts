import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const resultado = await db
      .select()
      .from(clientes)
      .where(eq(clientes.id, parseInt(id)))
      .limit(1)

    if (!resultado[0]) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    return NextResponse.json(resultado[0])
  } catch (error) {
    console.error("[GET /api/clientes/[id]]", error)
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

    const { nome, cnpj, razaoSocial, email, telefone, contato, endereco, cidade, uf, idIntegracao } = body

    if (!nome?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }
    if (!cnpj?.trim()) {
      return NextResponse.json({ error: "CNPJ é obrigatório" }, { status: 400 })
    }

    const cnpjLimpo = cnpj.replace(/\D/g, "")
    const existenteCNPJ = await db
      .select()
      .from(clientes)
      .where(eq(clientes.cnpj, cnpjLimpo))
      .limit(1)

    if (existenteCNPJ[0] && existenteCNPJ[0].id !== parseInt(id)) {
      return NextResponse.json({ error: "CNPJ já cadastrado em outro cliente" }, { status: 409 })
    }

    if (idIntegracao) {
      const existenteIdInt = await db
        .select()
        .from(clientes)
        .where(eq(clientes.idIntegracao, idIntegracao))
        .limit(1)

      if (existenteIdInt[0] && existenteIdInt[0].id !== parseInt(id)) {
        return NextResponse.json({ error: "ID Integração já cadastrado em outro cliente" }, { status: 409 })
      }
    }

    const [clienteAtualizado] = await db
      .update(clientes)
      .set({
        nome: nome.trim(),
        cnpj: cnpjLimpo,
        razaoSocial: razaoSocial?.trim() || null,
        email: email?.trim() || null,
        telefone: telefone?.trim() || null,
        contato: contato?.trim() || null,
        endereco: endereco?.trim() || null,
        cidade: cidade?.trim() || null,
        uf: uf?.trim() || null,
        idIntegracao: idIntegracao || null,
        updatedAt: new Date(),
      })
      .where(eq(clientes.id, parseInt(id)))
      .returning()

    return NextResponse.json(clienteAtualizado)
  } catch (error: any) {
    console.error("[PUT /api/clientes/[id]]", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 })
    }
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
    console.error("[DELETE /api/clientes/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}