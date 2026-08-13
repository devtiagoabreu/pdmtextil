import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailEnviados } from "@/lib/db/schema/email-enviados"
import { emailCliques } from "@/lib/db/schema/email-cliques"
import { desc, eq, ne, sql, and, isNotNull, inArray } from "drizzle-orm"

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
        createdAt: sql<string>`min(${emailEnviados.createdAt})`,
      })
      .from(emailEnviados)
      .where(and(isNotNull(emailEnviados.remessaId), ne(emailEnviados.status, "pendente")))
      .groupBy(emailEnviados.remessaId, emailEnviados.assunto)
      .orderBy(desc(sql`min(${emailEnviados.createdAt})`))

    const remessaIds = remessas.map((r: any) => r.remessaId!).filter(Boolean)
    const cliquesPorRemessa = new Map<string, { clicados: number; totalCliques: number }>()
    if (remessaIds.length > 0) {
      const cliquesRows = await db
        .select({
          remessaId: emailEnviados.remessaId,
          clicados: sql<number>`count(distinct ${emailCliques.envioId})`,
          totalCliques: sql<number>`count(${emailCliques.id})`,
        })
        .from(emailCliques)
        .innerJoin(emailEnviados, eq(emailEnviados.id, emailCliques.envioId))
        .where(inArray(emailEnviados.remessaId, remessaIds))
        .groupBy(emailEnviados.remessaId)

      for (const r of cliquesRows) {
        cliquesPorRemessa.set(r.remessaId!, { clicados: Number(r.clicados), totalCliques: Number(r.totalCliques) })
      }

      const linksPorRemessa = new Map<string, { urlOriginal: string; total: number }[]>()
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

      return NextResponse.json({
        remessas: remessas.map((r: any) => ({
          ...r,
          clicados: cliquesPorRemessa.get(r.remessaId!)?.clicados || 0,
          totalCliques: cliquesPorRemessa.get(r.remessaId!)?.totalCliques || 0,
          links: linksPorRemessa.get(r.remessaId!) || [],
        })),
      })
    }

    return NextResponse.json({ remessas })
  } catch (error: any) {
    console.error("[RELATORIO]", error)
    return NextResponse.json({ error: "Erro ao carregar relatório" }, { status: 500 })
  }
}
