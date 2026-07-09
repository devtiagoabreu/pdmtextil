import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { pgTable, serial, varchar, jsonb, timestamp } from "drizzle-orm/pg-core"
import { eq, sql } from "drizzle-orm"
import { crmLeads } from "@/lib/db/schema/crm-leads"

const crmWhatsappConversas = pgTable("crm_whatsapp_conversas", {
  id: serial("id").primaryKey(),
  remoteJid: varchar("remote_jid", { length: 255 }).notNull().unique(),
  estado: varchar("estado", { length: 50 }).notNull().default("SAUDACAO"),
  dados: jsonb("dados").$type<Record<string, any>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
})

function extrairNumero(remoteJid: string): string {
  return remoteJid.replace(/@s\.whatsapp\.net$/, "").replace(/\D/g, "")
}

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

    let lead = null
    if ((estado === "FINALIZANDO" || estado === "ENCERRADO") && dados?.nome) {
      const existing = await db
        .select({ id: crmLeads.id })
        .from(crmLeads)
        .where(eq(crmLeads.idIntegracao, `whatsapp:${remoteJid}`))
        .limit(1)
        .then((r) => r[0] || null)

      if (!existing) {
        const numero = extrairNumero(remoteJid)
        const descricaoParts: string[] = []
        if (dados.produto) descricaoParts.push(`Produto: ${dados.produto}`)
        if (dados.documento) descricaoParts.push(`Documento: ${dados.documento}`)
        if (dados.tipoPessoa) descricaoParts.push(`Tipo: ${dados.tipoPessoa}`)
        if (dados.empresaNome) descricaoParts.push(`Empresa: ${dados.empresaNome}`)

        const [novo] = await db
          .insert(crmLeads)
          .values({
            nome: dados.nome,
            email: dados.email || null,
            celular: numero,
            empresaNome: dados.tipoPessoa === "PJ" ? (dados.empresaNome || dados.nome) : null,
            origem: "WHATSAPP",
            descricao: descricaoParts.length > 0 ? descricaoParts.join(" | ") : null,
            idIntegracao: `whatsapp:${remoteJid}`,
          })
          .returning()

        lead = novo
      }
    }

    return NextResponse.json({ ...atualizada, lead })
  } catch (error) {
    console.error("[POST /api/crm/whatsapp/conversa]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
