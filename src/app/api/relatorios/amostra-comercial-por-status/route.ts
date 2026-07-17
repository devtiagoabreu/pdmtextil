import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { requisicoesAmostraComercial } from "@/lib/db/schema/requisicoes-amostra-comercial"
import { produtosCru } from "@/lib/db/schema/produto-cru"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, count, and, gte, lte, sql } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const url = new URL(req.url)
    const status = url.searchParams.get("status")
    const dataInicio = url.searchParams.get("dataInicio")
    const dataFim = url.searchParams.get("dataFim")

    const conditions = []
    if (status) conditions.push(eq(requisicoesAmostraComercial.status, status))
    if (dataInicio) conditions.push(gte(requisicoesAmostraComercial.createdAt, new Date(dataInicio)))
    if (dataFim) conditions.push(lte(requisicoesAmostraComercial.createdAt, new Date(dataFim)))

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    async function withWhere<T>(qb: any): Promise<T> {
      return conditions.length > 0 ? qb.where(whereClause) : qb
    }

    let totalQuery = db.select({ total: count() }).from(requisicoesAmostraComercial)
    if (conditions.length > 0) totalQuery = totalQuery.where(whereClause) as typeof totalQuery
    const [totalRow] = await totalQuery

    let statusQuery = db
      .select({
        status: requisicoesAmostraComercial.status,
        count: count(),
      })
      .from(requisicoesAmostraComercial)
    if (conditions.length > 0) statusQuery = statusQuery.where(whereClause) as typeof statusQuery
    const porStatus = await statusQuery.groupBy(requisicoesAmostraComercial.status)

    let mesQuery = db
      .select({
        mes: sql<string>`to_char(${requisicoesAmostraComercial.createdAt}, 'YYYY-MM')`,
        total: count(),
      })
      .from(requisicoesAmostraComercial)
    if (conditions.length > 0) mesQuery = mesQuery.where(whereClause) as typeof mesQuery
    const porMesRaw = await mesQuery
      .groupBy(sql`to_char(${requisicoesAmostraComercial.createdAt}, 'YYYY-MM')`)
      .orderBy(sql`to_char(${requisicoesAmostraComercial.createdAt}, 'YYYY-MM')`)

    let listaQuery = db
      .select({
        id: requisicoesAmostraComercial.id,
        status: requisicoesAmostraComercial.status,
        titulo: requisicoesAmostraComercial.titulo,
        cliente: requisicoesAmostraComercial.cliente,
        quantidade: requisicoesAmostraComercial.quantidade,
        motivo: requisicoesAmostraComercial.motivo,
        observacoes: requisicoesAmostraComercial.observacoes,
        prazoDesejado: requisicoesAmostraComercial.prazoDesejado,
        createdAt: requisicoesAmostraComercial.createdAt,
        updatedAt: requisicoesAmostraComercial.updatedAt,
        produtoCodigo: produtosCru.codigoPdm,
        produtoDescricao: produtosCru.descricao,
        solicitanteNome: usuarios.name,
      })
      .from(requisicoesAmostraComercial)
      .innerJoin(produtosCru, eq(requisicoesAmostraComercial.produtoCruId, produtosCru.id))
      .leftJoin(usuarios, eq(requisicoesAmostraComercial.solicitanteId, usuarios.id))
    if (conditions.length > 0) listaQuery = listaQuery.where(whereClause) as typeof listaQuery
    const lista = await listaQuery.orderBy(desc(requisicoesAmostraComercial.createdAt))

    const total = Number(totalRow?.total ?? 0)

    return NextResponse.json({
      total,
      porStatus,
      porMes: porMesRaw.map((r) => ({ mes: r.mes, total: Number(r.total) })),
      lista,
    })
  } catch (error) {
    console.error("[GET /api/relatorios/amostra-comercial-por-status]", error)
    return NextResponse.json({
      error: "Erro interno",
      detail: "Erro interno",
    }, { status: 500 })
  }
}
