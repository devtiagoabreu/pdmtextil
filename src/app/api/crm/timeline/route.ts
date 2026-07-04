import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmTimelineEventos } from "@/lib/db/schema/crm-timeline-eventos"
import { eq, desc } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get("empresaId")

    if (!empresaId) {
      return NextResponse.json({ error: "empresaId é obrigatório" }, { status: 400 })
    }

    const eventos = await db
      .select()
      .from(crmTimelineEventos)
      .where(eq(crmTimelineEventos.empresaId, parseInt(empresaId)))
      .orderBy(desc(crmTimelineEventos.dataEvento))
      .limit(50)

    return NextResponse.json(eventos)
  } catch (error) {
    console.error("[GET /api/crm/timeline]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
