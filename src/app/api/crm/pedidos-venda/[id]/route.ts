import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmPedidosVenda } from "@/lib/db/schema/crm-pedidos-venda"
import { crmPedidoVendaItens } from "@/lib/db/schema/crm-pedido-venda-itens"
import { crmOportunidades } from "@/lib/db/schema/crm-oportunidades"
import { eq, asc } from "drizzle-orm"
import { registrarLog, notificar, notificarDelecao } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { normalizarItensVenda } from "@/lib/crm/documento-venda"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const pedidoId = parseInt(id)

    const [pedido] = await db
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
        createdAt: crmPedidosVenda.createdAt,
        updatedAt: crmPedidosVenda.updatedAt,
      })
      .from(crmPedidosVenda)
      .leftJoin(crmOportunidades, eq(crmPedidosVenda.oportunidadeId, crmOportunidades.id))
      .where(eq(crmPedidosVenda.id, pedidoId))
      .limit(1)

    if (!pedido) {
      return NextResponse.json({ error: "Pedido de venda não encontrado" }, { status: 404 })
    }

    const itens = await db
      .select()
      .from(crmPedidoVendaItens)
      .where(eq(crmPedidoVendaItens.pedidoVendaId, pedidoId))
      .orderBy(asc(crmPedidoVendaItens.id))

    return NextResponse.json({ ...pedido, itens })
  } catch (error) {
    return handleApiError(error, "GET /api/crm/pedidos-venda/[id]")
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const pedidoId = parseInt(id)
    const body = await req.json()

    const [existente] = await db
      .select()
      .from(crmPedidosVenda)
      .where(eq(crmPedidosVenda.id, pedidoId))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Pedido de venda não encontrado" }, { status: 404 })
    }

    const values: Record<string, any> = { updatedAt: new Date() }
    if (body.oportunidadeId !== undefined) {
      const oportunidadeId = parseInt(body.oportunidadeId)
      if (!oportunidadeId || Number.isNaN(oportunidadeId)) {
        return NextResponse.json({ error: "Oportunidade é obrigatória" }, { status: 400 })
      }
      values.oportunidadeId = oportunidadeId
    }
    if (body.numero !== undefined) values.numero = body.numero?.trim() || null
    if (body.dataEmissao !== undefined) values.dataEmissao = body.dataEmissao || null
    if (body.status !== undefined) values.status = body.status
    if (body.observacao !== undefined) values.observacao = body.observacao?.trim() || null
    if (body.referenciaExterna !== undefined) values.referenciaExterna = body.referenciaExterna?.trim() || null

    const itens = body.itens !== undefined ? normalizarItensVenda(body.itens) : null

    if (itens?.length === 0) {
      return NextResponse.json({ error: "Adicione ao menos um item com produto" }, { status: 400 })
    }

    const [atualizado] = await db.transaction(async (tx: any) => {
      const [updated] = await tx
        .update(crmPedidosVenda)
        .set(values)
        .where(eq(crmPedidosVenda.id, pedidoId))
        .returning()

      if (itens) {
        await tx.delete(crmPedidoVendaItens).where(eq(crmPedidoVendaItens.pedidoVendaId, pedidoId))
        await tx.insert(crmPedidoVendaItens).values(
          itens.map((item: any) => ({ ...item, pedidoVendaId: pedidoId }))
        )
      }

      return [updated]
    })

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Pedido de venda${atualizado.numero ? ` "${atualizado.numero}"` : ""} (#${pedidoId}) atualizado${itens ? ` — ${itens.length} item(ns)` : ""}`,
      entidade: "CrmPedidoVenda",
      entidadeId: atualizado.id,
      usuarioNome: session.user.name,
    })

    await notificar("PEDIDO_VENDA_ATUALIZADO", `Pedido de venda${atualizado.numero ? ` "${atualizado.numero}"` : ""} atualizado`, `/comercial/crm/pedidos-venda/${atualizado.id}`, session.user.name)

    return NextResponse.json(atualizado)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/pedidos-venda/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const pedidoId = parseInt(id)

    const [existente] = await db
      .select()
      .from(crmPedidosVenda)
      .where(eq(crmPedidosVenda.id, pedidoId))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Pedido de venda não encontrado" }, { status: 404 })
    }

    await db.transaction(async (tx: any) => {
      await tx.delete(crmPedidoVendaItens).where(eq(crmPedidoVendaItens.pedidoVendaId, pedidoId))
      await tx.delete(crmPedidosVenda).where(eq(crmPedidosVenda.id, pedidoId))
    })

    await registrarLog({
      tipo: "EXCLUSAO",
      acao: "excluir",
      descricao: `Pedido de venda${existente.numero ? ` "${existente.numero}"` : ""} (#${pedidoId}) excluído`,
      entidade: "CrmPedidoVenda",
      entidadeId: pedidoId,
      usuarioNome: session.user.name,
    })
    await notificarDelecao("Pedido de venda CRM", id, session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/pedidos-venda/[id]")
  }
}