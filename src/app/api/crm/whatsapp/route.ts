import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmWhatsappMensagens } from "@/lib/db/schema/crm-whatsapp"
import { eq, desc, and, sql } from "drizzle-orm"
import { inserirTimelineEvento } from "@/lib/crm-timeline"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { searchParams } = new URL(req.url)
    const empresaId = searchParams.get("empresaId")

    const conditions = []
    if (empresaId) conditions.push(eq(crmWhatsappMensagens.empresaId, Number(empresaId)))

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

    const [nova] = await db
      .insert(crmWhatsappMensagens)
      .values({
        empresaId: body.empresaId,
        contatoId: body.contatoId || null,
        mensagem: body.mensagem,
        tipo: body.tipo || "ENVIADA",
        status: "ENVIADA",
        remoteJid: body.remoteJid || null,
        externalId: body.externalId || null,
      })
      .returning()

    if (nova.empresaId) {
      await inserirTimelineEvento({
        empresaId: nova.empresaId,
        tipo: "WHATSAPP",
        descricao: `Mensagem ${nova.tipo === "ENVIADA" ? "enviada" : "recebida"}: "${nova.mensagem.substring(0, 100)}"`,
        metadados: { whatsappId: nova.id },
      })
    }

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/whatsapp]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
