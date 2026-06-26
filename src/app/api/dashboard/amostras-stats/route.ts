import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { status } from "@/lib/db/schema/status"
import { eq, asc, sql } from "drizzle-orm"
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

    // Load dynamic status config for AMOSTRA
    const statusConfigs = await db
      .select({ nome: status.nome, rotulo: status.rotulo, cor: status.cor, ordem: status.ordem })
      .from(status)
      .where(eq(status.tipo, "AMOSTRA"))
      .orderBy(asc(status.ordem), asc(status.nome))

    const statusNomes = statusConfigs.map(s => s.nome)

    const [
      cruStatusRaw,
      acabStatusRaw,
      trendRaw,
      recentRaw,
      totalMesRaw,
    ] = await Promise.all([
      q(sql`
        SELECT status, COUNT(*)::int AS total
        FROM produto_cru_amostra GROUP BY status
      `, []),
      q(sql`
        SELECT status, COUNT(*)::int AS total
        FROM produto_cru_acabamento_amostra GROUP BY status
      `, []),
      q(sql`
        SELECT mes, SUM(total)::int AS total
        FROM (
          SELECT date_trunc('month', created_at)::date AS mes, COUNT(*) AS total
          FROM produto_cru_amostra
          WHERE created_at >= date_trunc('month', now()) - INTERVAL '5 months'
          GROUP BY mes
          UNION ALL
          SELECT date_trunc('month', created_at)::date AS mes, COUNT(*) AS total
          FROM produto_cru_acabamento_amostra
          WHERE created_at >= date_trunc('month', now()) - INTERVAL '5 months'
          GROUP BY mes
        ) sub
        GROUP BY mes
        ORDER BY mes
      `, []),
      q(sql`
        (SELECT
          am.id, am.descricao, am.status, am.motivo_aprovacao as "motivoAprovacao",
          am.data, am.created_at as "createdAt",
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
      q(sql`
        SELECT COUNT(*)::int AS total
        FROM (
          SELECT id FROM produto_cru_amostra
          WHERE created_at >= date_trunc('month', now())
          UNION ALL
          SELECT id FROM produto_cru_acabamento_amostra
          WHERE created_at >= date_trunc('month', now())
        ) sub
      `, { total: 0 }),
    ])

    const cruStatus = Array.isArray(cruStatusRaw) ? cruStatusRaw : []
    const acabStatus = Array.isArray(acabStatusRaw) ? acabStatusRaw : []
    const trendRows = Array.isArray(trendRaw) ? trendRaw : []
    const recent = Array.isArray(recentRaw) ? recentRaw : []
    const totalMes = totalMesRaw?.total ?? 0

    const getCount = (rows: any[], s: string) => {
      const r = rows.find((x: any) => x.status === s)
      return r ? Number(r.total) : 0
    }

    // Dynamically build counts per status
    const statusDistribution = statusConfigs.map(c => ({
      status: c.nome,
      rotulo: c.rotulo,
      cor: c.cor,
      total: getCount(cruStatus, c.nome) + getCount(acabStatus, c.nome),
    }))

    // Totals
    const totalGeral = statusDistribution.reduce((acc, s) => acc + s.total, 0)
    const totalCru = cruStatus.reduce((acc: number, r: any) => acc + Number(r.total), 0)
    const totalAcab = acabStatus.reduce((acc: number, r: any) => acc + Number(r.total), 0)

    // Sub-totals by type per status
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
