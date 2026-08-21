import { NextRequest, NextResponse } from "next/server"
import { requireAuth, getServerSession, authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { requisicoesCorte, requisicoesCorteItens } from "@/lib/db/schema"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
import { notificar, notificarDelecao, registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
export const dynamic = "force-dynamic"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    const [resultado] = await db
      .select({
        id: requisicoesCorte.id,
        requisitanteId: requisicoesCorte.requisitanteId,
        requisitanteNome: usuarios.name,
        status: requisicoesCorte.status,
        observacoes: requisicoesCorte.observacoes,
        entreguePor: requisicoesCorte.entreguePor,
        dataSolicitacao: requisicoesCorte.dataSolicitacao,
        dataEntrega: requisicoesCorte.dataEntrega,
        clienteId: requisicoesCorte.clienteId,
        clienteNome: requisicoesCorte.clienteNome,
        fornecedorId: requisicoesCorte.fornecedorId,
        fornecedorNome: requisicoesCorte.fornecedorNome,
        representanteId: requisicoesCorte.representanteId,
        representanteNome: requisicoesCorte.representanteNome,
        createdAt: requisicoesCorte.createdAt,
        updatedAt: requisicoesCorte.updatedAt,
      })
      .from(requisicoesCorte)
      .leftJoin(usuarios, eq(requisicoesCorte.requisitanteId, usuarios.id))
      .where(eq(requisicoesCorte.id, parseInt(id)))
      .limit(1)

    if (!resultado) {
      return NextResponse.json({ error: "Requisição de corte não encontrada" }, { status: 404 })
    }

    const itens = await db
      .select()
      .from(requisicoesCorteItens)
      .where(eq(requisicoesCorteItens.requisicaoCorteId, parseInt(id)))
      .orderBy(requisicoesCorteItens.id)

    return NextResponse.json({ ...resultado, itens })
  } catch (error) {
    console.error("[GET /api/comercial/requisicoes-corte/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const body = await req.json()

    const [existente] = await db
      .select()
      .from(requisicoesCorte)
      .where(eq(requisicoesCorte.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Requisição de corte não encontrada" }, { status: 404 })
    }

    const setValues: Record<string, any> = {
      updatedAt: new Date(),
    }

    if (body.observacoes !== undefined) setValues.observacoes = body.observacoes
    if (body.entreguePor !== undefined) setValues.entreguePor = body.entreguePor
    if (body.status !== undefined) setValues.status = body.status
    if (body.dataSolicitacao !== undefined) setValues.dataSolicitacao = body.dataSolicitacao
    if (body.dataEntrega !== undefined) setValues.dataEntrega = body.dataEntrega
    if (body.clienteId !== undefined) setValues.clienteId = body.clienteId
    if (body.clienteNome !== undefined) setValues.clienteNome = body.clienteNome
    if (body.fornecedorId !== undefined) setValues.fornecedorId = body.fornecedorId
    if (body.fornecedorNome !== undefined) setValues.fornecedorNome = body.fornecedorNome
    if (body.representanteId !== undefined) setValues.representanteId = body.representanteId
    if (body.representanteNome !== undefined) setValues.representanteNome = body.representanteNome

    await db
      .update(requisicoesCorte)
      .set(setValues)
      .where(eq(requisicoesCorte.id, parseInt(id)))

    if (body.itens && Array.isArray(body.itens)) {
      await db
        .delete(requisicoesCorteItens)
        .where(eq(requisicoesCorteItens.requisicaoCorteId, parseInt(id)))

      if (body.itens.length > 0) {
        await db.insert(requisicoesCorteItens).values(
          body.        itens.map((item: any) => ({
            requisicaoCorteId: parseInt(id),
            codigoProduto: item.codigoProduto || null,
            ordem: item.ordem || null,
            artigo: item.artigo || null,
            cor: item.cor || null,
            desenho: item.desenho || null,
            quantidade: item.quantidade,
            clienteId: item.clienteId || null,
            clienteNome: item.clienteNome || null,
            fornecedorId: item.fornecedorId || null,
            fornecedorNome: item.fornecedorNome || null,
            representanteId: item.representanteId || null,
            representanteNome: item.representanteNome || null,
          }))
        )
      }
    }

    await registrarLog({ tipo: "ATUALIZACAO", acao: "atualizar", descricao: `Requisição de corte #${id} atualizada`, entidade: "RequisicaoCorte", entidadeId: parseInt(id), usuarioNome: session.user.name })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("[PUT /api/comercial/requisicoes-corte/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { id } = await params
    const requisicaoId = parseInt(id)

    const [existente] = await db
      .select()
      .from(requisicoesCorte)
      .where(eq(requisicoesCorte.id, requisicaoId))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Requisição de corte não encontrada" }, { status: 404 })
    }

    if (
      session.user.role !== "COMERCIAL" &&
      session.user.role !== "ADMIN" &&
      session.user.role !== "SUDO" &&
      existente.requisitanteId !== parseInt(session.user.id || "0")
    ) {
      return NextResponse.json({ error: "Sem permissão para excluir esta requisição" }, { status: 403 })
    }

    await db
      .delete(requisicoesCorteItens)
      .where(eq(requisicoesCorteItens.requisicaoCorteId, requisicaoId))

    await db
      .delete(requisicoesCorte)
      .where(eq(requisicoesCorte.id, requisicaoId))

    await notificarDelecao("Requisição de corte", id, session?.user?.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/comercial/requisicoes-corte/[id]")
  }
}
