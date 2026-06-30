import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { chats, chatMensagens, chatParticipantes } from "@/lib/db/schema"
import { eq, inArray } from "drizzle-orm"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const chatId = parseInt(id)

    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1)
    if (!chat) return NextResponse.json({ error: "Chat não encontrado" }, { status: 404 })

    const participantes = await db
      .select({
        id: chatParticipantes.id,
        usuarioId: chatParticipantes.usuarioId,
        ultimaMensagemLidaId: chatParticipantes.ultimaMensagemLidaId,
      })
      .from(chatParticipantes)
      .where(eq(chatParticipantes.chatId, chatId))

    const { usuarios } = await import("@/lib/db/schema/usuarios")
    const usuarioIds = participantes.map((p) => p.usuarioId)
    const users = usuarioIds.length > 0
      ? await db
          .select({ id: usuarios.id, name: usuarios.name, email: usuarios.email })
          .from(usuarios)
          .where(inArray(usuarios.id, usuarioIds))
      : []

    return NextResponse.json({ ...chat, participantes, usuarios: users })
  } catch (error) {
    console.error("[GET /api/chats/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { id } = await params
    const chatId = parseInt(id)

    const [chat] = await db.select().from(chats).where(eq(chats.id, chatId)).limit(1)
    if (!chat) return NextResponse.json({ error: "Chat não encontrado" }, { status: 404 })
    if (chat.criadoPor !== userId) {
      return NextResponse.json({ error: "Apenas o criador pode excluir o chat" }, { status: 403 })
    }

    await db.delete(chats).where(eq(chats.id, chatId))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[DELETE /api/chats/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
