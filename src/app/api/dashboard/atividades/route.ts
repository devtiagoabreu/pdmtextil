import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { usuarios } from "@/lib/db/schema/usuarios"
import { eq, desc } from "drizzle-orm"
export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const recentSolicitacoes = await db
      .select({
        id: solicitacoes.id,
        tipo: solicitacoes.tipo,
        status: solicitacoes.status,
        cliente: solicitacoes.cliente,
        projeto: solicitacoes.projeto,
        createdAt: solicitacoes.createdAt,
        solicitanteNome: usuarios.name,
      })
      .from(solicitacoes)
      .leftJoin(usuarios, eq(solicitacoes.solicitanteId, usuarios.id))
      .orderBy(desc(solicitacoes.createdAt))
      .limit(5)

    return NextResponse.json(recentSolicitacoes)
  } catch (error) {
    console.error("[GET /api/dashboard/atividades]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}