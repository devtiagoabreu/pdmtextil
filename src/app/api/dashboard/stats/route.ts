import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { produtosCru } from "@/lib/db/schema/produto-cru"
import { and, gte, lte, sql, eq } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    const monthWhere = and(
      gte(solicitacoes.createdAt, startOfMonth),
      lte(solicitacoes.createdAt, endOfMonth)
    )

    // Count total do mês
    const [totalRow] = await db
      .select({ total: sql<number>`count(*)` })
      .from(solicitacoes)
      .where(monthWhere)

    // Contagens por status no mês (usando queries separadas para evitar filter(where))
    const [pendentes] = await db
      .select({ total: sql<number>`count(*)` })
      .from(solicitacoes)
      .where(and(monthWhere, eq(solicitacoes.status, "PENDENTE")))

    const [emDesenvolvimento] = await db
      .select({ total: sql<number>`count(*)` })
      .from(solicitacoes)
      .where(and(monthWhere, eq(solicitacoes.status, "EM_DESENVOLVIMENTO")))

    const [concluidas] = await db
      .select({ total: sql<number>`count(*)` })
      .from(solicitacoes)
      .where(and(monthWhere, eq(solicitacoes.status, "CONCLUIDO")))

    // Monthly trend (last 6 months)
    const trendData: { mes: string; total: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const start = new Date(d.getFullYear(), d.getMonth(), 1)
      const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59)
      const [row] = await db
        .select({ total: sql<number>`count(*)` })
        .from(solicitacoes)
        .where(and(gte(solicitacoes.createdAt, start), lte(solicitacoes.createdAt, end)))
      trendData.push({
        mes: d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }),
        total: row?.total ?? 0,
      })
    }

    // Status distribution (all time)
    const statusDist = await db
      .select({
        status: solicitacoes.status,
        total: sql<number>`count(*)`,
      })
      .from(solicitacoes)
      .groupBy(solicitacoes.status)

    // Tipo distribution (all time)
    const tipoDist = await db
      .select({
        tipo: solicitacoes.tipo,
        total: sql<number>`count(*)`,
      })
      .from(solicitacoes)
      .groupBy(solicitacoes.tipo)

    // Produto-cru count
    const [prodCount] = await db
      .select({ total: sql<number>`count(*)` })
      .from(produtosCru)

    return NextResponse.json({
      totalEsteMes: totalRow?.total ?? 0,
      pendentes: pendentes?.total ?? 0,
      emDesenvolvimento: emDesenvolvimento?.total ?? 0,
      concluidas: concluidas?.total ?? 0,
      monthlyTrend: trendData,
      statusDistribution: statusDist,
      tipoDistribution: tipoDist,
      totalProdutosCru: prodCount?.total ?? 0,
    })
  } catch (error) {
    console.error("[GET /api/dashboard/stats]", error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
