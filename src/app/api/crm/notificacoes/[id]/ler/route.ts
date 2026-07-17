import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { crmNotificacoes } from "@/lib/db/schema/crm-notificacoes"
import { eq } from "drizzle-orm"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    const [atualizada] = await db
      .update(crmNotificacoes)
      .set({ lida: true })
      .where(eq(crmNotificacoes.id, Number(id)))
      .returning()

    if (!atualizada) {
      return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 })
    }

    return NextResponse.json(atualizada)
  } catch (error) {
    console.error("[PATCH /api/crm/notificacoes/[id]/ler]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const body = await req.json()
    const lida = body.lida !== false
    const { id } = await params

    const [atualizada] = await db
      .update(crmNotificacoes)
      .set({ lida })
      .where(eq(crmNotificacoes.id, Number(id)))
      .returning()

    if (!atualizada) {
      return NextResponse.json({ error: "Notificação não encontrada" }, { status: 404 })
    }

    return NextResponse.json(atualizada)
  } catch (error) {
    console.error("[POST /api/crm/notificacoes/[id]/ler]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
