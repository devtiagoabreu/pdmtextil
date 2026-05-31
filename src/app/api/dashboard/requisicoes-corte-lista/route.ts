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

    let condition = sql``
    if (filtro === "solicitados") condition = sql`AND r.status = 'SOLICITADO'`
    else if (filtro === "processando") condition = sql`AND r.status = 'PROCESSANDO'`
    else if (filtro === "atendidos") condition = sql`AND r.status = 'ATENDIDO'`
    else if (filtro === "este-mes") {
      const now = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()
      condition = sql`AND r.created_at >= ${start}::timestamp AND r.created_at <= ${end}::timestamp`
    }

    const rows = await db.execute(sql`
      SELECT
        r.id, r.status, r.observacoes, r.entregue_por, r.created_at,
        u.name as requisitante_nome,
        COALESCE((SELECT COUNT(*) FROM requisicoes_corte_itens i WHERE i.requisicao_corte_id = r.id), 0) as total_cortes,
        COALESCE((SELECT SUM(NULLIF(REGEXP_REPLACE(COALESCE(i2.quantidade,'0'), '[^0-9\\.]', '', 'g'), '')::numeric) FROM requisicoes_corte_itens i2 WHERE i2.requisicao_corte_id = r.id), 0) as quantidade_total
      FROM requisicoes_corte r
      LEFT JOIN usuarios u ON u.id = r.requisitante_id
      WHERE 1=1 ${condition}
      ORDER BY r.created_at DESC
    `)

    const lista = Array.isArray(rows) ? rows.map((r: any) => ({
      id: r.id,
      status: r.status,
      observacoes: r.observacoes,
      entreguePor: r.entregue_por,
      requisitanteNome: r.requisitante_nome,
      totalCortes: Number(r.total_cortes ?? 0),
      quantidadeTotal: Number(r.quantidade_total ?? 0),
      createdAt: r.created_at,
    })) : []

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/dashboard/requisicoes-corte-lista]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
