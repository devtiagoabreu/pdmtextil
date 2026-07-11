import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { chats, chatParticipantes, chatMensagens } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const [result] = await db
      .select({
        total: sql<number>`COUNT(*)`.as("total"),
      })
      .from(chats)
      .innerJoin(chatParticipantes, eq(chats.id, chatParticipantes.chatId))
      .innerJoin(
        chatMensagens,
        and(
          eq(chatMensagens.chatId, chats.id),
          sql`${chatMensagens.id} > COALESCE(${chatParticipantes.ultimaMensagemLidaId}, 0)`
        )
      )
      .where(eq(chatParticipantes.usuarioId, userId))

    return NextResponse.json({ naoLidas: result?.total || 0 })
  } catch (error) {
    console.error("[GET /api/chats/nao-lidas]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
