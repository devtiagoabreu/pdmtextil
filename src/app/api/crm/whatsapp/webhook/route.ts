import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { crmWhatsappMensagens } from "@/lib/db/schema/crm-whatsapp"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { eq } from "drizzle-orm"
import { inserirTimelineEvento } from "@/lib/crm-timeline"

export const dynamic = "force-dynamic"

async function criarLeadWhatsApp(remoteJid: string, mensagem: string) {
  const numero = remoteJid.replace(/@s\.whatsapp\.net$/, "").replace(/\D/g, "")
  const nomeContato = `WhatsApp ${numero}`

  const cnpjTemp = `000.000.000-${Date.now().toString().slice(-4)}`
  const [empresa] = await db.insert(crmPessoas).values({
    razaoSocial: nomeContato,
    nomeFantasia: nomeContato,
    cnpj: cnpjTemp,
  }).returning()

  const [contato] = await db.insert(crmContatos).values({
    nome: nomeContato,
    whatsapp: remoteJid,
    celular: numero,
    empresaId: empresa.id,
    principal: true,
  }).returning()

  const [lead] = await db.insert(crmLeads).values({
    nome: nomeContato,
    celular: numero,
    origem: "WHATSAPP",
    descricao: `Lead criado automaticamente via WhatsApp. Mensagem: "${mensagem.substring(0, 200)}"`,
    empresaId: empresa.id,
    idIntegracao: `whatsapp:${remoteJid}`,
  }).returning()

  return { empresa, contato, lead }
}

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.WHATSAPP_WEBHOOK_SECRET
    if (webhookSecret) {
      const authHeader = req.headers.get("authorization")
      const querySecret = req.nextUrl.searchParams.get("secret")
      if (authHeader !== `Bearer ${webhookSecret}` && querySecret !== webhookSecret) {
        return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
      }
    }

    const createLead = req.nextUrl.searchParams.get("createLead") === "true"

    const body = await req.json()

    const { remoteJid, mensagem, externalId } = body

    if (!remoteJid || !mensagem) {
      return NextResponse.json({ error: "remoteJid e mensagem são obrigatórios" }, { status: 400 })
    }

    let contato = await db
      .select()
      .from(crmContatos)
      .where(eq(crmContatos.whatsapp, remoteJid))
      .limit(1)
      .then((r) => r[0] || null)

    let empresaId = contato?.empresaId || null
    let leadCriado = null

    if (contato && !empresaId) {
      return NextResponse.json({ error: "Contato sem empresa vinculada" }, { status: 400 })
    }

    if (!contato && createLead) {
      const criado = await criarLeadWhatsApp(remoteJid, mensagem)
      contato = criado.contato
      empresaId = criado.empresa.id
      leadCriado = criado.lead
    }

    const [nova] = await db
      .insert(crmWhatsappMensagens)
      .values({
        empresaId,
        contatoId: contato?.id || null,
        mensagem,
        tipo: "RECEBIDA",
        status: "RECEBIDA",
        remoteJid,
        externalId: externalId || null,
      })
      .returning()

    if (empresaId) {
      await inserirTimelineEvento({
        empresaId,
        tipo: "WHATSAPP",
        descricao: `Mensagem recebida via WhatsApp: "${mensagem.substring(0, 100)}"`,
        metadados: { whatsappId: nova.id, remoteJid },
      })
    }

    return NextResponse.json({
      id: nova.id,
      status: "ok",
      leadCriado: !!leadCriado,
      leadId: leadCriado?.id || null,
      empresaId,
      contatoId: contato?.id || null,
    }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/whatsapp/webhook]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
