import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { clientes } from "@/lib/db/schema/clientes"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { produtosCru, produtoCruAmostra, produtoCruAcabamento, produtoCruAcabamentoAmostra } from "@/lib/db/schema/produto-cru"
import { eq, desc, or, inArray } from "drizzle-orm"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    const cliente = await db
      .select()
      .from(clientes)
      .where(eq(clientes.id, parseInt(id)))
      .limit(1)

    if (!cliente[0]) {
      return NextResponse.json({ error: "Cliente não encontrado" }, { status: 404 })
    }

    const c = cliente[0]

    const solicitacoesList = await db
      .select({ id: solicitacoes.id })
      .from(solicitacoes)
      .where(
        or(
          eq(solicitacoes.cliente, c.nome),
          eq(solicitacoes.cnpj, c.cnpj)
        )
      )

    if (solicitacoesList.length === 0) {
      return NextResponse.json({ tecidoCru: [], acabamento: [] })
    }

    const solicitacaoIds = solicitacoesList.map(s => s.id)

    const produtos = await db
      .select({ id: produtosCru.id, codigoPdm: produtosCru.codigoPdm, descricao: produtosCru.descricao, solicitacaoDesenvolvimentoId: produtosCru.solicitacaoDesenvolvimentoId })
      .from(produtosCru)
      .where(inArray(produtosCru.solicitacaoDesenvolvimentoId, solicitacaoIds))

    if (produtos.length === 0) {
      return NextResponse.json({ tecidoCru: [], acabamento: [] })
    }

    const produtoIds = produtos.map(p => p.id)

    const amostrasCru = await db
      .select({
        id: produtoCruAmostra.id,
        produtoCruId: produtoCruAmostra.produtoCruId,
        descricao: produtoCruAmostra.descricao,
        status: produtoCruAmostra.status,
        data: produtoCruAmostra.data,
        produtoCodigo: produtosCru.codigoPdm,
        produtoDescricao: produtosCru.descricao,
        solicitacaoDesenvolvimentoId: produtosCru.solicitacaoDesenvolvimentoId,
      })
      .from(produtoCruAmostra)
      .innerJoin(produtosCru, eq(produtoCruAmostra.produtoCruId, produtosCru.id))
      .where(inArray(produtoCruAmostra.produtoCruId, produtoIds))
      .orderBy(desc(produtoCruAmostra.createdAt))

    const acabamentoIds = await db
      .select({ id: produtoCruAcabamento.id })
      .from(produtoCruAcabamento)
      .where(inArray(produtoCruAcabamento.produtoCruId, produtoIds))

    let amostrasAcabamento: any[] = []

    if (acabamentoIds.length > 0) {
      const acIds = acabamentoIds.map(a => a.id)
      amostrasAcabamento = await db
        .select({
          id: produtoCruAcabamentoAmostra.id,
          acabamentoId: produtoCruAcabamentoAmostra.acabamentoId,
          descricao: produtoCruAcabamentoAmostra.descricao,
          status: produtoCruAcabamentoAmostra.status,
          data: produtoCruAcabamentoAmostra.data,
          produtoCodigo: produtosCru.codigoPdm,
          produtoDescricao: produtosCru.descricao,
          acabamentoDescricao: produtoCruAcabamento.descricao,
          produtoCruId: produtoCruAcabamento.produtoCruId,
          solicitacaoDesenvolvimentoId: produtosCru.solicitacaoDesenvolvimentoId,
        })
        .from(produtoCruAcabamentoAmostra)
        .innerJoin(produtoCruAcabamento, eq(produtoCruAcabamentoAmostra.acabamentoId, produtoCruAcabamento.id))
        .innerJoin(produtosCru, eq(produtoCruAcabamento.produtoCruId, produtosCru.id))
        .where(inArray(produtoCruAcabamentoAmostra.acabamentoId, acIds))
        .orderBy(desc(produtoCruAcabamentoAmostra.createdAt))
    }

    return NextResponse.json({
      tecidoCru: amostrasCru.map(a => ({ ...a, tipoAmostra: "TECIDO_CRU" })),
      acabamento: amostrasAcabamento.map(a => ({ ...a, tipoAmostra: "ACABAMENTO" })),
    })
  } catch (error) {
    console.error("[GET /api/clientes/[id]/amostras]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
