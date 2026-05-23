import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

async function query(sqlFragment: ReturnType<typeof sql>, fallback: any = null) {
  try {
    const result = await db.execute(sqlFragment)
    return result
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

    // Total do mês
    const totalRows = await query(sql`
      SELECT COUNT(*) as total FROM solicitacoes
      WHERE created_at >= ${startOfMonth}::timestamp
      AND created_at <= ${endOfMonth}::timestamp
    `)
    const total = Array.isArray(totalRows) ? Number(totalRows[0]?.total ?? 0) : 0

    // Pendentes no mês
    const pendRows = await query(sql`
      SELECT COUNT(*) as total FROM solicitacoes
      WHERE created_at >= ${startOfMonth}::timestamp
      AND created_at <= ${endOfMonth}::timestamp
      AND status = 'PENDENTE'
    `)
    const pendentes = Array.isArray(pendRows) ? Number(pendRows[0]?.total ?? 0) : 0

    // Em desenvolvimento no mês
    const devRows = await query(sql`
      SELECT COUNT(*) as total FROM solicitacoes
      WHERE created_at >= ${startOfMonth}::timestamp
      AND created_at <= ${endOfMonth}::timestamp
      AND status = 'EM_DESENVOLVIMENTO'
    `)
    const emDesenvolvimento = Array.isArray(devRows) ? Number(devRows[0]?.total ?? 0) : 0

    // Concluídas no mês
    const concRows = await query(sql`
      SELECT COUNT(*) as total FROM solicitacoes
      WHERE created_at >= ${startOfMonth}::timestamp
      AND created_at <= ${endOfMonth}::timestamp
      AND status = 'CONCLUIDO'
    `)
    const concluidas = Array.isArray(concRows) ? Number(concRows[0]?.total ?? 0) : 0

    // Monthly trend (last 6 months)
    const trendData: { mes: string; total: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
      const trendRows = await query(sql`
        SELECT COUNT(*) as total FROM solicitacoes
        WHERE created_at >= ${start}::timestamp
        AND created_at <= ${end}::timestamp
      `)
      trendData.push({
        mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        total: Array.isArray(trendRows) ? Number(trendRows[0]?.total ?? 0) : 0,
      })
    }

    // Status distribution (all time)
    const sdRows = await query(sql`
      SELECT status, COUNT(*) as total
      FROM solicitacoes
      GROUP BY status
    `)
    const statusDistribution = Array.isArray(sdRows)
      ? sdRows.map((r: any) => ({ status: r.status, total: Number(r.total) }))
      : []

    // Tipo distribution (all time)
    const tdRows = await query(sql`
      SELECT tipo, COUNT(*) as total
      FROM solicitacoes
      GROUP BY tipo
    `)
    const tipoDistribution = Array.isArray(tdRows)
      ? tdRows.map((r: any) => ({ tipo: r.tipo, total: Number(r.total) }))
      : []

    // Produto-cru count
    const pcRows = await query(sql`SELECT COUNT(*) as total FROM produtos_cru`)
    const totalProdutosCru = Array.isArray(pcRows) ? Number(pcRows[0]?.total ?? 0) : 0

    return NextResponse.json({
      totalEsteMes: total,
      pendentes,
      emDesenvolvimento,
      concluidas,
      monthlyTrend: trendData,
      statusDistribution,
      tipoDistribution,
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
