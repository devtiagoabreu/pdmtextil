import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmWhatsappMensagens } from "@/lib/db/schema/crm-whatsapp"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { eq, desc, and, sql } from "drizzle-orm"
import { inserirTimelineEvento } from "@/lib/crm-timeline"
import { enviarMensagem, evolutionConfigurado } from "@/lib/evolution-api"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get("empresaId")
    const remoteJid = searchParams.get("remoteJid")

    const conditions = []
    if (empresaId) conditions.push(eq(crmWhatsappMensagens.empresaId, Number(empresaId)))
    if (remoteJid) conditions.push(eq(crmWhatsappMensagens.remoteJid, remoteJid))

    const where = conditions.length > 0 ? sql`${conditions.reduce((a, b) => sql`${a} AND ${b}`)}` : undefined

    const lista = await db
      .select()
      .from(crmWhatsappMensagens)
      .where(where)
      .orderBy(desc(crmWhatsappMensagens.createdAt))
      .limit(50)

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/crm/whatsapp]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()

    let remoteJid = body.remoteJid || null
    let contatoId = body.contatoId || null

    if (!remoteJid && body.empresaId && evolutionConfigurado()) {
      const contato = await db
        .select()
        .from(crmContatos)
        .where(
          and(
            eq(crmContatos.empresaId, Number(body.empresaId)),
            eq(crmContatos.principal, true),
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
        empresaId: body.empresaId,
        contatoId: contatoId,
        mensagem: body.mensagem,
        tipo: "ENVIADA",
        status: "ENVIADA",
        remoteJid: remoteJid,
        externalId: null,
      })
      .returning()

    let statusEnvio = "ENVIADA"

    if (remoteJid && evolutionConfigurado()) {
      const result = await enviarMensagem(remoteJid, body.mensagem)
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

    if (nova.empresaId) {
      await inserirTimelineEvento({
        empresaId: nova.empresaId,
        tipo: "WHATSAPP",
        descricao: `Mensagem ${statusEnvio === "ENTREGUE" ? "enviada" : "tentativa de envio"}: "${nova.mensagem.substring(0, 100)}"`,
        metadados: { whatsappId: nova.id, status: statusEnvio },
      })
    }

    return NextResponse.json({ ...nova, status: statusEnvio }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/whatsapp]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
