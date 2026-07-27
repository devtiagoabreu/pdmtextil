import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { eq, desc, and, sql } from "drizzle-orm"
import { crmWhatsappMensagens } from "@/lib/db/schema/crm-whatsapp"
import { crmWhatsappConversas } from "@/lib/db/schema/crm-whatsapp-conversas"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { enviarMensagem, evolutionConfigurado } from "@/lib/evolution-api"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const remoteJid = req.nextUrl.searchParams.get("remoteJid")
    if (!remoteJid) {
      return NextResponse.json({ error: "remoteJid obrigatório" }, { status: 400 })
    }

    await db
      .update(crmWhatsappMensagens)
      .set({ lida: true })
      .where(
        and(
          eq(crmWhatsappMensagens.remoteJid, remoteJid),
          eq(crmWhatsappMensagens.tipo, "RECEBIDA"),
          eq(crmWhatsappMensagens.lida, false),
        )
      )

    const mensagens = await db
      .select()
      .from(crmWhatsappMensagens)
      .where(eq(crmWhatsappMensagens.remoteJid, remoteJid))
      .orderBy(crmWhatsappMensagens.createdAt)
      .limit(200)

    const conversa = await db
      .select()
      .from(crmWhatsappConversas)
      .where(eq(crmWhatsappConversas.remoteJid, remoteJid))
      .limit(1)
      .then((r) => r[0] || null)

    const lead = await db
      .select()
      .from(crmLeads)
      .where(eq(crmLeads.idIntegracao, `whatsapp:${remoteJid}`))
      .limit(1)
      .then((r) => r[0] || null)

    return NextResponse.json({
      mensagens,
      conversa,
      lead,
    })
  } catch (error) {
    console.error("[GET /api/crm/whatsapp/chat]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const { remoteJid, mensagem, modo } = body

    if (!remoteJid || !mensagem?.trim()) {
      return NextResponse.json({ error: "remoteJid e mensagem obrigatórios" }, { status: 400 })
    }

    const [msgSalva] = await db
      .insert(crmWhatsappMensagens)
      .values({
        mensagem: mensagem.trim(),
        tipo: "ENVIADA",
        status: "ENVIADA",
        remoteJid,
      })
      .returning()

    let envioOk = false
    let envioErro = null

    if (evolutionConfigurado()) {
      const resultado = await enviarMensagem(remoteJid, mensagem.trim())
      envioOk = resultado.sucesso
      envioErro = resultado.erro || null

      if (resultado.sucesso && resultado.externalId) {
        await db
          .update(crmWhatsappMensagens)
          .set({ externalId: resultado.externalId, status: "ENTREGUE" })
          .where(eq(crmWhatsappMensagens.id, msgSalva.id))
      } else if (!resultado.sucesso) {
        await db
          .update(crmWhatsappMensagens)
          .set({ status: "ERRO" })
          .where(eq(crmWhatsappMensagens.id, msgSalva.id))
      }
    }

    if (modo === "assumir") {
      await db
        .insert(crmWhatsappConversas)
        .values({ remoteJid, estado: "HUMANO_ASSUMINDO", dados: {} })
        .onConflictDoUpdate({
          target: crmWhatsappConversas.remoteJid,
          set: { estado: sql`EXCLUDED.estado`, updatedAt: sql`NOW()` },
        })
    } else if (modo === "devolver_bot") {
      await db
        .insert(crmWhatsappConversas)
        .values({ remoteJid, estado: "SAUDACAO", dados: {} })
        .onConflictDoUpdate({
          target: crmWhatsappConversas.remoteJid,
          set: { estado: sql`EXCLUDED.estado`, updatedAt: sql`NOW()` },
        })
    }

    return NextResponse.json({
      ok: true,
      mensagem: msgSalva,
      envioOk,
      envioErro,
    })
  } catch (error) {
    console.error("[POST /api/crm/whatsapp/chat]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
