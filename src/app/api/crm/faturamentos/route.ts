import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmFaturamentos } from "@/lib/db/schema/crm-faturamentos"
import { crmFaturamentoItens } from "@/lib/db/schema/crm-faturamento-itens"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { eq, desc, sql, ilike, or, and, count } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"
import { normalizarItensVenda } from "@/lib/crm/documento-venda"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const q = searchParams.get("q")?.trim() || ""
    const status = searchParams.get("status")
    const oportunidadeId = searchParams.get("oportunidadeId")
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50")))
    const all = searchParams.get("all") === "true"

    const conditions = []
    if (status) conditions.push(eq(crmFaturamentos.status, status))
    if (oportunidadeId) conditions.push(eq(crmFaturamentos.oportunidadeId, parseInt(oportunidadeId)))
    if (q.length >= 2) {
      conditions.push(
        or(
          ilike(crmFaturamentos.numero, `%${q}%`),
          ilike(crmFaturamentos.referenciaExterna, `%${q}%`),
          ilike(crmOportunidades.titulo, `%${q}%`),
        )!
      )
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const baseQuery = db
      .select({
        id: crmFaturamentos.id,
        oportunidadeId: crmFaturamentos.oportunidadeId,
        oportunidadeTitulo: crmOportunidades.titulo,
        numero: crmFaturamentos.numero,
        dataEmissao: crmFaturamentos.dataEmissao,
        status: crmFaturamentos.status,
        observacao: crmFaturamentos.observacao,
        origem: crmFaturamentos.origem,
        referenciaExterna: crmFaturamentos.referenciaExterna,
        total: sql`COALESCE((SELECT COALESCE(SUM(i.valor_total), 0) FROM crm_faturamento_itens i WHERE i.faturamento_id = ${crmFaturamentos.id}), 0)`,
        itensCount: sql`(SELECT COUNT(*) FROM crm_faturamento_itens i WHERE i.faturamento_id = ${crmFaturamentos.id})`,
        createdAt: crmFaturamentos.createdAt,
        updatedAt: crmFaturamentos.updatedAt,
      })
      .from(crmFaturamentos)
      .leftJoin(crmOportunidades, eq(crmFaturamentos.oportunidadeId, crmOportunidades.id))
      .where(where)

    if (all) {
      const lista = await baseQuery.orderBy(desc(crmFaturamentos.dataEmissao), desc(crmFaturamentos.id))
      return NextResponse.json(lista)
    }

    const [{ total }] = await db
      .select({ total: count() })
      .from(crmFaturamentos)
      .leftJoin(crmOportunidades, eq(crmFaturamentos.oportunidadeId, crmOportunidades.id))
      .where(where)

    const lista = await baseQuery
      .orderBy(desc(crmFaturamentos.dataEmissao), desc(crmFaturamentos.id))
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
    console.error("[GET /api/crm/faturamentos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()

    const oportunidadeId = parseInt(body.oportunidadeId)
    if (!oportunidadeId || Number.isNaN(oportunidadeId)) {
      return NextResponse.json({ error: "Oportunidade é obrigatória" }, { status: 400 })
    }

    const [oportunidade] = await db
      .select({ id: crmOportunidades.id, titulo: crmOportunidades.titulo })
      .from(crmOportunidades)
      .where(eq(crmOportunidades.id, oportunidadeId))
      .limit(1)

    if (!oportunidade) {
      return NextResponse.json({ error: "Oportunidade não encontrada" }, { status: 404 })
    }

    const itens = normalizarItensVenda(body.itens)

    if (itens.length === 0) {
      return NextResponse.json({ error: "Adicione ao menos um item com produto" }, { status: 400 })
    }

    const [faturamento] = await db.transaction(async (tx: any) => {
      const [created] = await tx
        .insert(crmFaturamentos)
        .values({
          oportunidadeId,
          numero: body.numero?.trim() || null,
          dataEmissao: body.dataEmissao || null,
          status: body.status || "EMITIDO",
          observacao: body.observacao?.trim() || null,
          origem: body.origem || "MANUAL",
          referenciaExterna: body.referenciaExterna?.trim() || null,
        })
        .returning()

      await tx.insert(crmFaturamentoItens).values(
        itens.map((item: any) => ({ ...item, faturamentoId: created.id }))
      )

      return [created]
    })

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Faturamento${faturamento.numero ? ` "${faturamento.numero}"` : ""} criado para a oportunidade "${oportunidade.titulo}" com ${itens.length} item(ns)`,
      entidade: "CrmFaturamento",
      entidadeId: faturamento.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(faturamento, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/faturamentos]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}