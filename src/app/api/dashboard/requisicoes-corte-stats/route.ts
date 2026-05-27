import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

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

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    const totalRows = await q(sql`SELECT COUNT(*) as total FROM requisicoes_corte`)
    const totalGeral = Array.isArray(totalRows) ? Number(totalRows[0]?.total ?? 0) : 0

    const solicitRows = await q(sql`SELECT COUNT(*) as total FROM requisicoes_corte WHERE status = 'SOLICITADO'`)
    const solicitados = Array.isArray(solicitRows) ? Number(solicitRows[0]?.total ?? 0) : 0

    const procRows = await q(sql`SELECT COUNT(*) as total FROM requisicoes_corte WHERE status = 'PROCESSANDO'`)
    const processando = Array.isArray(procRows) ? Number(procRows[0]?.total ?? 0) : 0

    const atendRows = await q(sql`SELECT COUNT(*) as total FROM requisicoes_corte WHERE status = 'ATENDIDO'`)
    const atendidos = Array.isArray(atendRows) ? Number(atendRows[0]?.total ?? 0) : 0

    const itensRows = await q(sql`SELECT COALESCE(SUM(NULLIF(REGEXP_REPLACE(COALESCE(quantidade,'0'), '[^0-9\\.]', '', 'g'), '')::numeric), 0) as total FROM requisicoes_corte_itens`)
    const totalItens = Array.isArray(itensRows) ? Number(itensRows[0]?.total ?? 0) : 0

    const cortesRows = await q(sql`SELECT COUNT(*) as total FROM requisicoes_corte_itens`)
    const totalCortes = Array.isArray(cortesRows) ? Number(cortesRows[0]?.total ?? 0) : 0

    const mesRows = await q(sql`
      SELECT COUNT(*) as total FROM requisicoes_corte
      WHERE created_at >= ${startOfMonth}::timestamp AND created_at <= ${endOfMonth}::timestamp
    `)
    const totalEsteMes = Array.isArray(mesRows) ? Number(mesRows[0]?.total ?? 0) : 0

    const statusDistRows = await q(sql`
      SELECT status, COUNT(*) as total FROM requisicoes_corte GROUP BY status
    `)
    const statusDistribution = Array.isArray(statusDistRows)
      ? statusDistRows.map((r: any) => ({ status: r.status, total: Number(r.total) }))
      : []

    const trendData: { mes: string; total: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
      const trendRows = await q(sql`
        SELECT COUNT(*) as total FROM requisicoes_corte
        WHERE created_at >= ${start}::timestamp AND created_at <= ${end}::timestamp
      `)
      trendData.push({
        mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        total: Array.isArray(trendRows) ? Number(trendRows[0]?.total ?? 0) : 0,
      })
    }

    return NextResponse.json({
      totalGeral,
      solicitados,
      processando,
      atendidos,
      totalItens,
      totalCortes,
      totalEsteMes,
      statusDistribution,
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
