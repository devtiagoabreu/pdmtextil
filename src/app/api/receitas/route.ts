import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
export const dynamic = "force-dynamic"

async function rows(q: ReturnType<typeof sql>) {
  try {
    const r = await db.execute(q)
    return Array.isArray(r) ? r : []
  } catch (e) {
    console.error("[DB]", e)
    return []
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const simples = await rows(sql`
      SELECT
        r.id, r.tipo_receita AS tipo, r.parametros,
        a.id AS acabamento_id, a.tipo_acabamento,
        p.id AS produto_id, p.codigo_pdm, p.descricao AS produto_descricao,
        r.acabamento_id AS context_id,
        'acabamento' AS context_type
      FROM produto_cru_acabamento_receita r
      JOIN produto_cru_acabamento a ON a.id = r.acabamento_id
      JOIN produtos_cru p ON p.id = a.produto_cru_id
      ORDER BY p.codigo_pdm, a.tipo_acabamento, r.id
    `)

    const completas = await rows(sql`
      SELECT
        rec.id, rec.descricao AS tipo, rec.instrucoes, rec.versao,
        am.id AS amostra_id, am.descricao AS amostra_descricao,
        a.id AS acabamento_id, a.tipo_acabamento,
        p.id AS produto_id, p.codigo_pdm, p.descricao AS produto_descricao,
        rec.amostra_id AS context_id,
        'amostra' AS context_type,
        (SELECT COUNT(*)::int FROM produto_cru_receita_item WHERE receita_id = rec.id) AS total_itens
      FROM produto_cru_receita rec
      JOIN produto_cru_acabamento_amostra am ON am.id = rec.amostra_id
      JOIN produto_cru_acabamento a ON a.id = am.acabamento_id
      JOIN produtos_cru p ON p.id = a.produto_cru_id
      ORDER BY p.codigo_pdm, a.tipo_acabamento, rec.id
    `)

    return NextResponse.json({
      simples: simples.map((r: any) => ({
        id: r.id,
        tipo: r.tipo,
        tipoLabel: r.tipo,
        possuiParametros: !!r.parametros && Object.keys(r.parametros || {}).length > 0,
        contextType: "acabamento",
        contextId: r.context_id,
        acabamento: r.tipo_acabamento,
        produtoId: r.produto_id,
        produtoCodigo: r.codigo_pdm,
        produtoDescricao: r.produto_descricao,
      })),
      completas: completas.map((r: any) => ({
        id: r.id,
        descricao: r.tipo,
        instrucoes: r.instrucoes,
        versao: r.versao,
        totalItens: r.total_itens,
        contextType: "amostra",
        contextId: r.context_id,
        amostraDescricao: r.amostra_descricao,
        acabamento: r.tipo_acabamento,
        produtoId: r.produto_id,
        produtoCodigo: r.codigo_pdm,
        produtoDescricao: r.produto_descricao,
      })),
    })
  } catch (error) {
    console.error("[GET /api/receitas]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
