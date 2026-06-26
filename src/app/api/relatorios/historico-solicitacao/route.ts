import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { usuarios } from "@/lib/db/schema/usuarios"
import { produtosCru, produtoCruAmostra, produtoCruAcabamento, produtoCruAcabamentoAmostra } from "@/lib/db/schema/produto-cru"
import { logs as logsTable } from "@/lib/db/schema/logs"
import { eq, inArray, and, or, desc, asc } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: "ID da solicitação é obrigatório" }, { status: 400 })
    }

    const solicitacaoId = parseInt(id)

    const solicitante = alias(usuarios, "solicitante")
    const responsavel = alias(usuarios, "responsavel")

    const [solicitacao] = await db
      .select({
        id: solicitacoes.id,
        tipo: solicitacoes.tipo,
        status: solicitacoes.status,
        solicitanteId: solicitacoes.solicitanteId,
        responsavelId: solicitacoes.responsavelId,
        cliente: solicitacoes.cliente,
        cnpj: solicitacoes.cnpj,
        projeto: solicitacoes.projeto,
        briefing: solicitacoes.briefing,
        historicoComunicacao: solicitacoes.historicoComunicacao,
        observacoes: solicitacoes.observacoes,
        idIntegracao: solicitacoes.idIntegracao,
        createdAt: solicitacoes.createdAt,
        updatedAt: solicitacoes.updatedAt,
        prazoDesejado: solicitacoes.prazoDesejado,
        dataConclusao: solicitacoes.dataConclusao,
        solicitanteNome: solicitante.name,
        responsavelNome: responsavel.name,
      })
      .from(solicitacoes)
      .leftJoin(solicitante, eq(solicitacoes.solicitanteId, solicitante.id))
      .leftJoin(responsavel, eq(solicitacoes.responsavelId, responsavel.id))
      .where(eq(solicitacoes.id, solicitacaoId))
      .limit(1)

    if (!solicitacao) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 })
    }

    const produtos = await db
      .select()
      .from(produtosCru)
      .where(eq(produtosCru.solicitacaoDesenvolvimentoId, solicitacaoId))
      .orderBy(asc(produtosCru.codigoPdm))

    const produtoIds = produtos.map((p) => p.id)

    let amostrasCru: any[] = []
    let acabamentos: any[] = []
    let amostrasAcabamento: any[] = []

    if (produtoIds.length > 0) {
      amostrasCru = await db
        .select()
        .from(produtoCruAmostra)
        .where(inArray(produtoCruAmostra.produtoCruId, produtoIds))
        .orderBy(desc(produtoCruAmostra.createdAt))

      acabamentos = await db
        .select()
        .from(produtoCruAcabamento)
        .where(inArray(produtoCruAcabamento.produtoCruId, produtoIds))

      if (acabamentos.length > 0) {
        const acIdList = acabamentos.map((a) => a.id)
        amostrasAcabamento = await db
          .select()
          .from(produtoCruAcabamentoAmostra)
          .where(inArray(produtoCruAcabamentoAmostra.acabamentoId, acIdList))
          .orderBy(desc(produtoCruAcabamentoAmostra.createdAt))
      }
    }

    const logsConditions: any[] = [
      and(eq(logsTable.entidade, "Solicitacao"), eq(logsTable.entidadeId, solicitacaoId)),
      and(eq(logsTable.entidade, "SolicitacaoDesenvolvimento"), eq(logsTable.entidadeId, solicitacaoId)),
    ]
    if (produtoIds.length > 0) {
      logsConditions.push(
        and(eq(logsTable.entidade, "ProdutoCru"), inArray(logsTable.entidadeId, produtoIds))
      )
    }

    const logs = await db
      .select()
      .from(logsTable)
      .where(or(...logsConditions))
      .orderBy(asc(logsTable.createdAt))

    const produtosComAmostras = produtos.map((p) => ({
      ...p,
      amostras: amostrasCru.filter((a) => a.produtoCruId === p.id),
      acabamentos: acabamentos
        .filter((a) => a.produtoCruId === p.id)
        .map((ac) => ({
          ...ac,
          amostras: amostrasAcabamento.filter((aa) => aa.acabamentoId === ac.id),
        })),
    }))

    return NextResponse.json({
      solicitacao,
      produtos: produtosComAmostras,
      logs,
    })
  } catch (error) {
    console.error("[GET /api/relatorios/historico-solicitacao]", error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
