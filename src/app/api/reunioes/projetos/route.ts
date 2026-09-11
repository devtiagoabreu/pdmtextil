import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { eq, sql } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"
import { validarProjeto, podeEscreverReuniao } from "@/lib/reunioes"
import { reunioesProjetos } from "@/lib/db/schema"
import { listarProjetos } from "../helpers"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const projetos = await listarProjetos()
    return NextResponse.json({ projetos })
  } catch (error) {
    return handleApiError(error, "GET /api/reunioes/projetos")
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    if (!podeEscreverReuniao(auth.session.user?.role)) {
      return NextResponse.json(
        { error: "Sem permissão para criar ou editar projetos de reuniões." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const resultado = validarProjeto(body)
    if ("error" in resultado) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }

    const existente = await db
      .select({ id: reunioesProjetos.id })
      .from(reunioesProjetos)
      .where(sql`lower(${reunioesProjetos.nome}) = lower(${resultado.data.nome})`)
      .limit(1)
    if (existente.length > 0) {
      return NextResponse.json({ error: "Já existe um projeto com esse nome." }, { status: 409 })
    }

    const criado = await db
      .insert(reunioesProjetos)
      .values({
        nome: resultado.data.nome,
        descricao: resultado.data.descricao,
        dataInicio: resultado.data.dataInicio,
        dataFim: resultado.data.dataFim,
        status: resultado.data.status,
        cor: resultado.data.cor,
        ativo: resultado.data.ativo,
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json({ projeto: criado[0] }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/reunioes/projetos")
  }
}