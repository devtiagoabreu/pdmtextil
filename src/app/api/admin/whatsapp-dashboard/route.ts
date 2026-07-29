import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmWhatsappConversas } from "@/lib/db/schema/crm-whatsapp-conversas"
import { crmWhatsappMensagens } from "@/lib/db/schema/crm-whatsapp"
import { crmWhatsappFlowLogs } from "@/lib/db/schema/crm-whatsapp-flow-logs"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { sql, eq, desc, and, gte } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const dias = parseInt(searchParams.get("dias") || "7")
    const desde = new Date(Date.now() - dias * 24 * 60 * 60 * 1000)

    const totalConversas = await db
      .select({ count: sql<number>`count(*)` })
      .from(crmWhatsappConversas)
      .where(gte(crmWhatsappConversas.createdAt, desde))
      .then((r: any) => Number(r[0]?.count || 0))

    const porEstado = await db
      .select({
        estado: crmWhatsappConversas.estado,
        count: sql<number>`count(*)`,
      })
      .from(crmWhatsappConversas)
      .where(gte(crmWhatsappConversas.createdAt, desde))
      .groupBy(crmWhatsappConversas.estado)

    const totalLeads = await db
      .select({ count: sql<number>`count(*)` })
      .from(crmLeads)
      .where(
        and(
          eq(crmLeads.origem, "WHATSAPP"),
          gte(crmLeads.createdAt, desde)
        )
      )
      .then((r: any) => Number(r[0]?.count || 0))

    const encerrados = porEstado.find((e: any) => e.estado === "ENCERRADO")
    const taxaConclusao = totalConversas > 0
      ? Math.round(((encerrados?.count || 0) / totalConversas) * 100)
      : 0

    const dropoff = porEstado
      .filter((e: any) => e.estado !== "ENCERRADO" && e.estado !== "SAUDACAO")
      .sort((a: any, b: any) => b.count - a.count)

    const tempoMedioResult = await db.execute(sql`
      SELECT AVG(EXTRACT(EPOCH FROM (max_ts - min_ts)) / 60) as avg_minutes
      FROM (
        SELECT
          remote_jid,
          MIN(created_at) as min_ts,
          MAX(created_at) as max_ts
        FROM crm_whatsapp_mensagens
        WHERE created_at >= ${desde}
        GROUP BY remote_jid
        HAVING COUNT(*) > 1
      ) sub
    `)
    const tempoMedio = Math.round(Number((tempoMedioResult as any)?.rows?.[0]?.avg_minutes || 0))

    const msgsPorDia = await db
      .select({
        dia: sql<string>`TO_CHAR(${crmWhatsappMensagens.createdAt}, 'YYYY-MM-DD')`,
        recebidas: sql<number>`count(*) FILTER (WHERE ${crmWhatsappMensagens.tipo} = 'RECEBIDA')`,
        enviadas: sql<number>`count(*) FILTER (WHERE ${crmWhatsappMensagens.tipo} = 'ENVIADA')`,
      })
      .from(crmWhatsappMensagens)
      .where(gte(crmWhatsappMensagens.createdAt, desde))
      .groupBy(sql`TO_CHAR(${crmWhatsappMensagens.createdAt}, 'YYYY-MM-DD')`)
      .orderBy(sql`TO_CHAR(${crmWhatsappMensagens.createdAt}, 'YYYY-MM-DD')`)

    const topErros = await db
      .select({
        step: crmWhatsappFlowLogs.step,
        count: sql<number>`count(*)`,
      })
      .from(crmWhatsappFlowLogs)
      .where(
        and(
          eq(crmWhatsappFlowLogs.status, "error"),
          gte(crmWhatsappFlowLogs.createdAt, desde)
        )
      )
      .groupBy(crmWhatsappFlowLogs.step)
      .orderBy(desc(sql`count(*)`))
      .limit(5)

    const ativas24h = await db
      .select({ count: sql<number>`count(*)` })
      .from(crmWhatsappConversas)
      .where(
        and(
          sql`${crmWhatsappConversas.updatedAt} > NOW() - INTERVAL '24 hours'`,
          sql`${crmWhatsappConversas.estado} NOT IN ('ENCERRADO', 'SAUDACAO')`
        )
      )
      .then((r: any) => Number(r[0]?.count || 0))

    return NextResponse.json({
      resumo: {
        totalConversas,
        totalLeads,
        taxaConclusao,
        tempoMedioMinutos: tempoMedio,
        ativas24h,
      },
      porEstado,
      dropoff,
      msgsPorDia,
      topErros,
      dias,
    })
  } catch (error) {
    console.error("[GET /api/admin/whatsapp-dashboard]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
