import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { ilike, or, desc, eq } from "drizzle-orm"
import { validateRequest, clienteSchema } from "@/lib/validation"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() || ""

    let resultados

    if (q.length >= 2) {
      resultados = await db
        .select()
        .from(clientes)
        .where(
          or(
            ilike(clientes.nome, `%${q}%`),
            ilike(clientes.cnpj, `%${q}%`),
            ilike(clientes.razaoSocial, `%${q}%`)
          )
        )
        .orderBy(desc(clientes.createdAt))
        .limit(20)
    } else {
      resultados = await db
        .select()
        .from(clientes)
        .orderBy(desc(clientes.createdAt))
        .limit(20)
    }

    return NextResponse.json(resultados)
  } catch (error) {
    console.error("[GET /api/cadastros/clientes]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
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
  } catch (error: any) {
    console.error("[POST /api/cadastros/clientes]", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
