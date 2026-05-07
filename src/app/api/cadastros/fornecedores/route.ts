import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { fornecedores } from "@/lib/db/schema/fios"
import { eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    console.log("[GET /api/cadastros/fornecedores] Buscando fornecedores...")

    const lista = await db
      .select()
      .from(fornecedores)
      .orderBy(fornecedores.nome)

    console.log("[GET /api/cadastros/fornecedores] Encontrados:", lista.length)

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/cadastros/fornecedores]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await req.json()

    const novoFornecedor = await db
      .insert(fornecedores)
      .values({
        nome: body.nome,
        cnpj: body.cnpj || null,
        razaoSocial: body.razaoSocial || null,
        email: body.email || null,
        telefone: body.telefone || null,
        contato: body.contato || null,
        endereco: body.endereco || null,
        cidade: body.cidade || null,
        uf: body.uf || null,
        ativo: body.ativo ?? true,
      })
      .returning()

    return NextResponse.json(novoFornecedor[0])
  } catch (error) {
    console.error("[POST /api/cadastros/fornecedores]", error)
    return NextResponse.json({ error: "Erro ao criar fornecedor" }, { status: 500 })
  }
}