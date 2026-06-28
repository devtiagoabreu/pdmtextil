import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"

export const dynamic = "force-dynamic"

async function q(sqlFragment: ReturnType<typeof sql>, fallback: unknown = null) {
  try {
    return await db.execute(sqlFragment)
  } catch (e) {
    console.error("[DB]", e)
    return fallback
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const [statusRaw, totalMesRaw, recentRaw] = await Promise.all([
      q(sql`
        SELECT status, COUNT(*)::int AS count
        FROM requisicoes_amostra_comercial
        GROUP BY status
      `, []),
      q(sql`
        SELECT COUNT(*)::int AS total
        FROM requisicoes_amostra_comercial
        WHERE created_at >= date_trunc('month', CURRENT_TIMESTAMP)
      `, { total: 0 }),
      q(sql`
        SELECT
          r.id, r.status, r.titulo, r.cliente, r.quantidade,
          r.created_at AS "createdAt", r.prazo_desejado AS "prazoDesejado",
          p.codigo_pdm AS "produtoCodigo", p.descricao AS "produtoDescricao",
          u.name AS "solicitanteNome"
        FROM requisicoes_amostra_comercial r
        JOIN produtos_cru p ON p.id = r.produto_cru_id
        LEFT JOIN usuarios u ON u.id = r.solicitante_id
        ORDER BY r.created_at DESC
        LIMIT 10
      `, []),
    ])

    const porStatus = Array.isArray(statusRaw) ? statusRaw : []
    const totalMes = Array.isArray(totalMesRaw) ? (totalMesRaw[0]?.total ?? 0) : (totalMesRaw?.total ?? 0)
    const recent = Array.isArray(recentRaw) ? recentRaw : []

    return NextResponse.json({
      porStatus,
      totalMes,
      recent,
    })
  } catch (error) {
    console.error("[GET /api/dashboard/amostra-comercial-stats]", error)
    return NextResponse.json({
      error: "Erro interno",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
