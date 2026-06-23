import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
export const dynamic = "force-dynamic"

async function rows(sqlFragment: ReturnType<typeof sql>): Promise<any[]> {
  try {
    const result = await db.execute(sqlFragment)
    return Array.isArray(result) ? result : []
  } catch (e) {
    console.error("[DB]", e)
    return []
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const url = new URL(req.url)
    const dataInicio = url.searchParams.get("dataInicio")
    const dataFim = url.searchParams.get("dataFim")

    function filtro(col = "created_at") {
      let f = sql`TRUE`
      if (dataInicio) f = sql`${f} AND ${sql.identifier(col)} >= ${dataInicio}::timestamp`
      if (dataFim) f = sql`${f} AND ${sql.identifier(col)} <= ${dataFim}::timestamp`
      return f
    }

    const fc = filtro()
    const fd = filtro("created_at")
    const fdc = filtro("data_conclusao")

    const agregado = (await rows(sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status IN ('CONCLUIDO', 'CONCLUIDO_DEV', 'APROVADO_CLI'))::int AS concluidas,
        COUNT(*) FILTER (WHERE status NOT IN ('CONCLUIDO', 'CONCLUIDO_DEV', 'APROVADO_CLI'))::int AS em_andamento
      FROM solicitacoes WHERE ${fc}
    `))[0] || { total: 0, concluidas: 0, em_andamento: 0 }

    const deletado = (await rows(sql`
      SELECT COUNT(*)::int AS total FROM logs
      WHERE tipo = 'DELECAO' AND entidade = 'Solicitação' AND ${fd}
    `))[0] || { total: 0 }

    const totalCriadas = Number(agregado.total ?? 0)
    const totalDeletadas = Number(deletado.total ?? 0)
    const concluidas = Number(agregado.concluidas ?? 0)
    const emAndamento = Number(agregado.em_andamento ?? 0)
    const taxaSucesso = totalCriadas > 0
      ? Math.round((concluidas / totalCriadas) * 10000) / 100
      : 0

    const porMes = await rows(sql`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS mes, COUNT(*)::int AS criadas
      FROM solicitacoes WHERE ${fc}
      GROUP BY mes ORDER BY mes
    `)

    const deletadasPorMes = await rows(sql`
      SELECT TO_CHAR(created_at, 'YYYY-MM') AS mes, COUNT(*)::int AS deletadas
      FROM logs WHERE tipo = 'DELECAO' AND entidade = 'Solicitação' AND ${fd}
      GROUP BY mes ORDER BY mes
    `)

    const concluidasPorMes = await rows(sql`
      SELECT TO_CHAR(data_conclusao, 'YYYY-MM') AS mes, COUNT(*)::int AS concluidas
      FROM solicitacoes WHERE status IN ('CONCLUIDO', 'CONCLUIDO_DEV', 'APROVADO_CLI') AND ${fdc}
      GROUP BY mes ORDER BY mes
    `)

    const mesMap: Record<string, any> = {}
    for (const r of porMes) mesMap[r.mes] = { mes: r.mes, criadas: Number(r.criadas), deletadas: 0, concluidas: 0 }
    for (const r of deletadasPorMes) {
      if (!mesMap[r.mes]) mesMap[r.mes] = { mes: r.mes, criadas: 0, deletadas: 0, concluidas: 0 }
      mesMap[r.mes].deletadas = Number(r.deletadas)
    }
    for (const r of concluidasPorMes) {
      if (!mesMap[r.mes]) mesMap[r.mes] = { mes: r.mes, criadas: 0, deletadas: 0, concluidas: 0 }
      mesMap[r.mes].concluidas = Number(r.concluidas)
    }

    const recentes = await rows(sql`
      SELECT id, cliente, tipo, status, TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at
      FROM solicitacoes WHERE ${fc}
      ORDER BY created_at DESC LIMIT 20
    `)

    return NextResponse.json({
      stats: { totalCriadas, totalDeletadas, concluidas, emAndamento, taxaSucesso },
      porMes: Object.values(mesMap).sort((a: any, b: any) => a.mes.localeCompare(b.mes)),
      recentes: recentes.map((r: any) => ({
        id: r.id,
        cliente: r.cliente,
        tipo: r.tipo,
        status: r.status,
        createdAt: r.created_at,
      })),
    })
  } catch (error) {
    console.error("[GET /api/relatorios/solicitacoes-criadas]", error)
    return NextResponse.json({
      error: "Erro interno",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
