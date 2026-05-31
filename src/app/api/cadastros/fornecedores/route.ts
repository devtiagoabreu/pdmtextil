import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { fornecedores } from "@/lib/db/schema/fios"
import { eq } from "drizzle-orm"
import { validateRequest, fornecedorSchema } from "@/lib/validation"

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
    const parsed = validateRequest(fornecedorSchema, body)
    if ("error" in parsed) return parsed.error
    const data = parsed.data

    const novoFornecedor = await db
      .insert(fornecedores)
      .values({
        nome: data.nome,
        cnpj: data.cnpj || null,
        razaoSocial: data.razaoSocial || null,
        email: data.email || null,
        telefone: data.telefone || null,
        contato: data.contato || null,
        endereco: data.endereco || null,
        cidade: data.cidade || null,
        uf: data.uf || null,
        ativo: data.ativo ?? true,
        idIntegracao: data.idIntegracao || null,
      })
      .returning()

    return NextResponse.json(novoFornecedor[0])
  } catch (error) {
    console.error("[POST /api/cadastros/fornecedores]", error)
    return NextResponse.json({ error: "Erro ao criar fornecedor" }, { status: 500 })
  }
}