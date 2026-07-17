import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { ilike, or, and, desc, eq } from "drizzle-orm"
import { validateRequest, clienteSchema } from "@/lib/validation"
import { handleApiError } from "@/lib/api-error"
import { getPaginationParams, cursorCondition, buildPaginatedResponse } from "@/lib/pagination"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { cursor, limit } = getPaginationParams(req)
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() || ""

    const cursorCond = cursorCondition(clientes, cursor)

    let rows

    if (q.length >= 2) {
      const searchCond = or(
        ilike(clientes.nome, `%${q}%`),
        ilike(clientes.cnpj, `%${q}%`),
        ilike(clientes.razaoSocial, `%${q}%`)
      )
      rows = await db
        .select()
        .from(clientes)
        .where(cursorCond ? and(searchCond, cursorCond) : searchCond)
        .orderBy(desc(clientes.createdAt))
        .limit(limit + 1)
    } else {
      rows = await db
        .select()
        .from(clientes)
        .where(cursorCond)
        .orderBy(desc(clientes.createdAt))
        .limit(limit + 1)
    }

    return NextResponse.json(rows)
  } catch (error) {
    return handleApiError(error, "GET /api/cadastros/clientes")
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  try {
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const body = await req.json()
    const parsed = validateRequest(clienteSchema, body)
    if ("error" in parsed) return parsed.error

    const { nome, cnpj, razaoSocial, email, telefone, contato, endereco, cidade, uf, idIntegracao } = parsed.data

    const existente = await db
      .select()
      .from(clientes)
      .where(eq(clientes.cnpj, cnpj))
      .limit(1)

    if (existente[0]) {
      return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 })
    }

    const [novoCliente] = await db
      .insert(clientes)
      .values({
        nome,
        cnpj,
        razaoSocial: razaoSocial || null,
        email: email || null,
        telefone: telefone || null,
        contato: contato || null,
        endereco: endereco || null,
        cidade: cidade || null,
        uf: uf || null,
        idIntegracao: idIntegracao || null,
      })
      .returning()

    return NextResponse.json(novoCliente, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/cadastros/clientes", session?.user?.name)
  }
}
