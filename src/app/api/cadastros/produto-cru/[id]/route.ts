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
import { eq, inArray } from "drizzle-orm"
import { notificar, notificarDelecao, registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
export const dynamic = "force-dynamic"

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

    const acabamentoIds = acabamentos.map(a => a.id)
    const [todasAmostrasAcab, todasReceitas] = await Promise.all([
      acabamentoIds.length
        ? db.select().from(produtoCruAcabamentoAmostra).where(inArray(produtoCruAcabamentoAmostra.acabamentoId, acabamentoIds))
        : Promise.resolve([]),
      acabamentoIds.length
        ? db.select().from(produtoCruAcabamentoReceita).where(inArray(produtoCruAcabamentoReceita.acabamentoId, acabamentoIds))
        : Promise.resolve([]),
    ])
    type AcabAmostra = (typeof todasAmostrasAcab)[number]
    type AcabReceita = (typeof todasReceitas)[number]
    const amostrasPorAcab = new Map<number, AcabAmostra[]>()
    for (const a of todasAmostrasAcab) {
      if (!amostrasPorAcab.has(a.acabamentoId)) amostrasPorAcab.set(a.acabamentoId, [])
      amostrasPorAcab.get(a.acabamentoId)!.push(a)
    }
    const receitasPorAcab = new Map<number, AcabReceita[]>()
    for (const r of todasReceitas) {
      if (!receitasPorAcab.has(r.acabamentoId)) receitasPorAcab.set(r.acabamentoId, [])
      receitasPorAcab.get(r.acabamentoId)!.push(r)
    }

    const acabamentosCompletos = acabamentos.map(acab => ({
      ...acab,
      amostras: amostrasPorAcab.get(acab.id) || [],
      receitas: receitasPorAcab.get(acab.id) || [],
    }))

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

    const updateData: Record<string, unknown> = {
      codigoPdm: body.codigoPdm,
      descricao: body.descricao,
      solicitacaoDesenvolvimentoId: body.solicitacaoDesenvolvimentoId || null,
      fichaTecnica: body.fichaTecnica || null,
      links: body.links || [],
      ativo: body.ativo ?? true,
      idIntegracaoErpCru: body.idIntegracaoErpCru || null,
      idIntegracao: body.idIntegracao || null,
      updatedAt: new Date(),
    }
    if (body.status !== undefined) updateData.status = body.status

    const atualizado = await db
      .update(produtosCru)
      .set(updateData)
      .where(eq(produtosCru.id, id))
      .returning()

    if (!atualizado[0]) {
      return NextResponse.json({ error: "Produto não encontrado" }, { status: 404 })
    }

    // Auto-altera solicitação vinculada para EM_DESENVOLVIMENTO
    if (body.solicitacaoDesenvolvimentoId) {
      const solId = Number(body.solicitacaoDesenvolvimentoId)
      if (!isNaN(solId)) {
        try {
          const [sol] = await db
            .select({ status: solicitacoes.status, historicoComunicacao: solicitacoes.historicoComunicacao })
            .from(solicitacoes)
            .where(eq(solicitacoes.id, solId))
            .limit(1)
          if (sol && sol.status === "PENDENTE") {
            const historico = (sol.historicoComunicacao as any[]) || []
            historico.push({
              data: new Date().toISOString(),
              usuario: session.user.name,
              acao: "MUDANCA_STATUS",
              de: sol.status,
              para: "EM_DESENVOLVIMENTO",
              mensagem: "Produto cru vinculado à solicitação",
            })
            await db
              .update(solicitacoes)
              .set({ status: "EM_DESENVOLVIMENTO", historicoComunicacao: historico, updatedAt: new Date() })
              .where(eq(solicitacoes.id, solId))
          }
        } catch (err) {
          console.error("[PUT /api/cadastros/produto-cru/[id]] erro ao atualizar solicitação", err)
        }
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
      `Produto #${id} foi excluído por ${session.user.name}`,
      "/cadastros/produto-cru",
      session.user.name
    )

    await notificarDelecao("Produto", id.toString(), session?.user?.name)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error, "DELETE /api/cadastros/produto-cru/[id]")
  }
}
