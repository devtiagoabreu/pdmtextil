import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailEnviados } from "@/lib/db/schema/email-enviados"
import { emailCliques } from "@/lib/db/schema/email-cliques"
import { desc, eq, sql, and, isNotNull } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const remessas = await db
      .select({
        remessaId: emailEnviados.remessaId,
        assunto: emailEnviados.assunto,
        total: sql<number>`count(*)`,
        enviados: sql<number>`count(*) filter (where ${emailEnviados.status} = 'enviado')`,
        falhas: sql<number>`count(*) filter (where ${emailEnviados.status} = 'falhou')`,
        lidos: sql<number>`count(*) filter (where ${emailEnviados.abertoEm} is not null)`,
        clicados: sql<number>`count(distinct ${emailCliques.envioId})`,
        totalCliques: sql<number>`count(${emailCliques.id})`,
        createdAt: sql<string>`min(${emailEnviados.createdAt})`,
      })
      .from(emailEnviados)
      .leftJoin(emailCliques, eq(emailCliques.envioId, emailEnviados.id))
      .where(isNotNull(emailEnviados.remessaId))
      .groupBy(emailEnviados.remessaId, emailEnviados.assunto)
      .orderBy(desc(sql`min(${emailEnviados.createdAt})`))

    const remessasLinks = await Promise.all(
      remessas.map(async (r) => {
        const links = await db
          .select({
            urlOriginal: emailCliques.urlOriginal,
            total: sql<number>`count(*)`,
          })
          .from(emailCliques)
          .innerJoin(emailEnviados, eq(emailEnviados.id, emailCliques.envioId))
          .where(eq(emailEnviados.remessaId, r.remessaId!))
          .groupBy(emailCliques.urlOriginal)
          .orderBy(desc(sql`count(*)`))

        return { ...r, links }
      })
    )

    return NextResponse.json({ remessas: remessasLinks })
  } catch (error: any) {
    console.error("[RELATORIO]", error)
    return NextResponse.json({ error: error.message || "Erro ao carregar relatório" }, { status: 500 })
  }
}
