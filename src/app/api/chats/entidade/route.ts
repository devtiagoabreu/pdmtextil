import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { chats, chatParticipantes, chatMensagens } from "@/lib/db/schema"
import { eq, and, asc } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { searchParams } = new URL(req.url)
    const entidadeTipo = searchParams.get("tipo")
    const entidadeId = searchParams.get("id")

    if (!entidadeTipo || !entidadeId) {
      return NextResponse.json({ error: "tipo e id são obrigatórios" }, { status: 400 })
    }

    const [chat] = await db
      .select()
      .from(chats)
      .where(
        and(eq(chats.entidadeTipo, entidadeTipo), eq(chats.entidadeId, parseInt(entidadeId)))
      )
      .limit(1)

    if (!chat) return NextResponse.json(null)

    const participantes = await db
      .select({ usuarioId: chatParticipantes.usuarioId })
      .from(chatParticipantes)
      .where(eq(chatParticipantes.chatId, chat.id))

    const mensagens = await db
      .select()
      .from(chatMensagens)
      .where(eq(chatMensagens.chatId, chat.id))
      .orderBy(asc(chatMensagens.createdAt))

    return NextResponse.json({ ...chat, participantes, mensagens })
  } catch (error) {
    console.error("[GET /api/chats/entidade]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
