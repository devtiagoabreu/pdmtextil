import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmPropostas } from "@/lib/db/schema/crm-propostas"
import { eq } from "drizzle-orm"
import { registrarLog, notificarDelecao } from "@/lib/notificar"
import { inserirTimelineEvento } from "@/lib/crm-timeline"
import { handleApiError } from "@/lib/api-error"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [proposta] = await db
      .select()
      .from(crmPropostas)
      .where(eq(crmPropostas.id, parseInt(id)))
      .limit(1)

    if (!proposta) {
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 })
    }

    return NextResponse.json(proposta)
  } catch (error) {
    return handleApiError(error, "GET /api/crm/propostas/[id]")
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
    const body = await req.json()

    const [existente] = await db
      .select()
      .from(crmPropostas)
      .where(eq(crmPropostas.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 })
    }

    const values: Record<string, any> = { updatedAt: new Date() }
    if (body.titulo !== undefined) values.titulo = body.titulo
    if (body.valor !== undefined) values.valor = body.valor
    if (body.descricao !== undefined) values.descricao = body.descricao
    if (body.condicoesPagamento !== undefined) values.condicoesPagamento = body.condicoesPagamento
    if (body.prazoEntrega !== undefined) values.prazoEntrega = body.prazoEntrega
    if (body.arquivoUrl !== undefined) values.arquivoUrl = body.arquivoUrl
    if (body.empresaId !== undefined) values.empresaId = body.empresaId
    if (body.oportunidadeId !== undefined) values.oportunidadeId = body.oportunidadeId

    if (body.status !== undefined) {
      values.status = body.status
      if (body.status !== "ENVIADA" && !existente.dataResposta) {
        values.dataResposta = new Date()
      }
    }

    const [atualizada] = await db
      .update(crmPropostas)
      .set(values)
      .where(eq(crmPropostas.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Proposta #${id} atualizada para ${body.status || "mesmo estado"}`,
      entidade: "CrmProposta",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    if (body.status && body.status !== existente.status) {
      await inserirTimelineEvento({
        empresaId: existente.empresaId,
        tipo: "PROPOSTA",
        descricao: `Proposta "${existente.titulo}" ${body.status === "ACEITA" ? "aceita" : body.status === "RECUSADA" ? "recusada" : body.status === "REVISAO" ? "enviada para revisão" : "enviada"}`,
        metadados: { propostaId: atualizada.id, statusAnterior: existente.status, statusNovo: body.status },
      })
    }

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/crm/propostas/[id]")
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    if (auth.session.user.role !== "ADMIN" && auth.session.user.role !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir" }, { status: 403 })
    }

    const { id } = await params
    await db.delete(crmPropostas).where(eq(crmPropostas.id, parseInt(id)))

    await notificarDelecao("Proposta CRM", id, auth.session.user.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/crm/propostas/[id]")
  }
}
