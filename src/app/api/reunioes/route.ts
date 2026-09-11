import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { handleApiError } from "@/lib/api-error"
import { validarReuniao, podeEscreverReuniao } from "@/lib/reunioes"
import { listarReunioes, criarReuniaoComFilhos, carregarDetalheReuniao } from "./helpers"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const reunioes = await listarReunioes()
    return NextResponse.json({ reunioes })
  } catch (error) {
    return handleApiError(error, "GET /api/reunioes")
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    if (!podeEscreverReuniao(auth.session.user?.role)) {
      return NextResponse.json(
        { error: "Sem permissão para criar ou editar reuniões." },
        { status: 403 }
      )
    }

    const body = await req.json()
    const resultado = validarReuniao(body)
    if ("error" in resultado) {
      return NextResponse.json({ error: resultado.error }, { status: 400 })
    }

    const criada = await db.transaction(async (tx: any) => {
      return criarReuniaoComFilhos(tx, resultado.data, auth.session.user?.name)
    })

    const reuniao = await carregarDetalheReuniao(criada.id)
    return NextResponse.json({ reuniao }, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/reunioes")
  }
}