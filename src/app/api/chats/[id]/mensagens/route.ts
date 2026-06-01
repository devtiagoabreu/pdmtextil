import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { chatMensagens, chatLeituras, chatParticipantes, chats } from "@/lib/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const chatId = parseInt(id)

    const mensagens = await db
      .select()
      .from(chatMensagens)
      .where(eq(chatMensagens.chatId, chatId))
      .orderBy(chatMensagens.createdAt)

    const leituras = await db
      .select({
        mensagemId: chatLeituras.mensagemId,
        usuarioId: chatLeituras.usuarioId,
        lidaEm: chatLeituras.lidaEm,
      })
      .from(chatLeituras)
      .where(
        eq(chatLeituras.mensagemId, mensagens.length > 0 ? mensagens[0].id : -1)
      )

    return NextResponse.json({ mensagens, leituras })
  } catch (error) {
    console.error("[GET /api/chats/[id]/mensagens]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { session, userId } = auth

    const { id } = await params
    const chatId = parseInt(id)
    const body = await req.json()

    if (!body.mensagem?.trim()) {
      return NextResponse.json({ error: "Mensagem é obrigatória" }, { status: 400 })
    }

    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1)
    if (!chat) return NextResponse.json({ error: "Chat não encontrado" }, { status: 404 })

    const [msg] = await db
      .insert(chatMensagens)
      .values({ chatId, remetenteId: userId, mensagem: body.mensagem.trim() })
      .returning()

    await db.insert(chatLeituras).values({ mensagemId: msg.id, usuarioId: userId })

    await db
      .update(chatParticipantes)
      .set({ ultimaMensagemLidaId: msg.id })
      .where(and(eq(chatParticipantes.chatId, chatId), eq(chatParticipantes.usuarioId, userId)))

    await db
      .update(chats)
      .set({ updatedAt: new Date() })
      .where(eq(chats.id, chatId))

    const { usuarios } = await import("@/lib/db/schema/usuarios")
    const [remetente] = await db
      .select({ name: usuarios.name })
      .from(usuarios)
      .where(eq(usuarios.id, userId))
      .limit(1)

    return NextResponse.json({ ...msg, remetenteNome: remetente?.name }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/chats/[id]/mensagens]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
