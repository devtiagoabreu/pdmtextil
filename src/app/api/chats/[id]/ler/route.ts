import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { chatLeituras, chatMensagens, chatParticipantes, chats } from "@/lib/db/schema"
import { eq, and, inArray } from "drizzle-orm"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { id } = await params
    const chatId = parseInt(id)
    const body = await req.json()

    const [participante] = await db
      .select()
      .from(chatParticipantes)
      .where(and(eq(chatParticipantes.chatId, chatId), eq(chatParticipantes.usuarioId, userId)))
      .limit(1)

    if (!participante) {
      return NextResponse.json({ error: "Você não é participante deste chat" }, { status: 403 })
    }

    const mensagens = await db
      .select({ id: chatMensagens.id })
      .from(chatMensagens)
      .where(eq(chatMensagens.chatId, chatId))
      .orderBy(chatMensagens.createdAt)

    if (mensagens.length === 0) {
      return NextResponse.json({ success: true })
    }

    const ultimaMensagem = mensagens[mensagens.length - 1]

    await db
      .update(chatParticipantes)
      .set({ ultimaMensagemLidaId: ultimaMensagem.id })
      .where(and(eq(chatParticipantes.chatId, chatId), eq(chatParticipantes.usuarioId, userId)))

    const idsParaMarcar = mensagens
      .filter((m) => !body.apenasUltima || m.id === ultimaMensagem.id)
      .map((m) => m.id)

    if (idsParaMarcar.length > 0) {
      const existentes = await db
        .select({ mensagemId: chatLeituras.mensagemId })
        .from(chatLeituras)
        .where(and(
          inArray(chatLeituras.mensagemId, idsParaMarcar),
          eq(chatLeituras.usuarioId, userId)
        ))

      const existentesIds = new Set(existentes.map((e) => e.mensagemId))
      const novas = idsParaMarcar
        .filter((mid) => !existentesIds.has(mid))
        .map((mensagemId) => ({ mensagemId, usuarioId: userId }))

      if (novas.length > 0) {
        await db.insert(chatLeituras).values(novas)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[POST /api/chats/[id]/ler]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
