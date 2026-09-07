import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmFaturamentos } from "@/lib/db/schema/crm-faturamentos"
import { crmFaturamentoItens } from "@/lib/db/schema/crm-faturamento-itens"
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
    const faturamentoId = parseInt(id)

    const [faturamento] = await db
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
        createdAt: crmFaturamentos.createdAt,
        updatedAt: crmFaturamentos.updatedAt,
      })
      .from(crmFaturamentos)
      .leftJoin(crmOportunidades, eq(crmFaturamentos.oportunidadeId, crmOportunidades.id))
      .where(eq(crmFaturamentos.id, faturamentoId))
      .limit(1)

    if (!faturamento) {
      return NextResponse.json({ error: "Faturamento não encontrado" }, { status: 404 })
    }

    const itens = await db
      .select()
      .from(crmFaturamentoItens)
      .where(eq(crmFaturamentoItens.faturamentoId, faturamentoId))
      .orderBy(asc(crmFaturamentoItens.id))

    return NextResponse.json({ ...faturamento, itens })
  } catch (error) {
    return handleApiError(error, "GET /api/crm/faturamentos/[id]")
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
    const faturamentoId = parseInt(id)
    const body = await req.json()

    const [existente] = await db
      .select()
      .from(crmFaturamentos)
      .where(eq(crmFaturamentos.id, faturamentoId))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Faturamento não encontrado" }, { status: 404 })
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
        .update(crmFaturamentos)
        .set(values)
        .where(eq(crmFaturamentos.id, faturamentoId))
        .returning()

      if (itens) {
        await tx.delete(crmFaturamentoItens).where(eq(crmFaturamentoItens.faturamentoId, faturamentoId))
        await tx.insert(crmFaturamentoItens).values(
          itens.map((item: any) => ({ ...item, faturamentoId }))
        )
      }

      return [updated]
    })

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Faturamento${atualizado.numero ? ` "${atualizado.numero}"` : ""} (#${faturamentoId}) atualizado${itens ? ` — ${itens.length} item(ns)` : ""}`,
      entidade: "CrmFaturamento",
      entidadeId: atualizado.id,
      usuarioNome: session.user.name,
    })

    await notificar("FATURAMENTO_ATUALIZADO", `Faturamento${atualizado.numero ? ` "${atualizado.numero}"` : ""} atualizado`, `/comercial/crm/faturamentos/${atualizado.id}`, session.user.name)

    return NextResponse.json(atualizado)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/faturamentos/[id]")
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
    const faturamentoId = parseInt(id)

    const [existente] = await db
      .select()
      .from(crmFaturamentos)
      .where(eq(crmFaturamentos.id, faturamentoId))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Faturamento não encontrado" }, { status: 404 })
    }

    await db.transaction(async (tx: any) => {
      await tx.delete(crmFaturamentoItens).where(eq(crmFaturamentoItens.faturamentoId, faturamentoId))
      await tx.delete(crmFaturamentos).where(eq(crmFaturamentos.id, faturamentoId))
    })

    await registrarLog({
      tipo: "EXCLUSAO",
      acao: "excluir",
      descricao: `Faturamento${existente.numero ? ` "${existente.numero}"` : ""} (#${faturamentoId}) excluído`,
      entidade: "CrmFaturamento",
      entidadeId: faturamentoId,
      usuarioNome: session.user.name,
    })
    await notificarDelecao("Faturamento CRM", id, session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/faturamentos/[id]")
  }
}