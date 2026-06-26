import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const filtro = searchParams.get("filtro") || "total-geral"

    let whereCru = sql``
    let whereAcab = sql``

    if (filtro === "tecido-cru") {
      whereCru = sql``
      whereAcab = sql`AND 1=0`
    } else if (filtro === "acabamento") {
      whereCru = sql`AND 1=0`
      whereAcab = sql``
    } else if (filtro === "aprovadas") {
      whereCru = sql`AND am.status LIKE 'APROVADA%'`
      whereAcab = sql`AND aam.status LIKE 'APROVADA%'`
    } else if (filtro === "total-mes") {
      whereCru = sql`AND am.created_at >= date_trunc('month', now())`
      whereAcab = sql`AND aam.created_at >= date_trunc('month', now())`
    } else if (filtro === "reprovadas") {
      whereCru = sql`AND am.status = 'REPROVADA'`
      whereAcab = sql`AND aam.status = 'REPROVADA'`
    } else if (filtro === "pendentes-cru") {
      whereCru = sql`AND am.status = 'PENDENTE'`
      whereAcab = sql`AND 1=0`
    } else if (filtro === "pendentes-acab") {
      whereCru = sql`AND 1=0`
      whereAcab = sql`AND aam.status = 'PENDENTE'`
    } else if (filtro === "aprovadas-cru") {
      whereCru = sql`AND am.status LIKE 'APROVADA%'`
      whereAcab = sql`AND 1=0`
    } else if (filtro === "aprovadas-acab") {
      whereCru = sql`AND 1=0`
      whereAcab = sql`AND aam.status LIKE 'APROVADA%'`
    } else if (filtro.startsWith("status-")) {
      const statusNome = filtro.slice(7)
      whereCru = sql`AND am.status = ${statusNome}`
      whereAcab = sql`AND aam.status = ${statusNome}`
    } else {
      whereCru = sql``
      whereAcab = sql``
    }

    const rows = await db.execute(sql`
      (SELECT
        am.id, am.descricao, am.status, am.motivo_aprovacao as "motivoAprovacao",
        am.data, am.created_at as "createdAt",
        am.dados,
        p.id as "produtoId",
        p.codigo_pdm as "produtoCodigo", p.descricao as "produtoDescricao",
        p.id_integracao as "idIntegracao",
        'TECIDO_CRU' as "tipoAmostra",
        s.id as "solicitacaoId", s.cliente as "solicitacaoCliente", s.projeto as "solicitacaoProjeto"
      FROM produto_cru_amostra am
      JOIN produtos_cru p ON p.id = am.produto_cru_id
      LEFT JOIN solicitacoes s ON s.id = p.solicitacao_desenvolvimento_id
      WHERE 1=1 ${whereCru})
      UNION ALL
      (SELECT
        aam.id, aam.descricao, aam.status, aam.motivo_aprovacao as "motivoAprovacao",
        aam.data, aam.created_at as "createdAt",
        aam.dados,
        p.id as "produtoId",
        p.codigo_pdm as "produtoCodigo", p.descricao as "produtoDescricao",
        p.id_integracao as "idIntegracao",
        'ACABAMENTO' as "tipoAmostra",
        s.id as "solicitacaoId", s.cliente as "solicitacaoCliente", s.projeto as "solicitacaoProjeto"
      FROM produto_cru_acabamento_amostra aam
      JOIN produto_cru_acabamento ac ON ac.id = aam.acabamento_id
      JOIN produtos_cru p ON p.id = ac.produto_cru_id
      LEFT JOIN solicitacoes s ON s.id = p.solicitacao_desenvolvimento_id
      WHERE 1=1 ${whereAcab})
      ORDER BY "createdAt" DESC
    `)

    const lista = Array.isArray(rows) ? rows : []
    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/dashboard/amostras-lista]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
