import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailEnviados } from "@/lib/db/schema/email-enviados"
import { emailCliques } from "@/lib/db/schema/email-cliques"
import { desc, eq, sql } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const envios = await db
      .select({
        id: emailEnviados.id,
        email: emailEnviados.email,
        nome: emailEnviados.nome,
        assunto: emailEnviados.assunto,
        status: emailEnviados.status,
        error: emailEnviados.error,
        abertoEm: emailEnviados.abertoEm,
        createdAt: emailEnviados.createdAt,
        totalCliques: sql<number>`count(${emailCliques.id})`,
      })
      .from(emailEnviados)
      .leftJoin(emailCliques, eq(emailCliques.envioId, emailEnviados.id))
      .groupBy(emailEnviados.id)
      .orderBy(desc(emailEnviados.createdAt))
      .limit(500)

    const statsArr = await db
      .select({
        total: sql<number>`count(*)`,
        enviados: sql<number>`count(*) filter (where status = 'enviado')`,
        lidos: sql<number>`count(*) filter (where aberto_em is not null)`,
        falhas: sql<number>`count(*) filter (where status = 'falhou')`,
        totalCliques: sql<number>`(select count(*) from email_cliques)`,
      })
      .from(emailEnviados)

    return NextResponse.json({ envios, stats: statsArr[0] })
  } catch (error: any) {
    console.error("[HISTORICO]", error)
    return NextResponse.json({ error: error.message || "Erro ao carregar histórico" }, { status: 500 })
  }
}
