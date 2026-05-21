import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { produtosCru } from "@/lib/db/schema/produto-cru"
import { and, gte, lte, sql } from "drizzle-orm"

function buildConditions(role: string, userId: number) {
  const conditions: any[] = []
  return conditions
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const userId = parseInt(session.user.id)
    const role = session.user.role

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const roleConditions = buildConditions(role, userId)

    // Current month stats
    const monthConditions = [...roleConditions, gte(solicitacoes.createdAt, startOfMonth), lte(solicitacoes.createdAt, endOfMonth)]
    const monthWhere = monthConditions.length > 0 ? and(...monthConditions) : undefined

    const stats = await db
      .select({
        total: sql<number>`count(*)`,
        pendentes: sql<number>`count(*) filter (where ${solicitacoes.status} = 'PENDENTE')`,
        emDesenvolvimento: sql<number>`count(*) filter (where ${solicitacoes.status} = 'EM_DESENVOLVIMENTO')`,
        concluidas: sql<number>`count(*) filter (where ${solicitacoes.status} = 'CONCLUIDO')`,
      })
      .from(solicitacoes)
      .where(monthWhere)

    const result = stats[0] || { total: 0, pendentes: 0, emDesenvolvimento: 0, concluidas: 0 }

    // Monthly trend (last 6 months)
    const trendData: { mes: string; total: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      const trendConditions = [...roleConditions, gte(solicitacoes.createdAt, start), lte(solicitacoes.createdAt, end)]
      const trendWhere = trendConditions.length > 0 ? and(...trendConditions) : undefined
      const [row] = await db.select({ total: sql<number>`count(*)` }).from(solicitacoes).where(trendWhere)
      trendData.push({
        mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        total: row?.total || 0,
      })
    }

    // Status distribution (all time)
    const statusAllConditions = roleConditions.length > 0 ? and(...roleConditions) : undefined
    const statusDist = await db
      .select({
        status: solicitacoes.status,
        total: sql<number>`count(*)`,
      })
      .from(solicitacoes)
      .where(statusAllConditions)
      .groupBy(solicitacoes.status)

    // Tipo distribution (all time)
    const tipoDist = await db
      .select({
        tipo: solicitacoes.tipo,
        total: sql<number>`count(*)`,
      })
      .from(solicitacoes)
      .where(statusAllConditions)
      .groupBy(solicitacoes.tipo)

    // Produto-cru count
    const [prodCount] = await db.select({ total: sql<number>`count(*)` }).from(produtosCru)

    return NextResponse.json({
      totalEsteMes: result.total,
      pendentes: result.pendentes,
      emDesenvolvimento: result.emDesenvolvimento,
      concluidas: result.concluidas,
      monthlyTrend: trendData,
      statusDistribution: statusDist,
      tipoDistribution: tipoDist,
      totalProdutosCru: prodCount?.total || 0,
    })
  } catch (error) {
    console.error("[GET /api/dashboard/stats]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
