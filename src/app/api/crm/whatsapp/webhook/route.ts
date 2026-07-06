import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { crmWhatsappMensagens } from "@/lib/db/schema/crm-whatsapp"
import { crmEmpresas } from "@/lib/db/schema/crm-empresas"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { eq, like } from "drizzle-orm"
import { inserirTimelineEvento } from "@/lib/crm-timeline"

export const dynamic = "force-dynamic"

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

    const body = await req.json()

    const { remoteJid, mensagem, externalId } = body

    if (!remoteJid || !mensagem) {
      return NextResponse.json({ error: "remoteJid e mensagem são obrigatórios" }, { status: 400 })
    }

    const contato = await db
      .select()
      .from(crmContatos)
      .where(eq(crmContatos.whatsapp, remoteJid))
      .limit(1)
      .then((r) => r[0] || null)

    const empresaId = contato?.empresaId || null

    if (contato && !empresaId) {
      return NextResponse.json({ error: "Contato sem empresa vinculada" }, { status: 400 })
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

    return NextResponse.json({ id: nova.id, status: "ok" }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/whatsapp/webhook]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
