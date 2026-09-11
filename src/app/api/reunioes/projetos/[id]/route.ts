import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { eq, sql } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"
import { validarProjeto, podeEscreverReuniao, podeExcluirReuniao } from "@/lib/reunioes"
import { reunioesProjetos } from "@/lib/db/schema"
import { buscarProjeto, contarReunioesPorProjeto } from "../../helpers"

export const dynamic = "force-dynamic"

function idInvalido(id: string): boolean {
  const n = parseInt(id, 10)
  return Number.isNaN(n) || n <= 0
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id: idParam } = await params
    if (idInvalido(idParam)) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
    }

    const projeto = await buscarProjeto(parseInt(idParam, 10))
    if (!projeto) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ projeto })
  } catch (error) {
    return handleApiError(error, "GET /api/reunioes/projetos/[id]")
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    if (!podeEscreverReuniao(auth.session.user?.role)) {
      return NextResponse.json(
        { error: "Sem permissão para criar ou editar projetos de reuniões." },
        { status: 403 }
      )
    }

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    if (idInvalido(idParam)) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
    }

    const existente = await buscarProjeto(id)
    if (!existente) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
    }

    const body = await req.json()
    const resultado = validarProjeto(body)
    if ("error" in resultado) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }

    const nomeDuplicado = await db
      .select({ id: reunioesProjetos.id })
      .from(reunioesProjetos)
      .where(sql`lower(${reunioesProjetos.nome}) = lower(${resultado.data.nome}) AND ${reunioesProjetos.id} <> ${id}`)
      .limit(1)
    if (nomeDuplicado.length > 0) {
      return NextResponse.json({ error: "Já existe um projeto com esse nome." }, { status: 409 })
    }

    const atualizado = await db
      .update(reunioesProjetos)
      .set({
        nome: resultado.data.nome,
        descricao: resultado.data.descricao,
        dataInicio: resultado.data.dataInicio,
        dataFim: resultado.data.dataFim,
        status: resultado.data.status,
        cor: resultado.data.cor,
        ativo: resultado.data.ativo,
        updatedAt: new Date(),
      })
      .where(eq(reunioesProjetos.id, id))
      .returning()

    return NextResponse.json({ projeto: atualizado[0] })
  } catch (error) {
    return handleApiError(error, "PUT /api/reunioes/projetos/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    if (!podeExcluirReuniao(auth.session.user?.role)) {
      return NextResponse.json(
        { error: "Sem permissão para excluir projetos de reuniões." },
        { status: 403 }
      )
    }

    const { id: idParam } = await params
    if (idInvalido(idParam)) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
    }

    const projeto = await buscarProjeto(parseInt(idParam, 10))
    if (!projeto) {
      return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 })
    }

    if (projeto.id === 1) {
      return NextResponse.json(
        { error: "O projeto padrão não pode ser excluído." },
        { status: 400 }
      )
    }

    const reunioes = await contarReunioesPorProjeto(projeto.id)
    if (reunioes > 0) {
      return NextResponse.json(
        { error: "Não é possível excluir: há reuniões vinculadas a este projeto." },
        { status: 400 }
      )
    }

    await db.delete(reunioesProjetos).where(eq(reunioesProjetos.id, projeto.id))

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/reunioes/projetos/[id]")
  }
}