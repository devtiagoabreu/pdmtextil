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
    const status = url.searchParams.get("status")
    const dataInicio = url.searchParams.get("dataInicio")
    const dataFim = url.searchParams.get("dataFim")

    if (!status) {
      return NextResponse.json({ error: "Parâmetro 'status' é obrigatório" }, { status: 400 })
    }

    function filtro(col = "created_at") {
      let f = sql`TRUE`
      if (dataInicio) f = sql`${f} AND ${sql.identifier(col)} >= ${dataInicio}::timestamp`
      if (dataFim) f = sql`${f} AND ${sql.identifier(col)} <= ${dataFim}::timestamp`
      return f
    }

    const fc = filtro("created_at")

    const statsRaw = (await rows(sql`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE tipo_amostra = 'TECIDO_CRU')::int AS tecido_cru,
        COUNT(*) FILTER (WHERE tipo_amostra = 'ACABAMENTO')::int AS acabamento
      FROM (
        SELECT 'TECIDO_CRU' AS tipo_amostra, created_at FROM produto_cru_amostra WHERE status = ${status}
        UNION ALL
        SELECT 'ACABAMENTO' AS tipo_amostra, aam.created_at FROM produto_cru_acabamento_amostra aam WHERE aam.status = ${status}
      ) sub WHERE ${fc}
    `))[0] || { total: 0, tecido_cru: 0, acabamento: 0 }

    const porMes = await rows(sql`
      SELECT TO_CHAR(mes, 'YYYY-MM') AS mes, SUM(total)::int AS total
      FROM (
        SELECT date_trunc('month', created_at) AS mes, COUNT(*)::int AS total
        FROM produto_cru_amostra WHERE status = ${status} AND ${fc}
        GROUP BY mes
        UNION ALL
        SELECT date_trunc('month', created_at) AS mes, COUNT(*)::int AS total
        FROM produto_cru_acabamento_amostra WHERE status = ${status} AND ${fc}
        GROUP BY mes
      ) sub GROUP BY mes ORDER BY mes
    `)

    const lista = await rows(sql`
      SELECT id, produto_codigo, produto_descricao, tipo_amostra, descricao, status, data, created_at
      FROM (
        SELECT
          am.id,
          pc.codigo_pdm AS produto_codigo,
          pc.descricao AS produto_descricao,
          'TECIDO_CRU' AS tipo_amostra,
          am.descricao,
          am.status,
          am.data,
          am.created_at
        FROM produto_cru_amostra am
        JOIN produtos_cru pc ON pc.id = am.produto_cru_id
        WHERE am.status = ${status}
        UNION ALL
        SELECT
          aam.id,
          pc.codigo_pdm AS produto_codigo,
          pc.descricao AS produto_descricao,
          'ACABAMENTO' AS tipo_amostra,
          aam.descricao,
          aam.status,
          aam.data,
          aam.created_at
        FROM produto_cru_acabamento_amostra aam
        JOIN produto_cru_acabamento pa ON pa.id = aam.acabamento_id
        JOIN produtos_cru pc ON pc.id = pa.produto_cru_id
        WHERE aam.status = ${status}
      ) sub WHERE ${fc}
      ORDER BY created_at DESC
    `)

    const total = Number(statsRaw.total ?? 0)
    const tecidoCru = Number(statsRaw.tecido_cru ?? 0)
    const acabamento = Number(statsRaw.acabamento ?? 0)

    return NextResponse.json({
      stats: { total, tecidoCru, acabamento },
      porMes: porMes.map((r: any) => ({ mes: r.mes, total: Number(r.total) })),
      lista: lista.map((r: any) => ({
        id: r.id,
        tipoAmostra: r.tipo_amostra,
        descricao: r.descricao,
        status: r.status,
        produtoCodigo: r.produto_codigo,
        produtoDescricao: r.produto_descricao,
        data: r.data ? new Date(r.data).toISOString() : null,
        createdAt: r.created_at ? new Date(r.created_at).toISOString() : null,
      })),
    })
  } catch (error) {
    console.error("[GET /api/relatorios/amostras-por-status]", error)
    return NextResponse.json({
      error: "Erro interno",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
