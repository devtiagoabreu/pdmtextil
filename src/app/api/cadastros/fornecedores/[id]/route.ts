import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { fornecedores } from "@/lib/db/schema/fios"
import { eq } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const fornecedor = await db
      .select()
      .from(fornecedores)
      .where(eq(fornecedores.id, parseInt(id)))
      .limit(1)

    if (fornecedor.length === 0) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 })
    }

    return NextResponse.json(fornecedor[0])
  } catch (error) {
    console.error("[GET /api/cadastros/fornecedores/[id]]", error)
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

    if (body.cnpj) {
      const cnpjLimpo = body.cnpj.replace(/\D/g, "")
      const existenteCNPJ = await db
        .select()
        .from(fornecedores)
        .where(eq(fornecedores.cnpj, cnpjLimpo))
        .limit(1)

      if (existenteCNPJ[0] && existenteCNPJ[0].id !== parseInt(id)) {
        return NextResponse.json({ error: "CNPJ já cadastrado em outro fornecedor" }, { status: 409 })
      }
    }

    if (body.idIntegracao) {
      const existenteIdInt = await db
        .select()
        .from(fornecedores)
        .where(eq(fornecedores.idIntegracao, body.idIntegracao))
        .limit(1)

      if (existenteIdInt[0] && existenteIdInt[0].id !== parseInt(id)) {
        return NextResponse.json({ error: "ID Integração já cadastrado em outro fornecedor" }, { status: 409 })
      }
    }

    const atualizado = await db
      .update(fornecedores)
      .set({
        nome: body.nome,
        cnpj: body.cnpj ? body.cnpj.replace(/\D/g, "") : null,
        razaoSocial: body.razaoSocial || null,
        email: body.email || null,
        telefone: body.telefone || null,
        contato: body.contato || null,
        endereco: body.endereco || null,
        cidade: body.cidade || null,
        uf: body.uf || null,
        ativo: body.ativo,
        idIntegracao: body.idIntegracao || null,
        updatedAt: new Date(),
      })
      .where(eq(fornecedores.id, parseInt(id)))
      .returning()

    if (atualizado.length === 0) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 })
    }

    return NextResponse.json(atualizado[0])
  } catch (error) {
    console.error("[PUT /api/cadastros/fornecedores/[id]]", error)
    return NextResponse.json({ error: "Erro ao atualizar fornecedor" }, { status: 500 })
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
      .delete(fornecedores)
      .where(eq(fornecedores.id, parseInt(id)))
      .returning()

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Fornecedor não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/cadastros/fornecedores/[id]]", error)
    return NextResponse.json({ error: "Erro ao excluir fornecedor" }, { status: 500 })
  }
}