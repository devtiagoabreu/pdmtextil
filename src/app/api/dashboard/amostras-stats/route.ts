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

    // Totals - tecido cru
    const cruTotal = await q(sql`SELECT COUNT(*) as total FROM produto_cru_amostra`)
    const totalCru = Array.isArray(cruTotal) ? Number(cruTotal[0]?.total ?? 0) : 0

    // Totals - acabamento
    const acabTotal = await q(sql`SELECT COUNT(*) as total FROM produto_cru_acabamento_amostra`)
    const totalAcab = Array.isArray(acabTotal) ? Number(acabTotal[0]?.total ?? 0) : 0

    const totalGeral = totalCru + totalAcab

    // Status counts - tecido cru
    const cruPend = await q(sql`SELECT COUNT(*) as total FROM produto_cru_amostra WHERE status = 'PENDENTE'`)
    const cruAprov = await q(sql`SELECT COUNT(*) as total FROM produto_cru_amostra WHERE status = 'APROVADO'`)
    const cruRepr = await q(sql`SELECT COUNT(*) as total FROM produto_cru_amostra WHERE status = 'REPROVADO'`)
    const pendentesCru = Array.isArray(cruPend) ? Number(cruPend[0]?.total ?? 0) : 0
    const aprovadasCru = Array.isArray(cruAprov) ? Number(cruAprov[0]?.total ?? 0) : 0
    const reprovadasCru = Array.isArray(cruRepr) ? Number(cruRepr[0]?.total ?? 0) : 0

    // Status counts - acabamento
    const acabPend = await q(sql`SELECT COUNT(*) as total FROM produto_cru_acabamento_amostra WHERE status = 'PENDENTE'`)
    const acabAprov = await q(sql`SELECT COUNT(*) as total FROM produto_cru_acabamento_amostra WHERE status = 'APROVADO'`)
    const acabRepr = await q(sql`SELECT COUNT(*) as total FROM produto_cru_acabamento_amostra WHERE status = 'REPROVADO'`)
    const pendentesAcab = Array.isArray(acabPend) ? Number(acabPend[0]?.total ?? 0) : 0
    const aprovadasAcab = Array.isArray(acabAprov) ? Number(acabAprov[0]?.total ?? 0) : 0
    const reprovadasAcab = Array.isArray(acabRepr) ? Number(acabRepr[0]?.total ?? 0) : 0

    const totalPendentes = pendentesCru + pendentesAcab
    const totalAprovadas = aprovadasCru + aprovadasAcab
    const totalReprovadas = reprovadasCru + reprovadasAcab

    // Status distribution (combined - for pie chart)
    const statusDist = [
      { status: "PENDENTE", total: totalPendentes },
      { status: "APROVADO", total: totalAprovadas },
      { status: "REPROVADO", total: totalReprovadas },
    ]

    // Tipo distribution
    const tipoDist = [
      { tipo: "TECIDO_CRU", total: totalCru },
      { tipo: "ACABAMENTO", total: totalAcab },
    ]

    // Monthly trend (last 6 months) - combined amostras
    const trendData: { mes: string; total: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString()
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString()
      const cruRows = await q(sql`
        SELECT COUNT(*) as total FROM produto_cru_amostra
        WHERE created_at >= ${start}::timestamp AND created_at <= ${end}::timestamp
      `)
      const acabRows = await q(sql`
        SELECT COUNT(*) as total FROM produto_cru_acabamento_amostra
        WHERE created_at >= ${start}::timestamp AND created_at <= ${end}::timestamp
      `)
      const cruCount = Array.isArray(cruRows) ? Number(cruRows[0]?.total ?? 0) : 0
      const acabCount = Array.isArray(acabRows) ? Number(acabRows[0]?.total ?? 0) : 0
      trendData.push({
        mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        total: cruCount + acabCount,
      })
    }

    // Recent amostras (last 10 combined)
    const recentRows = await q(sql`
      (SELECT
        am.id, am.descricao, am.status, am.motivo_aprovacao as "motivoAprovacao",
        am.data, am.created_at as "createdAt",
        p.codigo_pdm as "produtoCodigo", p.descricao as "produtoDescricao",
        NULL as "acabamentoDescricao",
        'TECIDO_CRU' as "tipoAmostra"
      FROM produto_cru_amostra am
      JOIN produtos_cru p ON p.id = am.produto_cru_id)
      UNION ALL
      (SELECT
        aam.id, aam.descricao, aam.status, aam.motivo_aprovacao as "motivoAprovacao",
        aam.data, aam.created_at as "createdAt",
        p.codigo_pdm as "produtoCodigo", p.descricao as "produtoDescricao",
        ac.descricao as "acabamentoDescricao",
        'ACABAMENTO' as "tipoAmostra"
      FROM produto_cru_acabamento_amostra aam
      JOIN produto_cru_acabamento ac ON ac.id = aam.acabamento_id
      JOIN produtos_cru p ON p.id = ac.produto_cru_id)
      ORDER BY "createdAt" DESC
      LIMIT 10
    `)
    const recent = Array.isArray(recentRows) ? recentRows : []

    return NextResponse.json({
      totalGeral,
      totalCru,
      totalAcab,
      totalPendentes,
      totalAprovadas,
      totalReprovadas,
      pendentesCru,
      aprovadasCru,
      reprovadasCru,
      pendentesAcab,
      aprovadasAcab,
      reprovadasAcab,
      statusDistribution: statusDist,
      tipoDistribution: tipoDist,
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
