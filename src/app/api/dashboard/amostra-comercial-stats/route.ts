import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { requisicoesAmostraComercial } from "@/lib/db/schema/requisicoes-amostra-comercial"
import { produtosCru } from "@/lib/db/schema/produto-cru"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, sql, count } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const porStatus = await db
      .select({
        status: requisicoesAmostraComercial.status,
        count: count().mapWith(Number),
      })
      .from(requisicoesAmostraComercial)
      .groupBy(requisicoesAmostraComercial.status)

    const [totalMesRow] = await db
      .select({
        total: count().mapWith(Number),
      })
      .from(requisicoesAmostraComercial)
      .where(
        sql`${requisicoesAmostraComercial.createdAt} >= date_trunc('month', CURRENT_TIMESTAMP)`
      )

    const recent = await db
      .select({
        id: requisicoesAmostraComercial.id,
        status: requisicoesAmostraComercial.status,
        titulo: requisicoesAmostraComercial.titulo,
        cliente: requisicoesAmostraComercial.cliente,
        quantidade: requisicoesAmostraComercial.quantidade,
        createdAt: requisicoesAmostraComercial.createdAt,
        prazoDesejado: requisicoesAmostraComercial.prazoDesejado,
        produtoCodigo: produtosCru.codigoPdm,
        produtoDescricao: produtosCru.descricao,
        solicitanteNome: usuarios.name,
      })
      .from(requisicoesAmostraComercial)
      .innerJoin(produtosCru, eq(requisicoesAmostraComercial.produtoCruId, produtosCru.id))
      .leftJoin(usuarios, eq(requisicoesAmostraComercial.solicitanteId, usuarios.id))
      .orderBy(desc(requisicoesAmostraComercial.createdAt))
      .limit(10)

    return NextResponse.json({
      porStatus,
      totalMes: totalMesRow?.total ?? 0,
      recent,
    })
  } catch (error) {
    console.error("[GET /api/dashboard/amostra-comercial-stats]", error)
    return NextResponse.json({
      error: "Erro interno",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
