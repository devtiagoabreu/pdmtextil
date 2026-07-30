import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailEnviados } from "@/lib/db/schema/email-enviados"
import { emailCliques } from "@/lib/db/schema/email-cliques"
import { desc, eq, sql, and, isNotNull, inArray } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO" && session.user.role !== "CRM")) {
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

    const remessaIds = remessas.map((r: any) => r.remessaId!).filter(Boolean)
    const linksPorRemessa = new Map<string, { urlOriginal: string; total: number }[]>()
    if (remessaIds.length > 0) {
      const todosLinks = await db
        .select({
          remessaId: emailEnviados.remessaId,
          urlOriginal: emailCliques.urlOriginal,
          total: sql<number>`count(*)`,
        })
        .from(emailCliques)
        .innerJoin(emailEnviados, eq(emailEnviados.id, emailCliques.envioId))
        .where(inArray(emailEnviados.remessaId, remessaIds))
        .groupBy(emailEnviados.remessaId, emailCliques.urlOriginal)
        .orderBy(desc(sql`count(*)`))

      for (const link of todosLinks) {
        if (!linksPorRemessa.has(link.remessaId!)) linksPorRemessa.set(link.remessaId!, [])
        linksPorRemessa.get(link.remessaId!)!.push({ urlOriginal: link.urlOriginal, total: link.total })
      }
    }

    const remessasLinks = remessas.map((r: any) => ({
      ...r,
      links: linksPorRemessa.get(r.remessaId!) || [],
    }))

    return NextResponse.json({ remessas: remessasLinks })
  } catch (error: any) {
    console.error("[RELATORIO]", error)
    return NextResponse.json({ error: "Erro ao carregar relatório" }, { status: 500 })
  }
}
