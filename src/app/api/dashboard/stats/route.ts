import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
export const dynamic = "force-dynamic"

function parseJson(value: any, fallback: any = []) {
  if (value == null) return fallback
  return typeof value === "string" ? JSON.parse(value) : value
}

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

    const [monthlyRaw, aggRaw] = await Promise.all([
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
        SELECT
          (SELECT json_agg(json_build_object('status', status, 'total', cnt))
           FROM (SELECT status, COUNT(*)::int AS cnt FROM solicitacoes GROUP BY status) s) AS status_rows,
          (SELECT json_agg(json_build_object('tipo', tipo, 'total', cnt))
           FROM (SELECT tipo, COUNT(*)::int AS cnt FROM solicitacoes GROUP BY tipo) t) AS tipo_rows,
          (SELECT COUNT(*)::int AS total FROM produtos_cru) AS pc_total
      `),
    ])

    const monthlyRows = Array.isArray(monthlyRaw) ? monthlyRaw : []
    const agg = Array.isArray(aggRaw) ? aggRaw[0] : aggRaw ?? {}
    const statusRows = parseJson(agg?.status_rows)
    const tipoRows = parseJson(agg?.tipo_rows)
    const totalProdutosCru = Number(agg?.pc_total ?? 0)

    const monthMap = new Map<string, { pendentes: number; emDesenvolvimento: number; pilotagem: number; concluidoDev: number; aprovadoCliente: number; concluidas: number; total: number }>()
    let geralPendentes = 0, geralEmDesenvolvimento = 0, geralPilotagem = 0, geralConcluidoDev = 0, geralAprovadoCliente = 0, geralConcluidas = 0, geralTotal = 0

    for (const r of monthlyRows) {
      if (!monthMap.has(r.mes)) monthMap.set(r.mes, { pendentes: 0, emDesenvolvimento: 0, pilotagem: 0, concluidoDev: 0, aprovadoCliente: 0, concluidas: 0, total: 0 })
      const entry = monthMap.get(r.mes)!
      const t = Number(r.total)
      entry.total += t
      if (r.status === "PENDENTE") entry.pendentes += t
      else if (r.status === "EM_DESENVOLVIMENTO") entry.emDesenvolvimento += t
      else if (r.status === "PILOTAGEM") entry.pilotagem += t
      else if (r.status === "CONCLUIDO_DEV") entry.concluidoDev += t
      else if (r.status === "APROVADO_CLI") entry.aprovadoCliente += t
      else if (r.status === "CONCLUIDO") entry.concluidas += t
      geralTotal += t
      if (r.status === "PENDENTE") geralPendentes += t
      else if (r.status === "EM_DESENVOLVIMENTO") geralEmDesenvolvimento += t
      else if (r.status === "PILOTAGEM") geralPilotagem += t
      else if (r.status === "CONCLUIDO_DEV") geralConcluidoDev += t
      else if (r.status === "APROVADO_CLI") geralAprovadoCliente += t
      else if (r.status === "CONCLUIDO") geralConcluidas += t
    }

    const trendData: { mes: string; total: number }[] = []

    for (const [mes, entry] of monthMap) {
      const d = new Date(mes + "-01")
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
      trendData.push({ mes: label, total: entry.total })
    }

    return NextResponse.json({
      totalEsteMes: geralTotal,
      pendentes: geralPendentes,
      emDesenvolvimento: geralEmDesenvolvimento,
      pilotagem: geralPilotagem,
      concluidoDev: geralConcluidoDev,
      aprovadoCliente: geralAprovadoCliente,
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
