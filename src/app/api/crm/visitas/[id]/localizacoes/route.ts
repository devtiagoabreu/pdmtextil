import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmVisitasLocalizacoes } from "@/lib/db/schema/crm-visitas-localizacoes"
import { eq, desc } from "drizzle-orm"

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const visitaId = Number(params.id)
    if (isNaN(visitaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const localizacoes = await db
      .select()
      .from(crmVisitasLocalizacoes)
      .where(eq(crmVisitasLocalizacoes.visitaId, visitaId))
      .orderBy(desc(crmVisitasLocalizacoes.createdAt))

    return NextResponse.json(localizacoes)
  } catch (error) {
    console.error("[GET /api/crm/visitas/[id]/localizacoes]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const visitaId = Number(params.id)
    if (isNaN(visitaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const body = await request.json()
    const { latitude, longitude, endereco, observacao, fotoUrl, tipo } = body

    if (latitude == null || longitude == null) {
      return NextResponse.json({ error: "Latitude e longitude são obrigatórias" }, { status: 400 })
    }

    const [localizacao] = await db
      .insert(crmVisitasLocalizacoes)
      .values({
        visitaId,
        latitude,
        longitude,
        endereco,
        observacao,
        fotoUrl,
        tipo: tipo || "LOCAL",
        criadoPor: auth.userId,
      })
      .returning()

    return NextResponse.json(localizacao, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/visitas/[id]/localizacoes]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const visitaId = Number(params.id)
    if (isNaN(visitaId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const localizacaoId = Number(searchParams.get("localizacaoId"))
    if (isNaN(localizacaoId)) {
      return NextResponse.json({ error: "ID da localização inválido" }, { status: 400 })
    }

    await db
      .delete(crmVisitasLocalizacoes)
      .where(eq(crmVisitasLocalizacoes.id, localizacaoId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/crm/visitas/[id]/localizacoes]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
