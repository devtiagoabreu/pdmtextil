import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmNotificacoes } from "@/lib/db/schema/crm-notificacoes"
import { desc, eq, sql } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = new URL(req.url)
    const apenasNaoLidas = searchParams.get("naoLidas") === "true"
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200)

    let query = db
      .select()
      .from(crmNotificacoes)
      .orderBy(desc(crmNotificacoes.createdAt))
      .limit(limit)

    if (apenasNaoLidas) {
      query = query.where(eq(crmNotificacoes.lida, false)) as any
    }

    const lista = await query
    const naoLidas = await db
      .select({ count: sql<number>`COUNT(${crmNotificacoes.id})` })
      .from(crmNotificacoes)
      .where(eq(crmNotificacoes.lida, false))
      .then((r) => Number(r[0]?.count || 0))

    return NextResponse.json({ lista, naoLidas })
  } catch (error) {
    console.error("[GET /api/crm/notificacoes]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { titulo, mensagem, tipo, link, metadados } = body

    if (!titulo) {
      return NextResponse.json({ error: "titulo é obrigatório" }, { status: 400 })
    }

    const [nova] = await db
      .insert(crmNotificacoes)
      .values({
        titulo,
        mensagem: mensagem || null,
        tipo: tipo || "lead_novo",
        link: link || null,
        metadados: metadados || {},
      })
      .returning()

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    console.error("[POST /api/crm/notificacoes]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
