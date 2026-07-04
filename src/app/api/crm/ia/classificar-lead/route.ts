import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { eq } from "drizzle-orm"

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const { leadId, score, segmentoIa, porteIa } = body

    if (!leadId) {
      return NextResponse.json({ error: "leadId é obrigatório" }, { status: 400 })
    }

    const [updated] = await db
      .update(crmLeads)
      .set({
        score: score ?? null,
        segmentoIa: segmentoIa || null,
        porteIa: porteIa || null,
        dataClassificacaoIa: new Date(),
      })
      .where(eq(crmLeads.id, leadId))
      .returning()

    if (!updated) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
    }

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[POST /api/crm/ia/classificar-lead]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
