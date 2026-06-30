import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { chatMensagens, chatLeituras, chatParticipantes, chats, usuarios } from "@/lib/db/schema"
import { notificacoes } from "@/lib/db/schema/notificacoes"
import { eq, and, inArray } from "drizzle-orm"
import { sendEmail } from "@/lib/email"

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL
  || (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://pdmprotextil.vercel.app")

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params
    const chatId = parseInt(id)

    const mensagens = await db
      .select({
        id: chatMensagens.id,
        chatId: chatMensagens.chatId,
        remetenteId: chatMensagens.remetenteId,
        mensagem: chatMensagens.mensagem,
        createdAt: chatMensagens.createdAt,
        remetenteNome: usuarios.name,
      })
      .from(chatMensagens)
      .leftJoin(usuarios, eq(chatMensagens.remetenteId, usuarios.id))
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
        inArray(chatLeituras.mensagemId, mensagens.length > 0 ? mensagens.map((m) => m.id) : [-1])
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

    const [remetente] = await db
      .select({ name: usuarios.name })
      .from(usuarios)
      .where(eq(usuarios.id, userId))
      .limit(1)

    // ── @mention parsing (todos os usuários ativos) ──
    const mencionados = new Set<number>()
    const todosUsers = await db
      .select({ id: usuarios.id, name: usuarios.name, email: usuarios.email })
      .from(usuarios)
      .where(eq(usuarios.ativo, true))

    const mentionRegex = /@(\w[\wÀ-ÿ\s]*\w|\w)/g
    let match: RegExpExecArray | null
    while ((match = mentionRegex.exec(body.mensagem)) !== null) {
      const nomeProcurado = match[1].trim().toLowerCase()
      const matched = todosUsers.find(u =>
        u.id !== userId && u.name.toLowerCase() === nomeProcurado
      )
      if (matched) {
        mencionados.add(matched.id)
      }
    }

    if (mencionados.size > 0) {
      const chatLink = `/chat?chatId=${chatId}`
      const remetenteNome = remetente?.name || "Alguém"

      const notificacoesData = Array.from(mencionados).map(uid => ({
        tipo: "CHAT_MENCAO",
        mensagem: `${remetenteNome} mencionou você no chat "${chat.titulo}"`,
        usuarioId: uid,
        usuarioNome: session?.user?.name || null,
        link: chatLink,
      }))

      await db.insert(notificacoes).values(notificacoesData)

      const usersMencionados = await db
        .select({ id: usuarios.id, name: usuarios.name, email: usuarios.email })
        .from(usuarios)
        .where(and(inArray(usuarios.id, Array.from(mencionados)), eq(usuarios.ativo, true)))

      const emailsValidos = usersMencionados
        .map(u => u.email)
        .filter((e): e is string => !!e && e.includes("@"))

      if (emailsValidos.length > 0) {
        await sendEmail({
          to: emailsValidos,
          subject: `[PDM Têxtil] ${remetenteNome} mencionou você no chat "${chat.titulo}"`,
          html: `<div style="font-family:Arial,sans-serif;padding:20px;max-width:600px">
<h2 style="color:#1e3a5f">💬 Chat Corporativo</h2>
<p style="font-size:15px"><strong>${remetenteNome}</strong> mencionou você no chat <strong>"${chat.titulo}"</strong></p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin:16px 0;font-style:italic;color:#475569">
  ${body.mensagem.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>")}
</div>
<p><a href="${SITE_URL}${chatLink}" style="background:#1e3a5f;color:#fff;padding:10px 20px;text-decoration:none;border-radius:6px;display:inline-block">Abrir conversa</a></p>
<hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0" />
<p style="color:#94a3b8;font-size:12px">Sistema PDM Têxtil</p>
</div>`,
        })
      }
    }

    return NextResponse.json({ ...msg, remetenteNome: remetente?.name }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/chats/[id]/mensagens]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
