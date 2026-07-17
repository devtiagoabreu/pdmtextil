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

    function filtro(col = "data_conclusao") {
      let f = sql`TRUE`
      if (dataInicio) f = sql`${f} AND ${sql.identifier(col)} >= ${dataInicio}::timestamp`
      if (dataFim) f = sql`${f} AND ${sql.identifier(col)} <= ${dataFim}::timestamp`
      return f
    }

    const f = filtro()

    const statsRaw = (await rows(sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE tipo = 'DESENVOLVIMENTO_TECELAGEM')::int AS tecelagem,
        COUNT(*) FILTER (WHERE tipo = 'DESENVOLVIMENTO_BENEFICIAMENTO')::int AS beneficiamento
      FROM solicitacoes WHERE status = 'CONCLUIDO_DEV' AND ${f}
    `))[0] || { total: 0, tecelagem: 0, beneficiamento: 0 }

    const porMes = await rows(sql`
      SELECT TO_CHAR(data_conclusao, 'YYYY-MM') AS mes, COUNT(*)::int AS concluidas
      FROM solicitacoes WHERE status = 'CONCLUIDO_DEV' AND ${f}
      GROUP BY mes ORDER BY mes
    `)

    const lista = await rows(sql`
      SELECT
        id,
        tipo,
        cliente,
        projeto,
        status,
        TO_CHAR(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
        TO_CHAR(data_conclusao, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS data_conclusao,
        TO_CHAR(prazo_desejado, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS prazo_desejado
      FROM solicitacoes WHERE status = 'CONCLUIDO_DEV' AND ${f}
      ORDER BY data_conclusao DESC
    `)

    const total = Number(statsRaw.total ?? 0)
    const tecelagem = Number(statsRaw.tecelagem ?? 0)
    const beneficiamento = Number(statsRaw.beneficiamento ?? 0)

    return NextResponse.json({
      stats: { total, tecelagem, beneficiamento },
      porMes: porMes.map((r: any) => ({ mes: r.mes, concluidas: Number(r.concluidas) })),
      lista: lista.map((r: any) => ({
        id: r.id,
        tipo: r.tipo,
        cliente: r.cliente,
        projeto: r.projeto,
        status: r.status,
        createdAt: r.created_at,
        dataConclusao: r.data_conclusao,
        prazoDesejado: r.prazo_desejado,
        diasEmDev: r.created_at && r.data_conclusao
          ? Math.round((new Date(r.data_conclusao).getTime() - new Date(r.created_at).getTime()) / 86400000)
          : null,
      })),
    })
  } catch (error) {
    console.error("[GET /api/relatorios/solicitacoes-concluidas]", error)
    return NextResponse.json({
      error: "Erro interno",
      detail: "Erro interno",
    }, { status: 500 })
  }
}
