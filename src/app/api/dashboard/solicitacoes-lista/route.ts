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
    const filtro = searchParams.get("filtro") || "total-mes"

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

    if (filtro === "produtos-cru") {
      const rows = await db.execute(sql`
        SELECT id, codigo_pdm, descricao, status, created_at
        FROM produtos_cru
        ORDER BY created_at DESC
      `)
      const lista = Array.isArray(rows) ? rows.map((r: any) => ({
        id: r.id,
        codigoPdm: r.codigo_pdm,
        descricao: r.descricao,
        status: r.status,
        createdAt: r.created_at,
      })) : []
      return NextResponse.json(lista)
    }

    let condition = sql``
    if (filtro === "pendentes") condition = sql`AND status = 'PENDENTE'`
    else if (filtro === "em-desenvolvimento") condition = sql`AND status = 'EM_DESENVOLVIMENTO'`
    else if (filtro === "concluidas") condition = sql`AND status = 'CONCLUIDO'`

    const rows = await db.execute(sql`
      SELECT id, tipo, cliente, projeto, status, created_at
      FROM solicitacoes
      WHERE created_at >= ${startOfMonth}::timestamp
        AND created_at <= ${endOfMonth}::timestamp
        ${condition}
      ORDER BY created_at DESC
    `)

    const lista = Array.isArray(rows) ? rows.map((r: any) => ({
      id: r.id,
      tipo: r.tipo,
      cliente: r.cliente,
      projeto: r.projeto,
      status: r.status,
      createdAt: r.created_at,
    })) : []

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/dashboard/solicitacoes-lista]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
