import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { crmWhatsappMensagens } from "@/lib/db/schema/crm-whatsapp"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { eq, desc, and } from "drizzle-orm"
import { enviarMensagem, evolutionConfigurado } from "@/lib/evolution-api"
import { inserirTimelineEvento } from "@/lib/crm-timeline"

function extractRemoteJid(idIntegracao: string | null): string | null {
  if (!idIntegracao) return null
  const prefix = "whatsapp:"
  if (!idIntegracao.startsWith(prefix)) return null
  return idIntegracao.slice(prefix.length)
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [lead] = await db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.id, parseInt(id)))
      .limit(1)

    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
    }

    const remoteJid = extractRemoteJid(lead.idIntegracao)
    if (!remoteJid) {
      return NextResponse.json([])
    }

    const mensagens = await db
      .select()
      .from(crmWhatsappMensagens)
      .where(eq(crmWhatsappMensagens.remoteJid, remoteJid))
      .orderBy(desc(crmWhatsappMensagens.createdAt))
      .limit(100)

    return NextResponse.json(mensagens)
  } catch (error) {
    console.error("[GET /api/crm/leads/[id]/whatsapp]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const [lead] = await db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.id, parseInt(id)))
      .limit(1)

    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado" }, { status: 404 })
    }

    const body = await req.json()
    const texto = body.mensagem
    if (!texto?.trim()) {
      return NextResponse.json({ error: "Mensagem obrigatória" }, { status: 400 })
    }

    let remoteJid = extractRemoteJid(lead.idIntegracao)
    let contatoId: number | null = null

    if (!remoteJid && lead.empresaId) {
      const contato = await db
        .select()
        .from(crmContatos)
        .where(
          and(
            eq(crmContatos.empresaId, lead.empresaId),
            eq(crmContatos.principal, true)
          )
        )
        .limit(1)
        .then((r) => r[0] || null)

      if (contato?.whatsapp) {
        remoteJid = contato.whatsapp
        contatoId = contato.id
      }
    }

    const [nova] = await db
      .insert(crmWhatsappMensagens)
      .values({
        empresaId: lead.empresaId,
        contatoId,
        mensagem: texto,
        tipo: "ENVIADA",
        status: "ENVIADA",
        remoteJid,
        externalId: null,
      })
      .returning()

    let statusEnvio = "ENVIADA"

    if (remoteJid && evolutionConfigurado()) {
      const result = await enviarMensagem(remoteJid, texto)
      if (result.sucesso && result.externalId) {
        await db
          .update(crmWhatsappMensagens)
          .set({ externalId: result.externalId, status: "ENTREGUE" })
          .where(eq(crmWhatsappMensagens.id, nova.id))
        statusEnvio = "ENTREGUE"
      } else {
        console.warn("[Evolution] Falha ao enviar:", result.erro)
        await db
          .update(crmWhatsappMensagens)
          .set({ status: "ERRO" })
          .where(eq(crmWhatsappMensagens.id, nova.id))
        statusEnvio = "ERRO"
      }
    }

    if (lead.empresaId) {
      await inserirTimelineEvento({
        empresaId: lead.empresaId,
        tipo: "WHATSAPP",
        descricao: `Mensagem enviada para lead "${lead.nome}": "${texto.substring(0, 100)}"`,
        metadados: { leadId: lead.id, whatsappId: nova.id, status: statusEnvio },
      })
    }

    return NextResponse.json({ ...nova, status: statusEnvio }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/leads/[id]/whatsapp]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
