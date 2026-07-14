import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { chats, chatMensagens, chatParticipantes, chatLeituras, usuarios } from "@/lib/db/schema"
import { crmWhatsappMensagens } from "@/lib/db/schema/crm-whatsapp"
import { crmLeads } from "@/lib/db/schema/crm-leads"
import { crmContatos } from "@/lib/db/schema/crm-contatos"
import { crmPessoas } from "@/lib/db/schema/crm-pessoas"
import { eq, desc, and, or, sql, isNotNull } from "drizzle-orm"

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { userId } = auth

    const { searchParams } = new URL(req.url)
    const entidadeTipo = searchParams.get("entidadeTipo")
    const entidadeId = searchParams.get("entidadeId")

    if (entidadeTipo && entidadeId) {
      const result = await db
        .select()
        .from(chats)
        .where(
          and(
            eq(chats.entidadeTipo, entidadeTipo),
            eq(chats.entidadeId, parseInt(entidadeId))
          )
        )
        .limit(1)
      return NextResponse.json(result[0] || null)
    }

    const lista = await db
      .select({
        id: chats.id,
        tipo: chats.tipo,
        titulo: chats.titulo,
        entidadeTipo: chats.entidadeTipo,
        entidadeId: chats.entidadeId,
        criadoPor: chats.criadoPor,
        updatedAt: chats.updatedAt,
        createdAt: chats.createdAt,
        ultimaMensagem: sql<string>`
          (SELECT cm.mensagem FROM chat_mensagens cm
           WHERE cm.chat_id = chats.id
           ORDER BY cm.created_at DESC LIMIT 1)
        `,
        ultimaMensagemData: sql<string>`
          (SELECT cm.created_at FROM chat_mensagens cm
           WHERE cm.chat_id = chats.id
           ORDER BY cm.created_at DESC LIMIT 1)
        `,
        naoLidas: sql<number>`
          (SELECT COUNT(*) FROM chat_mensagens cm
           LEFT JOIN chat_participantes cp ON cp.chat_id = cm.chat_id AND cp.usuario_id = ${userId}
           WHERE cm.chat_id = chats.id
           AND (cp.ultima_mensagem_lida_id IS NULL OR cm.id > cp.ultima_mensagem_lida_id))
        `,
        participantes: sql<number>`
          (SELECT COUNT(*) FROM chat_participantes WHERE chat_id = chats.id)
        `,
      })
      .from(chats)
      .where(
        or(
          sql`EXISTS (SELECT 1 FROM chat_participantes WHERE chat_id = chats.id AND usuario_id = ${userId})`,
          sql`EXISTS (SELECT 1 FROM chat_mensagens WHERE chat_id = chats.id AND remetente_id = ${userId})`
        )
      )
      .orderBy(desc(chats.updatedAt))

    const whatsappGrouped = await db
      .select({
        remoteJid: crmWhatsappMensagens.remoteJid,
        ultimaMensagem: sql<string>`(
          SELECT mensagem FROM crm_whatsapp_mensagens
          WHERE remote_jid = ${crmWhatsappMensagens.remoteJid}
          ORDER BY created_at DESC LIMIT 1
        )`,
        utlimaData: sql<string>`MAX(${crmWhatsappMensagens.createdAt})`,
        naoLidas: sql<number>`COUNT(*) FILTER (WHERE NOT ${crmWhatsappMensagens.lida} AND ${crmWhatsappMensagens.tipo} = 'RECEBIDA')`,
      })
      .from(crmWhatsappMensagens)
      .where(isNotNull(crmWhatsappMensagens.remoteJid))
      .groupBy(crmWhatsappMensagens.remoteJid)
      .orderBy(desc(sql`MAX(${crmWhatsappMensagens.createdAt})`))
      .limit(100)

    const remoteJids = whatsappGrouped.map((w) => w.remoteJid)

    const leads = remoteJids.length > 0
      ? await db
          .select({ id: crmLeads.id, nome: crmLeads.nome, idIntegracao: crmLeads.idIntegracao })
          .from(crmLeads)
          .where(sql`${crmLeads.idIntegracao} IN (${sql.join(remoteJids.map((j) => sql`${`whatsapp:${j}`}`), sql`, `)})`)
      : []

    const contatos = remoteJids.length > 0
      ? await db
          .select({ id: crmContatos.id, nome: crmContatos.nome, whatsapp: crmContatos.whatsapp, empresaId: crmContatos.empresaId, empresaNome: crmPessoas.razaoSocial })
          .from(crmContatos)
          .leftJoin(crmPessoas, eq(crmContatos.empresaId, crmPessoas.id))
          .where(sql`${crmContatos.whatsapp} IN (${sql.join(remoteJids.map((j) => sql`${j}`), sql`, `)})`)
      : []

    const whatsappChats = whatsappGrouped.map((w) => {
      const lead = leads.find((l) => l.idIntegracao === `whatsapp:${w.remoteJid}`)
      const contato = contatos.find((c) => c.whatsapp === w.remoteJid)
      const nome = lead?.nome || contato?.nome || contato?.empresaNome || w.remoteJid?.split("@")[0] || "WhatsApp"
      const id = parseInt(w.remoteJid.replace(/\D/g, "").slice(0, 15), 10) || 0
      return {
        id,
        fonte: "whatsapp",
        remoteJid: w.remoteJid,
        titulo: nome,
        tipo: "WHATSAPP",
        ultimaMensagem: w.ultimaMensagem,
        ultimaMensagemData: w.utlimaData,
        naoLidas: Number(w.naoLidas),
        participantes: 0,
        entidadeTipo: null,
        entidadeId: null,
        criadoPor: 0,
        updatedAt: w.utlimaData || new Date().toISOString(),
        createdAt: w.utlimaData || new Date().toISOString(),
      }
    })

    const merged = [...lista, ...whatsappChats].sort((a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    return NextResponse.json(merged)
  } catch (error) {
    console.error("[GET /api/chats]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const { session, userId } = auth

    const body = await req.json()
    const { titulo, mensagem, destinatarios, entidadeTipo, entidadeId } = body

    if (!titulo?.trim()) {
      return NextResponse.json({ error: "Título é obrigatório" }, { status: 400 })
    }
    if (!mensagem?.trim()) {
      return NextResponse.json({ error: "Mensagem é obrigatória" }, { status: 400 })
    }

    const participantes: number[] = []
    if (destinatarios === "todos") {
      const todos = await db.select({ id: usuarios.id }).from(usuarios).where(sql`ativo = true`)
      todos.forEach((u) => { if (u.id !== userId) participantes.push(u.id) })
    } else if (Array.isArray(destinatarios)) {
      participantes.push(...destinatarios.filter((id: number) => id !== userId))
    }

    const [chat] = await db
      .insert(chats)
      .values({
        tipo: entidadeTipo && entidadeId ? "VINCULADO" : "LIVRE",
        titulo: titulo.trim(),
        entidadeTipo: entidadeTipo || null,
        entidadeId: entidadeId ? parseInt(entidadeId) : null,
        criadoPor: userId,
      })
      .returning()

    const todosParticipantes = [userId, ...participantes]
    if (todosParticipantes.length > 0) {
      await db.insert(chatParticipantes).values(
        todosParticipantes.map((uid) => ({ chatId: chat.id, usuarioId: uid }))
      )
    }

    const [msg] = await db
      .insert(chatMensagens)
      .values({ chatId: chat.id, remetenteId: userId, mensagem: mensagem.trim() })
      .returning()

    await db
      .update(chatParticipantes)
      .set({ ultimaMensagemLidaId: msg.id })
      .where(and(eq(chatParticipantes.chatId, chat.id), eq(chatParticipantes.usuarioId, userId)))

    await db.insert(chatLeituras).values({ mensagemId: msg.id, usuarioId: userId })

    return NextResponse.json({ chat, mensagem: msg }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/chats]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}
