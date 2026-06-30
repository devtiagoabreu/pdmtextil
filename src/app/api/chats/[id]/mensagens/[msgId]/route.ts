import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { chatMensagens, chats } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"

function isWithin5Min(data: Date | string | null): boolean {
  if (!data) return false
  const agora = new Date()
  return (agora.getTime() - new Date(data).getTime()) < 5 * 60 * 1000
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string; msgId: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { id, msgId } = await params
    const chatId = parseInt(id)
    const mensagemId = parseInt(msgId)

    const body = await req.json()
    if (!body.mensagem?.trim()) {
      return NextResponse.json({ error: "Mensagem é obrigatória" }, { status: 400 })
    }

    const [msg] = await db
      .select()
      .from(chatMensagens)
      .where(and(eq(chatMensagens.id, mensagemId), eq(chatMensagens.chatId, chatId)))
      .limit(1)

    if (!msg) return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 })
    if (msg.remetenteId !== userId) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    if (!isWithin5Min(msg.createdAt)) return NextResponse.json({ error: "Prazo de 5 minutos expirou" }, { status: 400 })

    const [updated] = await db
      .update(chatMensagens)
      .set({ mensagem: body.mensagem.trim() })
      .where(eq(chatMensagens.id, mensagemId))
      .returning()

    await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId))

    return NextResponse.json(updated)
  } catch (error) {
    console.error("[PATCH /api/chats/[id]/mensagens/[msgId]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; msgId: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { id, msgId } = await params
    const chatId = parseInt(id)
    const mensagemId = parseInt(msgId)

    const [msg] = await db
      .select()
      .from(chatMensagens)
      .where(and(eq(chatMensagens.id, mensagemId), eq(chatMensagens.chatId, chatId)))
      .limit(1)

    if (!msg) return NextResponse.json({ error: "Mensagem não encontrada" }, { status: 404 })
    if (msg.remetenteId !== userId) return NextResponse.json({ error: "Não autorizado" }, { status: 403 })
    if (!isWithin5Min(msg.createdAt)) return NextResponse.json({ error: "Prazo de 5 minutos expirou" }, { status: 400 })

    await db.delete(chatMensagens).where(eq(chatMensagens.id, mensagemId))
    await db.update(chats).set({ updatedAt: new Date() }).where(eq(chats.id, chatId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/chats/[id]/mensagens/[msgId]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
