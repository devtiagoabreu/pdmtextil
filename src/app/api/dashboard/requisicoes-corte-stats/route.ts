import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
export const dynamic = "force-dynamic"

async function q(sqlFragment: ReturnType<typeof sql>, fallback: any = null) {
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
      statusRaw,
      itensRaw,
      trendRaw,
    ] = await Promise.all([
      q(sql`
        SELECT status, COUNT(*)::int AS total
        FROM requisicoes_corte GROUP BY status
      `, []),
      q(sql`
        SELECT
          COUNT(*)::int AS total_cortes,
          COALESCE(SUM(NULLIF(REGEXP_REPLACE(COALESCE(quantidade,'0'), '[^0-9\\.]', '', 'g'), '')::numeric), 0) AS total_itens
        FROM requisicoes_corte_itens
      `, []),
      q(sql`
        SELECT
          to_char(created_at, 'YYYY-MM') AS mes,
          COUNT(*)::int AS total
        FROM requisicoes_corte
        WHERE created_at >= date_trunc('month', now()) - INTERVAL '5 months'
        GROUP BY to_char(created_at, 'YYYY-MM')
        ORDER BY mes
      `, []),
    ])

    const statusRows = Array.isArray(statusRaw) ? statusRaw : []
    const itensRows = Array.isArray(itensRaw) && itensRaw.length > 0 ? itensRaw[0] : null
    const trendRows = Array.isArray(trendRaw) ? trendRaw : []

    const getStatusCount = (status: string) => {
      const r = statusRows.find((x: any) => x.status === status)
      return r ? Number(r.total) : 0
    }

    const totalGeral = statusRows.reduce((acc: number, r: any) => acc + Number(r.total), 0)

    const trendData = trendRows.map((r: any) => {
      const d = new Date(r.mes + "-01")
      return {
        mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        total: Number(r.total),
      }
    })

    const lastMonth = trendRows.length > 0 ? trendRows[trendRows.length - 1] : null
    const totalEsteMes = lastMonth ? Number(lastMonth.total) : 0

    return NextResponse.json({
      totalGeral,
      solicitados: getStatusCount("SOLICITADO"),
      processando: getStatusCount("PROCESSANDO"),
      atendidos: getStatusCount("ATENDIDO"),
      totalItens: itensRows ? Number(itensRows.total_itens) : 0,
      totalCortes: itensRows ? Number(itensRows.total_cortes) : 0,
      totalEsteMes,
      statusDistribution: statusRows.map((r: any) => ({ status: r.status, total: Number(r.total) })),
      monthlyTrend: trendData,
    })
  } catch (error) {
    console.error("[GET /api/dashboard/requisicoes-corte-stats]", error)
    return NextResponse.json({
      error: "Erro interno",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
