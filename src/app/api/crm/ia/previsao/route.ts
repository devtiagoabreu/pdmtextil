import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmPrevisaoVendas } from "@/lib/db/schema/crm-previsao-vendas"
import { desc } from "drizzle-orm"

export async function GET() {
  try {
    const previsoes = await db
      .select()
      .from(crmPrevisaoVendas)
      .orderBy(desc(crmPrevisaoVendas.periodo))
      .limit(12)

    return NextResponse.json(previsoes)
  } catch (error) {
    console.error("[GET /api/crm/ia/previsao]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const { periodo, valorPrevisto, valorReal, dados } = body

    if (!periodo || valorPrevisto === undefined) {
      return NextResponse.json({ error: "periodo e valorPrevisto são obrigatórios" }, { status: 400 })
    }

    const [previsao] = await db
      .insert(crmPrevisaoVendas)
      .values({
        periodo,
        valorPrevisto,
        valorReal: valorReal ?? null,
        dados: dados || {},
      })
      .returning()

    return NextResponse.json(previsao, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/ia/previsao]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
