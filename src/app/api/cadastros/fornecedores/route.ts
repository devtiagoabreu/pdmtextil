import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { fornecedores } from "@/lib/db/schema/fios"
import { eq } from "drizzle-orm"
import { validateRequest, fornecedorSchema } from "@/lib/validation"
import { handleApiError } from "@/lib/api-error"
import { getPaginationParams, cursorCondition, buildPaginatedResponse } from "@/lib/pagination"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { cursor, limit } = getPaginationParams(req)

    const rows = await db
      .select()
      .from(fornecedores)
      .where(cursorCondition(fornecedores, cursor))
      .orderBy(fornecedores.nome)
      .limit(limit + 1)

    return NextResponse.json(rows)
  } catch (error) {
    return handleApiError(error, "GET /api/cadastros/fornecedores")
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
    return handleApiError(error, "POST /api/cadastros/fornecedores")
  }
}