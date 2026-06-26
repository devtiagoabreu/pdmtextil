import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json({ error: "ID da solicitação é obrigatório" }, { status: 400 })
    }

    const solicitacaoId = parseInt(id)

    const solicitacoesRows = await db.execute(sql`
      SELECT 
        s.*,
        TO_CHAR(s.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "createdAt",
        TO_CHAR(s.updated_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "updatedAt",
        TO_CHAR(s.prazo_desejado, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "prazoDesejado",
        TO_CHAR(s.data_conclusao, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "dataConclusao",
        sol.nome as "solicitanteNome",
        resp.nome as "responsavelNome"
      FROM solicitacoes s
      LEFT JOIN usuarios sol ON sol.id = s.solicitante_id
      LEFT JOIN usuarios resp ON resp.id = s.responsavel_id
      WHERE s.id = ${solicitacaoId}
    `) as any[]

    if (!solicitacoesRows[0]) {
      return NextResponse.json({ error: "Solicitação não encontrada" }, { status: 404 })
    }

    const solicitacao = solicitacoesRows[0]

    const produtos = await db.execute(sql`
      SELECT 
        p.id,
        p.codigo_pdm as "codigoPdm",
        p.descricao,
        p.status,
        p.id_integracao as "idIntegracao",
        TO_CHAR(p.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "createdAt"
      FROM produtos_cru p
      WHERE p.solicitacao_desenvolvimento_id = ${solicitacaoId}
      ORDER BY p.codigo_pdm
    `) as any[]

    const produtoIds = produtos.map((p: any) => p.id)

    let amostrasCru: any[] = []
    let acabamentos: any[] = []
    let amostrasAcabamento: any[] = []

    if (produtoIds.length > 0) {
      const idsPlaceholder = sql.join(produtoIds.map((i: number) => sql`${i}`), sql`, `)

      amostrasCru = await db.execute(sql`
        SELECT 
          a.id,
          a.produto_cru_id as "produtoCruId",
          a.descricao,
          a.status,
          a.motivo_aprovacao as "motivoAprovacao",
          a.dados,
          a.historico,
          TO_CHAR(a.data, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "data",
          TO_CHAR(a.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "createdAt"
        FROM produto_cru_amostra a
        WHERE a.produto_cru_id IN (${idsPlaceholder})
        ORDER BY a.created_at DESC
      `) as any[]

      acabamentos = await db.execute(sql`
        SELECT 
          a.id,
          a.produto_cru_id as "produtoCruId",
          a.tipo_acabamento as "tipoAcabamento",
          a.descricao,
          a.id_integracao_erp_acabado as "idIntegracaoErpAcabado",
          TO_CHAR(a.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "createdAt"
        FROM produto_cru_acabamento a
        WHERE a.produto_cru_id IN (${idsPlaceholder})
        ORDER BY a.descricao
      `) as any[]

      if (acabamentos.length > 0) {
        const acIdsPlaceholder = sql.join(acabamentos.map((a: any) => sql`${a.id}`), sql`, `)

        amostrasAcabamento = await db.execute(sql`
          SELECT 
            aa.id,
            aa.acabamento_id as "acabamentoId",
            aa.descricao,
            aa.status,
            aa.motivo_aprovacao as "motivoAprovacao",
            aa.dados,
            TO_CHAR(aa.data, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "data",
            TO_CHAR(aa.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "createdAt"
          FROM produto_cru_acabamento_amostra aa
          WHERE aa.acabamento_id IN (${acIdsPlaceholder})
          ORDER BY aa.created_at DESC
        `) as any[]
      }
    }

    let logs: any[] = []
    if (produtoIds.length > 0) {
      const idsPlaceholder = sql.join(produtoIds.map((i: number) => sql`${i}`), sql`, `)
      logs = await db.execute(sql`
        SELECT 
          l.id,
          l.tipo,
          l.acao,
          l.descricao,
          l.entidade,
          l.entidade_id as "entidadeId",
          l.dados,
          l.erro,
          l.usuario_nome as "usuarioNome",
          TO_CHAR(l.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "createdAt"
        FROM logs l
        WHERE (
          (l.entidade = 'Solicitacao' AND l.entidade_id = ${solicitacaoId})
          OR (l.entidade = 'SolicitacaoDesenvolvimento' AND l.entidade_id = ${solicitacaoId})
          OR (l.entidade = 'ProdutoCru' AND l.entidade_id IN (${idsPlaceholder}))
        )
        ORDER BY l.created_at ASC
      `) as any[]
    } else {
      logs = await db.execute(sql`
        SELECT 
          l.id,
          l.tipo,
          l.acao,
          l.descricao,
          l.entidade,
          l.entidade_id as "entidadeId",
          l.dados,
          l.erro,
          l.usuario_nome as "usuarioNome",
          TO_CHAR(l.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as "createdAt"
        FROM logs l
        WHERE (
          (l.entidade = 'Solicitacao' AND l.entidade_id = ${solicitacaoId})
          OR (l.entidade = 'SolicitacaoDesenvolvimento' AND l.entidade_id = ${solicitacaoId})
        )
        ORDER BY l.created_at ASC
      `) as any[]
    }

    const produtosComAmostras = produtos.map((p: any) => ({
      ...p,
      amostras: amostrasCru.filter((a: any) => a.produtoCruId === p.id),
      acabamentos: acabamentos
        .filter((a: any) => a.produtoCruId === p.id)
        .map((ac: any) => ({
          ...ac,
          amostras: amostrasAcabamento.filter((aa: any) => aa.acabamentoId === ac.id)
        }))
    }))

    return NextResponse.json({
      solicitacao,
      produtos: produtosComAmostras,
      logs
    })
  } catch (error) {
    console.error("[GET /api/relatorios/historico-solicitacao]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
