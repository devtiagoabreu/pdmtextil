import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { emailDisparos } from "@/lib/db/schema/email-disparos"
import { emailEnviados } from "@/lib/db/schema/email-enviados"
import { emailCliques } from "@/lib/db/schema/email-cliques"
import { desc, eq, sql } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUDO" && session.user.role !== "CRM")) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { id } = await params
    const disparoId = Number(id)
    if (!disparoId) return NextResponse.json({ error: "Disparo inválido" }, { status: 400 })

    const [disparo] = await db.select().from(emailDisparos).where(eq(emailDisparos.id, disparoId))
    if (!disparo) return NextResponse.json({ error: "Disparo não encontrado" }, { status: 404 })

    const [stats] = await db
      .select({
        pendentes: sql<number>`count(*) filter (where ${emailEnviados.status} = 'pendente')`,
        enviados: sql<number>`count(*) filter (where ${emailEnviados.status} = 'enviado')`,
        falhas: sql<number>`count(*) filter (where ${emailEnviados.status} = 'falhou')`,
        lidos: sql<number>`count(*) filter (where ${emailEnviados.abertoEm} is not null)`,
        clicados: sql<number>`(select count(distinct ${emailCliques.envioId}) from ${emailCliques} where ${emailCliques.envioId} in (select id from ${emailEnviados} where ${emailEnviados.disparoId} = ${disparoId}))`,
        totalCliques: sql<number>`(select count(*) from ${emailCliques} where ${emailCliques.envioId} in (select id from ${emailEnviados} where ${emailEnviados.disparoId} = ${disparoId}))`,
      })
      .from(emailEnviados)
      .where(eq(emailEnviados.disparoId, disparoId))

    const envios = await db
      .select({
        id: emailEnviados.id,
        email: emailEnviados.email,
        nome: emailEnviados.nome,
        status: emailEnviados.status,
        error: emailEnviados.error,
        abertoEm: emailEnviados.abertoEm,
        enviadoEm: emailEnviados.enviadoEm,
        createdAt: emailEnviados.createdAt,
        totalCliques: sql<number>`count(${emailCliques.id})`,
      })
      .from(emailEnviados)
      .leftJoin(emailCliques, eq(emailCliques.envioId, emailEnviados.id))
      .where(eq(emailEnviados.disparoId, disparoId))
      .groupBy(emailEnviados.id)
      .orderBy(desc(emailEnviados.id))
      .limit(500)

    const links = await db
      .select({
        urlOriginal: emailCliques.urlOriginal,
        total: sql<number>`count(*)`,
      })
      .from(emailCliques)
      .innerJoin(emailEnviados, eq(emailEnviados.id, emailCliques.envioId))
      .where(eq(emailEnviados.disparoId, disparoId))
      .groupBy(emailCliques.urlOriginal)
      .orderBy(desc(sql`count(*)`))
      .limit(20)

    return NextResponse.json({ disparo, stats: stats || null, envios, links })
  } catch (error: any) {
    console.error("[GET /api/admin/email-massa/disparos/relatorio]", error)
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 })
  }
}
