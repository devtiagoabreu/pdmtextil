import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { status } from "@/lib/db/schema/status"
import { eq, asc, sql } from "drizzle-orm"
export const dynamic = "force-dynamic"

function parseJson(value: any, fallback: any = []) {
  if (value == null) return fallback
  return typeof value === "string" ? JSON.parse(value) : value
}

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

    const statusConfigs = await db
      .select({ nome: status.nome, rotulo: status.rotulo, cor: status.cor, ordem: status.ordem })
      .from(status)
      .where(eq(status.tipo, "AMOSTRA"))
      .orderBy(asc(status.ordem), asc(status.nome))

    const [aggRaw, recentRaw] = await Promise.all([
      q(sql`
        SELECT
          (SELECT json_agg(json_build_object('source', source, 'status', status, 'total', cnt))
           FROM (
             SELECT 'CRU' AS source, status, COUNT(*)::int AS cnt
             FROM produto_cru_amostra GROUP BY status
             UNION ALL
             SELECT 'ACAB' AS source, status, COUNT(*)::int AS cnt
             FROM produto_cru_acabamento_amostra GROUP BY status
           ) sc) AS status_counts,
          (SELECT json_agg(json_build_object('mes', mes::text, 'total', total) ORDER BY mes)
           FROM (
             SELECT mes, SUM(total)::int AS total FROM (
               SELECT date_trunc('month', created_at)::date AS mes, COUNT(*) AS total
               FROM produto_cru_amostra
               WHERE created_at >= date_trunc('month', now()) - INTERVAL '5 months'
               GROUP BY 1
               UNION ALL
               SELECT date_trunc('month', created_at)::date AS mes, COUNT(*) AS total
               FROM produto_cru_acabamento_amostra
               WHERE created_at >= date_trunc('month', now()) - INTERVAL '5 months'
               GROUP BY 1
             ) sub GROUP BY mes
           ) t) AS trend,
          (SELECT COUNT(*)::int
           FROM (
             SELECT id FROM produto_cru_amostra WHERE created_at >= date_trunc('month', now())
             UNION ALL
             SELECT id FROM produto_cru_acabamento_amostra WHERE created_at >= date_trunc('month', now())
           ) sub) AS total_mes
      `),
      q(sql`
        (SELECT
          am.id, am.descricao, am.status, am.motivo_aprovacao as "motivoAprovacao",
          am.data, am.created_at as "createdAt",
          am.dados,
          p.id as "produtoId",
          p.codigo_pdm as "produtoCodigo", p.descricao as "produtoDescricao",
          p.id_integracao as "idIntegracao",
          NULL as "acabamentoDescricao",
          'TECIDO_CRU' as "tipoAmostra",
          s.id as "solicitacaoId", s.cliente as "solicitacaoCliente", s.projeto as "solicitacaoProjeto"
        FROM produto_cru_amostra am
        JOIN produtos_cru p ON p.id = am.produto_cru_id
        LEFT JOIN solicitacoes s ON s.id = p.solicitacao_desenvolvimento_id)
        UNION ALL
        (SELECT
          aam.id, aam.descricao, aam.status, aam.motivo_aprovacao as "motivoAprovacao",
          aam.data, aam.created_at as "createdAt",
          aam.dados,
          p.id as "produtoId",
          p.codigo_pdm as "produtoCodigo", p.descricao as "produtoDescricao",
          p.id_integracao as "idIntegracao",
          ac.descricao as "acabamentoDescricao",
          'ACABAMENTO' as "tipoAmostra",
          s.id as "solicitacaoId", s.cliente as "solicitacaoCliente", s.projeto as "solicitacaoProjeto"
        FROM produto_cru_acabamento_amostra aam
        JOIN produto_cru_acabamento ac ON ac.id = aam.acabamento_id
        JOIN produtos_cru p ON p.id = ac.produto_cru_id
        LEFT JOIN solicitacoes s ON s.id = p.solicitacao_desenvolvimento_id)
        ORDER BY "createdAt" DESC
        LIMIT 10
      `, []),
    ])

    const agg = Array.isArray(aggRaw) ? aggRaw[0] : aggRaw ?? {}
    const cruStatusRaw = parseJson(agg?.status_counts)
    const trendRows = parseJson(agg?.trend)
    const totalMes = agg?.total_mes ?? 0
    const recent = Array.isArray(recentRaw) ? recentRaw : []

    const cruStatus = cruStatusRaw.filter((r: any) => r.source === "CRU")
    const acabStatus = cruStatusRaw.filter((r: any) => r.source === "ACAB")

    const getCount = (rows: any[], s: string) => {
      const r = rows.find((x: any) => x.status === s)
      return r ? Number(r.total) : 0
    }

    const statusDistribution = statusConfigs.map(c => ({
      status: c.nome,
      rotulo: c.rotulo,
      cor: c.cor,
      total: getCount(cruStatus, c.nome) + getCount(acabStatus, c.nome),
    }))

    const totalGeral = statusDistribution.reduce((acc, s) => acc + s.total, 0)
    const totalCru = cruStatus.reduce((acc: number, r: any) => acc + Number(r.total), 0)
    const totalAcab = acabStatus.reduce((acc: number, r: any) => acc + Number(r.total), 0)

    const statusDistribCru = statusConfigs.map(c => ({
      status: c.nome,
      total: getCount(cruStatus, c.nome),
    }))
    const statusDistribAcab = statusConfigs.map(c => ({
      status: c.nome,
      total: getCount(acabStatus, c.nome),
    }))

    const trendData = trendRows.map((r: any) => {
      const d = new Date(r.mes)
      return {
        mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        total: Number(r.total),
      }
    })

    return NextResponse.json({
      totalGeral,
      totalMes,
      totalCru,
      totalAcab,
      statusDistribution,
      statusDistribCru,
      statusDistribAcab,
      statusConfigs,
      tipoDistribution: [
        { tipo: "TECIDO_CRU", total: totalCru },
        { tipo: "ACABAMENTO", total: totalAcab },
      ],
      monthlyTrend: trendData,
      recent,
    })
  } catch (error) {
    console.error("[GET /api/dashboard/amostras-stats]", error)
    return NextResponse.json({
      error: "Erro interno",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
