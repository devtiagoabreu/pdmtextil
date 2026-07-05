import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { representantes } from "@/lib/db/schema/representantes"
import { ilike, or, desc, eq } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() || ""

    let resultados

    if (q.length >= 2) {
      resultados = await db
        .select()
        .from(representantes)
        .where(
          or(
            ilike(representantes.nome, `%${q}%`),
            ilike(representantes.cnpj, `%${q}%`),
            ilike(representantes.razaoSocial, `%${q}%`)
          )
        )
        .orderBy(desc(representantes.createdAt))
        .limit(20)
    } else {
      resultados = await db
        .select()
        .from(representantes)
        .orderBy(desc(representantes.createdAt))
        .limit(20)
    }

    return NextResponse.json(resultados)
  } catch (error) {
    console.error("[GET /api/representantes]", error)
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

    const { nome, cnpj, razaoSocial, email, telefone, contato, endereco, cidade, uf, gerenteId, idIntegracao } = body

    if (!nome?.trim()) {
      return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 })
    }
    if (!cnpj?.trim()) {
      return NextResponse.json({ error: "CNPJ é obrigatório" }, { status: 400 })
    }

    const existente = await db
      .select()
      .from(representantes)
      .where(eq(representantes.cnpj, cnpj.trim()))
      .limit(1)

    if (existente[0]) {
      return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 })
    }

    const [novoRepresentante] = await db
      .insert(representantes)
      .values({
        nome: nome.trim(),
        cnpj: cnpj.trim(),
        razaoSocial: razaoSocial?.trim() || null,
        email: email?.trim() || null,
        telefone: telefone?.trim() || null,
        contato: contato?.trim() || null,
        endereco: endereco?.trim() || null,
        cidade: cidade?.trim() || null,
        uf: uf?.trim() || null,
        gerenteId: gerenteId || null,
        idIntegracao: idIntegracao || null,
      })
      .returning()

    return NextResponse.json(novoRepresentante, { status: 201 })
  } catch (error: any) {
    console.error("[POST /api/representantes]", error)
    if (error.code === "23505") {
      return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 409 })
    }
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
