import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { produtosCru, produtoCruAmostra, produtoCruAcabamento, produtoCruAcabamentoAmostra } from "@/lib/db/schema/produto-cru"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { logs as logsTable } from "@/lib/db/schema/logs"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, and, or, asc } from "drizzle-orm"
import { alias } from "drizzle-orm/pg-core"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    const tipo = searchParams.get("tipo")

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: "ID da amostra é obrigatório" }, { status: 400 })
    }
    if (!tipo || (tipo !== "tecido_cru" && tipo !== "acabamento")) {
      return NextResponse.json({ error: "tipo deve ser 'tecido_cru' ou 'acabamento'" }, { status: 400 })
    }

    const amostraId = parseInt(id)
    const solicitante = alias(usuarios, "solicitante")
    const responsavel = alias(usuarios, "responsavel")

    let amostra: any = null
    let produto: any = null
    let acabamento: any = null
    let solicitacao: any = null
    let entidadeLog = ""

    if (tipo === "tecido_cru") {
      entidadeLog = "AmostraTecidoCru"
      const rows = await db
        .select({
          amostra: produtoCruAmostra,
          produto: produtosCru,
          solicitacao: solicitacoes,
          solicitanteNome: solicitante.name,
          responsavelNome: responsavel.name,
        })
        .from(produtoCruAmostra)
        .innerJoin(produtosCru, eq(produtoCruAmostra.produtoCruId, produtosCru.id))
        .leftJoin(solicitacoes, eq(produtosCru.solicitacaoDesenvolvimentoId, solicitacoes.id))
        .leftJoin(solicitante, eq(solicitacoes.solicitanteId, solicitante.id))
        .leftJoin(responsavel, eq(solicitacoes.responsavelId, responsavel.id))
        .where(eq(produtoCruAmostra.id, amostraId))
        .limit(1)

      if (!rows[0]) {
        return NextResponse.json({ error: "Amostra não encontrada" }, { status: 404 })
      }

      amostra = rows[0].amostra
      produto = rows[0].produto
      solicitacao = rows[0].solicitacao
      acabamento = null
    } else {
      entidadeLog = "AmostraAcabamento"
      const rows = await db
        .select({
          amostra: produtoCruAcabamentoAmostra,
          acabamento: produtoCruAcabamento,
          produto: produtosCru,
          solicitacao: solicitacoes,
          solicitanteNome: solicitante.name,
          responsavelNome: responsavel.name,
        })
        .from(produtoCruAcabamentoAmostra)
        .innerJoin(produtoCruAcabamento, eq(produtoCruAcabamentoAmostra.acabamentoId, produtoCruAcabamento.id))
        .innerJoin(produtosCru, eq(produtoCruAcabamento.produtoCruId, produtosCru.id))
        .leftJoin(solicitacoes, eq(produtosCru.solicitacaoDesenvolvimentoId, solicitacoes.id))
        .leftJoin(solicitante, eq(solicitacoes.solicitanteId, solicitante.id))
        .leftJoin(responsavel, eq(solicitacoes.responsavelId, responsavel.id))
        .where(eq(produtoCruAcabamentoAmostra.id, amostraId))
        .limit(1)

      if (!rows[0]) {
        return NextResponse.json({ error: "Amostra não encontrada" }, { status: 404 })
      }

      amostra = rows[0].amostra
      acabamento = rows[0].acabamento
      produto = rows[0].produto
      solicitacao = rows[0].solicitacao
    }

    const logs = await db
      .select()
      .from(logsTable)
      .where(
        or(
          and(eq(logsTable.entidade, entidadeLog), eq(logsTable.entidadeId, amostraId)),
          and(eq(logsTable.entidade, "ProdutoCru"), eq(logsTable.entidadeId, produto?.id)),
        )
      )
      .orderBy(asc(logsTable.createdAt))

    return NextResponse.json({
      tipo,
      amostra,
      produto,
      acabamento,
      solicitacao,
      logs,
    })
  } catch (error) {
    console.error("[GET /api/relatorios/historico-amostra]", error)
    return NextResponse.json({
      error: "Erro interno do servidor",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
