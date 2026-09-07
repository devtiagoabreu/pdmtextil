import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmPedidosVenda } from "@/lib/db/schema/crm-pedidos-venda"
import { crmPedidoVendaItens } from "@/lib/db/schema/crm-pedido-venda-itens"
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
    if (status) conditions.push(eq(crmPedidosVenda.status, status))
    if (oportunidadeId) conditions.push(eq(crmPedidosVenda.oportunidadeId, parseInt(oportunidadeId)))
    if (q.length >= 2) {
      conditions.push(
        or(
          ilike(crmPedidosVenda.numero, `%${q}%`),
          ilike(crmPedidosVenda.referenciaExterna, `%${q}%`),
          ilike(crmOportunidades.titulo, `%${q}%`),
        )!
      )
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const baseQuery = db
      .select({
        id: crmPedidosVenda.id,
        oportunidadeId: crmPedidosVenda.oportunidadeId,
        oportunidadeTitulo: crmOportunidades.titulo,
        numero: crmPedidosVenda.numero,
        dataEmissao: crmPedidosVenda.dataEmissao,
        status: crmPedidosVenda.status,
        observacao: crmPedidosVenda.observacao,
        origem: crmPedidosVenda.origem,
        referenciaExterna: crmPedidosVenda.referenciaExterna,
        total: sql`COALESCE((SELECT COALESCE(SUM(i.valor_total), 0) FROM crm_pedido_venda_itens i WHERE i.pedido_venda_id = ${crmPedidosVenda.id}), 0)`,
        itensCount: sql`(SELECT COUNT(*) FROM crm_pedido_venda_itens i WHERE i.pedido_venda_id = ${crmPedidosVenda.id})`,
        createdAt: crmPedidosVenda.createdAt,
        updatedAt: crmPedidosVenda.updatedAt,
      })
      .from(crmPedidosVenda)
      .leftJoin(crmOportunidades, eq(crmPedidosVenda.oportunidadeId, crmOportunidades.id))
      .where(where)

    if (all) {
      const lista = await baseQuery.orderBy(desc(crmPedidosVenda.dataEmissao), desc(crmPedidosVenda.id))
      return NextResponse.json(lista)
    }

    const [{ total }] = await db
      .select({ total: count() })
      .from(crmPedidosVenda)
      .leftJoin(crmOportunidades, eq(crmPedidosVenda.oportunidadeId, crmOportunidades.id))
      .where(where)

    const lista = await baseQuery
      .orderBy(desc(crmPedidosVenda.dataEmissao), desc(crmPedidosVenda.id))
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
    console.error("[GET /api/crm/pedidos-venda]", error)
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

    const [pedido] = await db.transaction(async (tx: any) => {
      const [created] = await tx
        .insert(crmPedidosVenda)
        .values({
          oportunidadeId,
          numero: body.numero?.trim() || null,
          dataEmissao: body.dataEmissao || null,
          status: body.status || "ABERTO",
          observacao: body.observacao?.trim() || null,
          origem: body.origem || "MANUAL",
          referenciaExterna: body.referenciaExterna?.trim() || null,
        })
        .returning()

      await tx.insert(crmPedidoVendaItens).values(
        itens.map((item: any) => ({ ...item, pedidoVendaId: created.id }))
      )

      return [created]
    })

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Pedido de venda${pedido.numero ? ` "${pedido.numero}"` : ""} criado para a oportunidade "${oportunidade.titulo}" com ${itens.length} item(ns)`,
      entidade: "CrmPedidoVenda",
      entidadeId: pedido.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(pedido, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/pedidos-venda]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}