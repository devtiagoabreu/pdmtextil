import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { eq, and, gte, lte, sql } from "drizzle-orm"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const userId = parseInt(session.user.id)
    const role = session.user.role

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    let conditions: any[] = []

    if (role === "COMERCIAL") {
      conditions.push(eq(solicitacoes.solicitanteId, userId))
    } else if (role === "TECELAGEM") {
      conditions.push(eq(solicitacoes.tipo, "DESENVOLVIMENTO_TECELAGEM"))
    } else if (role === "BENEFICIAMENTO") {
      conditions.push(eq(solicitacoes.tipo, "DESENVOLVIMENTO_BENEFICIAMENTO"))
    }

    conditions.push(gte(solicitacoes.createdAt, startOfMonth))
    conditions.push(lte(solicitacoes.createdAt, endOfMonth))

    const where = conditions.length > 0 ? and(...conditions) : undefined

    const stats = await db
      .select({
        total: sql<number>`count(*)`,
        pendentes: sql<number>`count(*) filter (where ${solicitacoes.status} = 'PENDENTE')`,
        emAnalise: sql<number>`count(*) filter (where ${solicitacoes.status} = 'EM_ANALISE')`,
        concluidas: sql<number>`count(*) filter (where ${solicitacoes.status} = 'CONCLUIDO')`,
      })
      .from(solicitacoes)
      .where(where)

    const result = stats[0] || { total: 0, pendentes: 0, emAnalise: 0, concluidas: 0 }

    return NextResponse.json({
      totalEsteMes: result.total,
      pendentes: result.pendentes,
      emAnalise: result.emAnalise,
      concluidas: result.concluidas,
    })
  } catch (error) {
    console.error("[GET /api/dashboard/stats]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}