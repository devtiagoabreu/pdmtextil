import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { requisicoesCorte, requisicoesCorteItens } from "@/lib/db/schema"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq } from "drizzle-orm"
import { notificar, notificarDelecao, registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [resultado] = await db
      .select({
        id: requisicoesCorte.id,
        requisitanteId: requisicoesCorte.requisitanteId,
        requisitanteNome: usuarios.name,
        status: requisicoesCorte.status,
        observacoes: requisicoesCorte.observacoes,
        entreguePor: requisicoesCorte.entreguePor,
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
          body.itens.map((item: any) => ({
            requisicaoCorteId: parseInt(id),
            codigoProduto: item.codigoProduto || null,
            ordem: item.ordem || null,
            artigo: item.artigo || null,
            cor: item.cor || null,
            desenho: item.desenho || null,
            quantidade: item.quantidade,
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
      .delete(requisicoesCorte)
      .where(eq(requisicoesCorte.id, requisicaoId))

    await notificarDelecao("Requisição de corte", id, session?.user?.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/comercial/requisicoes-corte/[id]")
  }
}
