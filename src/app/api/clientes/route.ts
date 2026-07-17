import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { ilike, or, desc, eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

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
    console.error("[GET /api/clientes]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    let body
    try {
      body = await req.json()
    } catch {
      body = {}
    }
    console.log("[POST /api/clientes] body:", body)

    const { nome, cnpj, razaoSocial, email, emailNf, telefone, celular, contato, endereco, cidade, uf, idIntegracao } = body

    if (!nome?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }
    if (!cnpj?.trim()) {
      return NextResponse.json({ error: "CNPJ é obrigatório" }, { status: 400 })
    }

    const existente = await db
      .select()
      .from(clientes)
      .where(eq(clientes.cnpj, cnpj.trim()))
      .limit(1)

    if (existente[0]) {
      return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 })
    }

    console.log("[POST /api/clientes] inserting:", { nome, cnpj })

    const [novoCliente] = await db
      .insert(clientes)
      .values({
        nome: nome.trim(),
        cnpj: cnpj.trim(),
        razaoSocial: razaoSocial?.trim() || null,
        email: email?.trim() || null,
        emailNf: emailNf?.trim() || null,
        telefone: telefone?.trim() || null,
        celular: celular?.trim() || null,
        contato: contato?.trim() || null,
        endereco: endereco?.trim() || null,
        cidade: cidade?.trim() || null,
        uf: uf?.trim() || null,
        idIntegracao: idIntegracao || null,
      })
      .returning()

    return NextResponse.json(novoCliente, { status: 201 })
  } catch (error: any) {
    console.error("[POST /api/clientes]", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}