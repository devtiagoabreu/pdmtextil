import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { pgTable, serial, varchar, jsonb, timestamp } from "drizzle-orm/pg-core"
import { eq, sql } from "drizzle-orm"

const crmWhatsappConversas = pgTable("crm_whatsapp_conversas", {
  id: serial("id").primaryKey(),
  remoteJid: varchar("remote_jid", { length: 255 }).notNull().unique(),
  estado: varchar("estado", { length: 50 }).notNull().default("SAUDACAO"),
  dados: jsonb("dados").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

export async function GET(req: NextRequest) {
  try {
    const remoteJid = req.nextUrl.searchParams.get("remoteJid")
    if (!remoteJid) {
      return NextResponse.json({ error: "remoteJid obrigatório" }, { status: 400 })
    }

    let conversa = await db
      .select()
      .from(crmWhatsappConversas)
      .where(eq(crmWhatsappConversas.remoteJid, remoteJid))
      .limit(1)
      .then((r) => r[0] || null)

    if (!conversa) {
      const [nova] = await db
        .insert(crmWhatsappConversas)
        .values({ remoteJid, estado: "SAUDACAO", dados: {} })
        .returning()
      conversa = nova
    }

    return NextResponse.json(conversa)
  } catch (error) {
    console.error("[GET /api/crm/whatsapp/conversa]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { remoteJid, estado, dados } = await req.json()

    if (!remoteJid) {
      return NextResponse.json({ error: "remoteJid obrigatório" }, { status: 400 })
    }

    const [atualizada] = await db
      .insert(crmWhatsappConversas)
      .values({ remoteJid, estado: estado || "SAUDACAO", dados: dados || {} })
      .onConflictDoUpdate({
        target: crmWhatsappConversas.remoteJid,
        set: { estado: sql`EXCLUDED.estado`, dados: sql`EXCLUDED.dados`, updatedAt: sql`NOW()` },
      })
      .returning()

    return NextResponse.json(atualizada)
  } catch (error) {
    console.error("[POST /api/crm/whatsapp/conversa]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
