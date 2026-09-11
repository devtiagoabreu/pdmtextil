import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { eq } from "drizzle-orm"
import { handleApiError } from "@/lib/api-error"
import { notificarDelecao } from "@/lib/notificar"
import { validarReuniao, podeEscreverReuniao, podeExcluirReuniao } from "@/lib/reunioes"
import { reunioes } from "@/lib/db/schema"
import { carregarDetalheReuniao, atualizarReuniaoComFilhos } from "../helpers"

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
      return NextResponse.json({ error: "Reunião não encontrada" }, { status: 404 })
    }

    const reuniao = await carregarDetalheReuniao(parseInt(idParam, 10))
    if (!reuniao) {
      return NextResponse.json({ error: "Reunião não encontrada" }, { status: 404 })
    }

    return NextResponse.json({ reuniao })
  } catch (error) {
    return handleApiError(error, "GET /api/reunioes/[id]")
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
        { error: "Sem permissão para criar ou editar reuniões." },
        { status: 403 }
      )
    }

    const { id: idParam } = await params
    const id = parseInt(idParam, 10)
    if (idInvalido(idParam)) {
      return NextResponse.json({ error: "Reunião não encontrada" }, { status: 404 })
    }

    const body = await req.json()
    const resultado = validarReuniao(body)
    if ("error" in resultado) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }

    const atualizada = await db.transaction(async (tx: any) => {
      return atualizarReuniaoComFilhos(tx, id, resultado.data, auth.session.user?.name)
    })

    if (!atualizada) {
      return NextResponse.json({ error: "Reunião não encontrada" }, { status: 404 })
    }

    const reuniao = await carregarDetalheReuniao(id)
    return NextResponse.json({ reuniao })
  } catch (error) {
    return handleApiError(error, "PUT /api/reunioes/[id]")
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
        { error: "Sem permissão para excluir reuniões." },
        { status: 403 }
      )
    }

    const { id: idParam } = await params
    if (idInvalido(idParam)) {
      return NextResponse.json({ error: "Reunião não encontrada" }, { status: 404 })
    }

    const deletada = await db
      .delete(reunioes)
      .where(eq(reunioes.id, parseInt(idParam, 10)))
      .returning()

    if (deletada.length === 0) {
      return NextResponse.json({ error: "Reunião não encontrada" }, { status: 404 })
    }

    await notificarDelecao("Reunião", String(deletada[0]?.titulo || deletada[0]?.id), auth.session.user?.name)

    return NextResponse.json({ ok: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/reunioes/[id]")
  }
}