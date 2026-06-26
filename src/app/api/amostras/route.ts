import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { produtosCru, produtoCruAmostra, produtoCruAcabamento, produtoCruAcabamentoAmostra } from "@/lib/db/schema/produto-cru"
import { eq } from "drizzle-orm"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    const amostrasCru = await db
      .select({
        id: produtoCruAmostra.id,
        produtoCruId: produtoCruAmostra.produtoCruId,
        descricao: produtoCruAmostra.descricao,
        status: produtoCruAmostra.status,
        motivoAprovacao: produtoCruAmostra.motivoAprovacao,
        observacoes: produtoCruAmostra.observacoes,
        data: produtoCruAmostra.data,
        createdAt: produtoCruAmostra.createdAt,
        links: produtoCruAmostra.links,
        quantidadeProduzida: produtoCruAmostra.quantidadeProduzida,
        dados: produtoCruAmostra.dados,
        produtoCodigo: produtosCru.codigoPdm,
        produtoDescricao: produtosCru.descricao,
        solicitacaoDesenvolvimentoId: produtosCru.solicitacaoDesenvolvimentoId,
      })
      .from(produtoCruAmostra)
      .innerJoin(produtosCru, eq(produtoCruAmostra.produtoCruId, produtosCru.id))
      .orderBy(produtoCruAmostra.createdAt)

    const amostrasAcabamento = await db
      .select({
        id: produtoCruAcabamentoAmostra.id,
        acabamentoId: produtoCruAcabamentoAmostra.acabamentoId,
        descricao: produtoCruAcabamentoAmostra.descricao,
        status: produtoCruAcabamentoAmostra.status,
        motivoAprovacao: produtoCruAcabamentoAmostra.motivoAprovacao,
        observacoes: produtoCruAcabamentoAmostra.observacoes,
        data: produtoCruAcabamentoAmostra.data,
        createdAt: produtoCruAcabamentoAmostra.createdAt,
        links: produtoCruAcabamentoAmostra.links,
        quantidadeProduzida: produtoCruAcabamentoAmostra.quantidadeProduzida,
        dados: produtoCruAcabamentoAmostra.dados,
        produtoCodigo: produtosCru.codigoPdm,
        produtoDescricao: produtosCru.descricao,
        acabamentoDescricao: produtoCruAcabamento.descricao,
        produtoCruId: produtoCruAcabamento.produtoCruId,
        solicitacaoDesenvolvimentoId: produtosCru.solicitacaoDesenvolvimentoId,
      })
      .from(produtoCruAcabamentoAmostra)
      .innerJoin(produtoCruAcabamento, eq(produtoCruAcabamentoAmostra.acabamentoId, produtoCruAcabamento.id))
      .innerJoin(produtosCru, eq(produtoCruAcabamento.produtoCruId, produtosCru.id))
      .orderBy(produtoCruAcabamentoAmostra.createdAt)

    return NextResponse.json({
      tecidoCru: amostrasCru.map((a: Record<string, unknown>) => ({ ...a, tipoAmostra: "TECIDO_CRU" })),
      acabamento: amostrasAcabamento.map((a: Record<string, unknown>) => ({ ...a, tipoAmostra: "ACABAMENTO" })),
    })
  } catch (error) {
    console.error("[GET /api/amostras]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
