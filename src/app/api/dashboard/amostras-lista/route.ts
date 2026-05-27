import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const filtro = searchParams.get("filtro") || "total-geral"

    let whereCru = ""
    let whereAcab = ""

    if (filtro === "tecido-cru") {
      whereCru = ""
      whereAcab = "AND 1=0"
    } else if (filtro === "acabamento") {
      whereCru = "AND 1=0"
      whereAcab = ""
    } else if (filtro === "aprovadas") {
      whereCru = "AND am.status = 'APROVADO'"
      whereAcab = "AND aam.status = 'APROVADO'"
    } else if (filtro === "reprovadas") {
      whereCru = "AND am.status = 'REPROVADO'"
      whereAcab = "AND aam.status = 'REPROVADO'"
    } else if (filtro === "pendentes-cru") {
      whereCru = "AND am.status = 'PENDENTE'"
      whereAcab = "AND 1=0"
    } else if (filtro === "pendentes-acab") {
      whereCru = "AND 1=0"
      whereAcab = "AND aam.status = 'PENDENTE'"
    } else if (filtro === "aprovadas-cru") {
      whereCru = "AND am.status = 'APROVADO'"
      whereAcab = "AND 1=0"
    } else if (filtro === "aprovadas-acab") {
      whereCru = "AND 1=0"
      whereAcab = "AND aam.status = 'APROVADO'"
    } else {
      whereCru = ""
      whereAcab = ""
    }

    const rows = await db.execute(sql`
      (SELECT
        am.id, am.descricao, am.status, am.motivo_aprovacao as "motivoAprovacao",
        am.data, am.created_at as "createdAt",
        p.id as "produtoId",
        p.codigo_pdm as "produtoCodigo", p.descricao as "produtoDescricao",
        p.id_integracao as "idIntegracao",
        'TECIDO_CRU' as "tipoAmostra",
        s.id as "solicitacaoId", s.cliente as "solicitacaoCliente", s.projeto as "solicitacaoProjeto"
      FROM produto_cru_amostra am
      JOIN produtos_cru p ON p.id = am.produto_cru_id
      LEFT JOIN solicitacoes s ON s.id = p.solicitacao_desenvolvimento_id
      ${sql.raw(whereCru)})
      UNION ALL
      (SELECT
        aam.id, aam.descricao, aam.status, aam.motivo_aprovacao as "motivoAprovacao",
        aam.data, aam.created_at as "createdAt",
        p.id as "produtoId",
        p.codigo_pdm as "produtoCodigo", p.descricao as "produtoDescricao",
        p.id_integracao as "idIntegracao",
        'ACABAMENTO' as "tipoAmostra",
        s.id as "solicitacaoId", s.cliente as "solicitacaoCliente", s.projeto as "solicitacaoProjeto"
      FROM produto_cru_acabamento_amostra aam
      JOIN produto_cru_acabamento ac ON ac.id = aam.acabamento_id
      JOIN produtos_cru p ON p.id = ac.produto_cru_id
      LEFT JOIN solicitacoes s ON s.id = p.solicitacao_desenvolvimento_id
      ${sql.raw(whereAcab)})
      ORDER BY "createdAt" DESC
    `)

    const lista = Array.isArray(rows) ? rows : []
    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/dashboard/amostras-lista]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
