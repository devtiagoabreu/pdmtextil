import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { requisicoesAmostraComercial } from "@/lib/db/schema/requisicoes-amostra-comercial"
import { produtosCru } from "@/lib/db/schema/produto-cru"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"
import { registrarLog } from "@/lib/log"

export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    const solicitante = alias(usuarios, "solicitante")
    const responsavel = alias(usuarios, "responsavel")

    const [result] = await db
      .select({
        id: requisicoesAmostraComercial.id,
        status: requisicoesAmostraComercial.status,
        solicitanteId: requisicoesAmostraComercial.solicitanteId,
        responsavelId: requisicoesAmostraComercial.responsavelId,
        cliente: requisicoesAmostraComercial.cliente,
        produtoCruId: requisicoesAmostraComercial.produtoCruId,
        solicitacaoDesenvolvimentoId: requisicoesAmostraComercial.solicitacaoDesenvolvimentoId,
        titulo: requisicoesAmostraComercial.titulo,
        quantidade: requisicoesAmostraComercial.quantidade,
        motivo: requisicoesAmostraComercial.motivo,
        observacoes: requisicoesAmostraComercial.observacoes,
        historico: requisicoesAmostraComercial.historico,
        prazoDesejado: requisicoesAmostraComercial.prazoDesejado,
        createdAt: requisicoesAmostraComercial.createdAt,
        updatedAt: requisicoesAmostraComercial.updatedAt,
        produtoCodigo: produtosCru.codigoPdm,
        produtoDescricao: produtosCru.descricao,
        solicitanteNome: solicitante.name,
        responsavelNome: responsavel.name,
      })
      .from(requisicoesAmostraComercial)
      .innerJoin(produtosCru, eq(requisicoesAmostraComercial.produtoCruId, produtosCru.id))
      .leftJoin(solicitante, eq(requisicoesAmostraComercial.solicitanteId, solicitante.id))
      .leftJoin(responsavel, eq(requisicoesAmostraComercial.responsavelId, responsavel.id))
      .where(eq(requisicoesAmostraComercial.id, parseInt(id)))
      .limit(1)

    if (!result) {
      return NextResponse.json({ error: "Requisição não encontrada" }, { status: 404 })
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("[GET /api/requisicoes-amostra-comercial/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { session } = auth

    const { id } = await params
    const body = await req.json()

    const [existing] = await db
      .select()
      .from(requisicoesAmostraComercial)
      .where(eq(requisicoesAmostraComercial.id, parseInt(id)))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Requisição não encontrada" }, { status: 404 })
    }

    const updateData: Record<string, unknown> = {}

    const textFields = ["cliente", "titulo", "quantidade", "motivo", "observacoes"] as const
    for (const field of textFields) {
      if (body[field] !== undefined) updateData[field] = body[field]
    }

    if (body.produtoCruId !== undefined) updateData.produtoCruId = parseInt(body.produtoCruId)
    if (body.responsavelId !== undefined) updateData.responsavelId = body.responsavelId ? parseInt(body.responsavelId) : null
    if (body.solicitacaoDesenvolvimentoId !== undefined) {
      updateData.solicitacaoDesenvolvimentoId = body.solicitacaoDesenvolvimentoId ? parseInt(body.solicitacaoDesenvolvimentoId) : null
    }
    if (body.prazoDesejado !== undefined) {
      updateData.prazoDesejado = body.prazoDesejado ? new Date(body.prazoDesejado) : null
    }

    let historico = (Array.isArray(existing.historico) ? existing.historico : []) as Array<Record<string, unknown>>

    if (body.status && body.status !== existing.status) {
      updateData.status = body.status
      historico.push({
        data: new Date().toISOString(),
        usuario: session.user.name,
        acao: "MUDANCA_STATUS",
        de: existing.status,
        para: body.status,
      })
    }

    updateData.historico = historico
    updateData.updatedAt = new Date()

    const [updated] = await db
      .update(requisicoesAmostraComercial)
      .set(updateData)
      .where(eq(requisicoesAmostraComercial.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar_requisicao_amostra_comercial",
      descricao: `Requisição de amostra comercial #${id} atualizada`,
      entidade: "RequisicaoAmostraComercial",
      entidadeId: parseInt(id),
      usuarioNome: session.user.name,
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[PATCH /api/requisicoes-amostra-comercial/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { session } = auth

    const { id } = await params

    const [existing] = await db
      .select()
      .from(requisicoesAmostraComercial)
      .where(eq(requisicoesAmostraComercial.id, parseInt(id)))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Requisição não encontrada" }, { status: 404 })
    }

    await db
      .delete(requisicoesAmostraComercial)
      .where(eq(requisicoesAmostraComercial.id, parseInt(id)))

    await registrarLog({
      tipo: "DELECAO",
      acao: "excluir_requisicao_amostra_comercial",
      descricao: `Requisição de amostra comercial #${id} excluída`,
      entidade: "RequisicaoAmostraComercial",
      entidadeId: parseInt(id),
      usuarioNome: session.user.name,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/requisicoes-amostra-comercial/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
