import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import {
  produtosCru,
  produtoCruComposicao,
  produtoCruEstrutura,
  produtoCruAmostra,
  produtoCruAcabamento,
  produtoCruAcabamentoAmostra,
  produtoCruAcabamentoReceita,
} from "@/lib/db/schema/produto-cru"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { eq, and } from "drizzle-orm"
import { notificar, notificarDelecao, registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const id = parseInt((await params).id)
    const produto = await db.select().from(produtosCru).where(eq(produtosCru.id, id)).limit(1)

    if (!produto[0]) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    const composicao = await db.select().from(produtoCruComposicao).where(eq(produtoCruComposicao.produtoCruId, id))
    const estrutura = await db.select().from(produtoCruEstrutura).where(eq(produtoCruEstrutura.produtoCruId, id))
    const amostras = await db.select().from(produtoCruAmostra).where(eq(produtoCruAmostra.produtoCruId, id))
    const acabamentos = await db.select().from(produtoCruAcabamento).where(eq(produtoCruAcabamento.produtoCruId, id))

    const acabamentosCompletos = await Promise.all(
      acabamentos.map(async (acab) => {
        const amostrasAcab = await db
          .select()
          .from(produtoCruAcabamentoAmostra)
          .where(eq(produtoCruAcabamentoAmostra.acabamentoId, acab.id))
        const receitas = await db
          .select()
          .from(produtoCruAcabamentoReceita)
          .where(eq(produtoCruAcabamentoReceita.acabamentoId, acab.id))
        return { ...acab, amostras: amostrasAcab, receitas }
      })
    )

    return NextResponse.json({
      ...produto[0],
      composicao,
      estrutura,
      amostras,
      acabamentos: acabamentosCompletos,
    })
  } catch (error) {
    console.error("[GET /api/cadastros/produto-cru/[id]]", error)
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

    const id = parseInt((await params).id)
    const body = await req.json()

    // Apenas COMERCIAL e ADMIN podem aprovar/reprovar produto
    if (body.status === "APROVADO" || body.status === "REPROVADO") {
      if (!["COMERCIAL", "ADMIN", "SUDO"].includes(session.user.role)) {
        return NextResponse.json({ error: "Apenas COMERCIAL, ADMIN e SUDO podem aprovar/reprovar produtos" }, { status: 403 })
      }
    }

    if (body.idIntegracao) {
      const existente = await db
        .select()
        .from(produtosCru)
        .where(eq(produtosCru.idIntegracao, body.idIntegracao))
        .limit(1)

      if (existente[0] && existente[0].id !== id) {
        return NextResponse.json({ error: "ID Integração já cadastrado em outro produto" }, { status: 409 })
      }
    }

    const atualizado = await db
      .update(produtosCru)
      .set({
        codigoPdm: body.codigoPdm,
        descricao: body.descricao,
        solicitacaoDesenvolvimentoId: body.solicitacaoDesenvolvimentoId || null,
        status: body.status || "DESENVOLVIMENTO",
        fichaTecnica: body.fichaTecnica || null,
        links: body.links || [],
        ativo: body.ativo ?? true,
        idIntegracaoErpCru: body.idIntegracaoErpCru || null,
        idIntegracao: body.idIntegracao || null,
        updatedAt: new Date(),
      })
      .where(eq(produtosCru.id, id))
      .returning()

    if (!atualizado[0]) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    // Se COMERCIAL aprovou produto, atualiza solicitação vinculada para CONCLUIDO
    if (body.status === "APROVADO" && body.solicitacaoDesenvolvimentoId && ["COMERCIAL", "ADMIN", "SUDO"].includes(session.user.role)) {
      const solicitacaoId = Number(body.solicitacaoDesenvolvimentoId)
      try {
        await db
          .update(solicitacoes)
          .set({ status: "CONCLUIDO", dataConclusao: new Date(), updatedAt: new Date() })
          .where(eq(solicitacoes.id, solicitacaoId))
        await notificar(
          "SOLICITACAO_ATUALIZADA",
          `Produto cru #${id} aprovado por ${session.user.name} — Solicitação #${solicitacaoId} concluída`,
          `/comercial/solicitacoes/${solicitacaoId}`,
          session.user.name
        )
      } catch (err) {
        console.error("[PUT /api/cadastros/produto-cru/[id]] erro ao atualizar solicitação", err)
      }
    }

    await notificar(
      "PRODUTO_CRU_ATUALIZADO",
      `Produto cru #${id} atualizado por ${session.user.name}`,
      `/cadastros/produto-cru/${id}`,
      session.user.name
    )

    await registrarLog({ tipo: "ATUALIZACAO", acao: "atualizar", descricao: `Produto cru #${id} atualizado - status: ${body.status}`, entidade: "ProdutoCru", entidadeId: id, usuarioNome: session.user.name })

    return NextResponse.json(atualizado[0])
  } catch (error) {
    console.error("[PUT /api/cadastros/produto-cru/[id]]", error)
    return NextResponse.json({ error: "Erro ao atualizar produto" }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    if (session.user.role !== "ADMIN" && session.user.role !== "SUDO") {
      return NextResponse.json({ error: "Apenas administradores podem excluir produtos" }, { status: 403 })
    }

    const id = parseInt((await params).id)

    await db.delete(produtosCru).where(eq(produtosCru.id, id))

    await notificar(
      "PRODUTO_CRU_EXCLUIDO",
      `Produto cru #${id} foi excluído por ${session.user.name}`,
      "/cadastros/produto-cru",
      session.user.name
    )

    await notificarDelecao("Produto Cru", id.toString(), session?.user?.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/cadastros/produto-cru/[id]")
  }
}
