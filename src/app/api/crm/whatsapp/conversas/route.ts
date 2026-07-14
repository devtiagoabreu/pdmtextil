import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmWhatsappMensagens } from "@/lib/db/schema/crm-whatsapp"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { desc, sql, and, eq, or, isNotNull } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search") || ""

    const mensagens = db
      .select({
        remoteJid: crmWhatsappMensagens.remoteJid,
        mensagem: crmWhatsappMensagens.mensagem,
        tipo: crmWhatsappMensagens.tipo,
        lida: crmWhatsappMensagens.lida,
        createdAt: crmWhatsappMensagens.createdAt,
      })
      .from(crmWhatsappMensagens)
      .where(isNotNull(crmWhatsappMensagens.remoteJid))
      .as("mensagens")

    const conversas = await db
      .select({
        remoteJid: crmWhatsappMensagens.remoteJid,
        ultimaMensagem: sql<string>`(SELECT mensagem FROM crm_whatsapp_mensagens WHERE remote_jid = ${crmWhatsappMensagens.remoteJid} ORDER BY created_at DESC LIMIT 1)`,
        ultimoTipo: sql<string>`(SELECT tipo FROM crm_whatsapp_mensagens WHERE remote_jid = ${crmWhatsappMensagens.remoteJid} ORDER BY created_at DESC LIMIT 1)`,
        ultimaData: sql<string>`MAX(${crmWhatsappMensagens.createdAt})`,
        naoLidas: sql<number>`COUNT(*) FILTER (WHERE NOT ${crmWhatsappMensagens.lida} AND ${crmWhatsappMensagens.tipo} = 'RECEBIDA')`,
        total: sql<number>`COUNT(*)`,
      })
      .from(crmWhatsappMensagens)
      .where(isNotNull(crmWhatsappMensagens.remoteJid))
      .groupBy(crmWhatsappMensagens.remoteJid)
      .orderBy(desc(sql`MAX(${crmWhatsappMensagens.createdAt})`))
      .limit(100)

    const remoteJids = conversas.map((c) => c.remoteJid)

    const leads = await db
      .select({
        id: crmLeads.id,
        nome: crmLeads.nome,
        celular: crmLeads.celular,
        status: crmLeads.status,
        idIntegracao: crmLeads.idIntegracao,
      })
      .from(crmLeads)
      .where(
        remoteJids.length > 0
          ? sql`${crmLeads.idIntegracao} IN (${sql.join(remoteJids.map((j) => sql`${`whatsapp:${j}`}`), sql`, `)})`
          : sql`1=0`
      )

    const contatos = await db
      .select({
        id: crmContatos.id,
        nome: crmContatos.nome,
        whatsapp: crmContatos.whatsapp,
        empresaId: crmContatos.empresaId,
        empresaNome: crmPessoas.razaoSocial,
      })
      .from(crmContatos)
      .leftJoin(crmPessoas, eq(crmContatos.empresaId, crmPessoas.id))
      .where(
        remoteJids.length > 0
          ? sql`${crmContatos.whatsapp} IN (${sql.join(remoteJids.map((j) => sql`${j}`), sql`, `)})`
          : sql`1=0`
      )

    const resultado = conversas.map((c) => {
      const lead = leads.find((l) => l.idIntegracao === `whatsapp:${c.remoteJid}`)
      const contato = contatos.find((ct) => ct.whatsapp === c.remoteJid)
      const nome = lead?.nome || contato?.nome || contato?.empresaNome || c.remoteJid?.split("@")[0] || "Desconhecido"
      const link = lead ? `/comercial/crm/leads/${lead.id}` : contato?.empresaId ? `/comercial/crm/pessoas/${contato.empresaId}` : null

      return {
        remoteJid: c.remoteJid,
        nome,
        ultimaMensagem: c.ultimaMensagem,
        ultimoTipo: c.ultimoTipo,
        ultimaData: c.ultimaData,
        naoLidas: Number(c.naoLidas),
        total: Number(c.total),
        leadId: lead?.id || null,
        link,
      }
    })

    const filtrados = search
      ? resultado.filter(
          (r) =>
            r.nome.toLowerCase().includes(search.toLowerCase()) ||
            r.remoteJid.includes(search)
        )
      : resultado

    return NextResponse.json(filtrados)
  } catch (error) {
    console.error("[GET /api/crm/whatsapp/conversas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
