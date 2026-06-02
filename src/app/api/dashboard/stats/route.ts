import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
export const dynamic = "force-dynamic"

async function query(sqlFragment: ReturnType<typeof sql>, fallback: any = null) {
  try {
    return await db.execute(sqlFragment)
  } catch (e) {
    console.error("[DB]", e)
    return fallback
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const [
      monthlyRaw,
      statusRaw,
      tipoRaw,
      pcRaw,
    ] = await Promise.all([
      query(sql`
        SELECT
          to_char(created_at, 'YYYY-MM') AS mes,
          status,
          COUNT(*)::int AS total
        FROM solicitacoes
        WHERE created_at >= date_trunc('month', now()) - INTERVAL '5 months'
        GROUP BY to_char(created_at, 'YYYY-MM'), status
        ORDER BY mes
      `, []),
      query(sql`
        SELECT status, COUNT(*)::int AS total
        FROM solicitacoes GROUP BY status
      `, []),
      query(sql`
        SELECT tipo, COUNT(*)::int AS total
        FROM solicitacoes GROUP BY tipo
      `, []),
      query(sql`SELECT COUNT(*)::int AS total FROM produtos_cru`, []),
    ])

    const monthlyRows = Array.isArray(monthlyRaw) ? monthlyRaw : []
    const statusRows = Array.isArray(statusRaw) ? statusRaw : []
    const tipoRows = Array.isArray(tipoRaw) ? tipoRaw : []
    const pcRows = Array.isArray(pcRaw) ? pcRaw : []

    const monthMap = new Map<string, { pendentes: number; emDesenvolvimento: number; concluidas: number; total: number }>()
    let geralPendentes = 0, geralEmDesenvolvimento = 0, geralConcluidas = 0, geralTotal = 0

    for (const r of monthlyRows) {
      if (!monthMap.has(r.mes)) monthMap.set(r.mes, { pendentes: 0, emDesenvolvimento: 0, concluidas: 0, total: 0 })
      const entry = monthMap.get(r.mes)!
      const t = Number(r.total)
      entry.total += t
      if (r.status === "PENDENTE") entry.pendentes += t
      else if (r.status === "EM_DESENVOLVIMENTO") entry.emDesenvolvimento += t
      else if (r.status === "CONCLUIDO") entry.concluidas += t
      geralTotal += t
      if (r.status === "PENDENTE") geralPendentes += t
      else if (r.status === "EM_DESENVOLVIMENTO") geralEmDesenvolvimento += t
      else if (r.status === "CONCLUIDO") geralConcluidas += t
    }

    const trendData: { mes: string; total: number }[] = []

    for (const [mes, entry] of monthMap) {
      const d = new Date(mes + "-01")
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
      trendData.push({ mes: label, total: entry.total })
    }

    const totalProdutosCru = pcRows.length > 0 ? Number(pcRows[0].total) : 0

    return NextResponse.json({
      totalEsteMes: geralTotal,
      pendentes: geralPendentes,
      emDesenvolvimento: geralEmDesenvolvimento,
      concluidas: geralConcluidas,
      monthlyTrend: trendData,
      statusDistribution: statusRows.map((r: any) => ({ status: r.status, total: Number(r.total) })),
      tipoDistribution: tipoRows.map((r: any) => ({ tipo: r.tipo, total: Number(r.total) })),
      totalProdutosCru,
    })
  } catch (error) {
    console.error("[GET /api/dashboard/stats]", error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
