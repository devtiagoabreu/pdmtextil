import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmViagens } from "@/lib/db/schema/crm-viagens"
import { crmViagensInvestimentos } from "@/lib/db/schema/crm-viagens-investimentos"
import { crmVisitas } from "@/lib/db/schema/crm-visitas"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc, sql, ilike, or, and, count, inArray } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() || ""
    const status = searchParams.get("status")
    const mine = searchParams.get("mine") === "true"
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")))
    const all = searchParams.get("all") === "true"

    const conditions = []
    if (status) conditions.push(eq(crmViagens.status, status))
    if (mine) conditions.push(eq(crmViagens.criadoPor, auth.userId))
    if (q.length >= 2) {
      conditions.push(
        or(
          ilike(crmViagens.titulo, `%${q}%`),
          ilike(crmViagens.destinoCidade, `%${q}%`),
          ilike(crmViagens.descricao, `%${q}%`),
        )!
      )
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const baseQuery = db
      .select({
        id: crmViagens.id,
        titulo: crmViagens.titulo,
        descricao: crmViagens.descricao,
        destinoCidade: crmViagens.destinoCidade,
        destinoUf: crmViagens.destinoUf,
        dataInicio: crmViagens.dataInicio,
        dataFim: crmViagens.dataFim,
        status: crmViagens.status,
        criadoPor: crmViagens.criadoPor,
        criadoPorNome: usuarios.name,
        totalInvestimento: sql`COALESCE((SELECT COALESCE(SUM(i.valor), 0) FROM crm_viagens_investimentos i WHERE i.viagem_id = ${crmViagens.id}), 0)`,
        totalVisitas: sql`(SELECT COUNT(*) FROM crm_visitas v WHERE v.viagem_id = ${crmViagens.id})`,
        createdAt: crmViagens.createdAt,
        updatedAt: crmViagens.updatedAt,
      })
      .from(crmViagens)
      .leftJoin(usuarios, eq(crmViagens.criadoPor, usuarios.id))
      .where(where)

    if (all) {
      const lista = await baseQuery.orderBy(desc(crmViagens.dataInicio), desc(crmViagens.id))
      return NextResponse.json(lista)
    }

    const [{ total }] = await db
      .select({ total: count() })
      .from(crmViagens)
      .where(where)

    const lista = await baseQuery
      .orderBy(desc(crmViagens.dataInicio), desc(crmViagens.id))
      .limit(limit)
      .offset((page - 1) * limit)

    return NextResponse.json({
      data: lista,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      limit,
    })
  } catch (error) {
    console.error("[GET /api/crm/viagens]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session
    const userId = auth.userId

    const body = await req.json()

    if (!body.titulo?.trim()) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 })
    }

    const investimentos = Array.isArray(body.investimentos)
      ? body.investimentos
          .filter((i: any) => i?.tipo)
          .map((i: any) => ({
            tipo: i.tipo.trim(),
            valor: i.valor != null && i.valor !== "" ? i.valor : null,
            observacao: i.observacao?.trim() || null,
          }))
      : []

    const [viagem] = await db.transaction(async (tx: any) => {
      const [created] = await tx
        .insert(crmViagens)
        .values({
          titulo: body.titulo.trim(),
          descricao: body.descricao?.trim() || null,
          destinoCidade: body.destinoCidade?.trim() || null,
          destinoUf: body.destinoUf?.trim() || null,
          dataInicio: body.dataInicio || null,
          dataFim: body.dataFim || null,
          status: body.status || "PLANEJADA",
          criadoPor: userId,
        })
        .returning()

      if (investimentos.length > 0) {
        await tx.insert(crmViagensInvestimentos).values(
          investimentos.map((inv: any) => ({ ...inv, viagemId: created.id }))
        )
      }

      return [created]
    })

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Viagem "${viagem.titulo}" criada${investimentos.length > 0 ? ` com ${investimentos.length} investimento(s)` : ""}`,
      entidade: "CrmViagem",
      entidadeId: viagem.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(viagem, { status: 201 })
  } catch (error: any) {
    console.error("[POST /api/crm/viagens]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
