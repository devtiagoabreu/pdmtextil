import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { tickets, ticketMensagens } from "@/lib/db/schema/chamados"
import { eq } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { chamadoMensagemSchema } from "@/lib/validation"
import { notificarChamado } from "@/lib/chamados/notificar"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const body = await req.json()
    const parsed = validateRequest(chamadoMensagemSchema, body)
    if ("error" in parsed) return parsed.error

    if (parsed.data.tipo === "SISTEMA") {
      return NextResponse.json({ error: "Mensagens de sistema são controladas pelo cron" }, { status: 400 })
    }

    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, parseInt(id)))
      .limit(1)

    if (!ticket) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 })
    }

    let comentarioPai: { autorId: number | null } | undefined
    if (parsed.data.respostaAId) {
      const [pai] = await db
        .select({ id: ticketMensagens.id, ticketId: ticketMensagens.ticketId, autorId: ticketMensagens.autorId })
        .from(ticketMensagens)
        .where(eq(ticketMensagens.id, parsed.data.respostaAId))
        .limit(1)
      if (!pai) {
        return NextResponse.json({ error: "Comentário pai não encontrado" }, { status: 400 })
      }
      if (pai.ticketId !== ticket.id) {
        return NextResponse.json(
          { error: "Comentário pai não pertence a este chamado" },
          { status: 400 }
        )
      }
      comentarioPai = { autorId: pai.autorId }
    }

    const [mensagem] = await db
      .insert(ticketMensagens)
      .values({
        ticketId: ticket.id,
        autorId: auth.userId,
        tipo: parsed.data.tipo || "RESPOSTA",
        mensagem: parsed.data.mensagem,
        respostaAId: parsed.data.respostaAId || null,
        anexos: parsed.data.anexos || [],
      })
      .returning()

    const primeiraResposta = parsed.data.tipo !== "NOTA" && !ticket.primeiraRespostaEm
    if (primeiraResposta) {
      const update: Record<string, unknown> = {
        primeiraRespostaEm: new Date(),
        updatedAt: new Date(),
      }
      if (["ABERTO", "REABERTO"].includes(ticket.status)) {
        update.status = "EM_ANDAMENTO"
      }
      if (ticket.responsavelId === null && ticket.solicitanteId !== auth.userId) {
        update.responsavelId = auth.userId
      }
      await db.update(tickets).set(update).where(eq(tickets.id, ticket.id))
    }

    await registrarLog({
      tipo: "CADASTRO",
      acao: "responder",
      descricao: `Mensagem adicionada ao chamado #${ticket.id}`,
      entidade: "Chamado",
      entidadeId: ticket.id,
      usuarioNome: session.user.name,
    })

    if (parsed.data.tipo !== "NOTA") {
      await notificarChamado({
        tipo: "CHAMADO",
        mensagem: `Nova resposta no chamado #${ticket.id}: ${ticket.titulo}`,
        link: `/chamados/${ticket.id}`,
        usuarioId: ticket.solicitanteId,
        usuarioNome: session.user.name,
      })

      if (
        comentarioPai?.autorId &&
        comentarioPai.autorId !== auth.userId &&
        comentarioPai.autorId !== ticket.solicitanteId
      ) {
        await notificarChamado({
          tipo: "CHAMADO",
          mensagem: `Nova resposta ao seu comentário no chamado #${ticket.id}: ${ticket.titulo}`,
          link: `/chamados/${ticket.id}`,
          usuarioId: comentarioPai.autorId,
          usuarioNome: session.user.name,
        })
      }
    }

    return NextResponse.json(mensagem, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/chamados/[id]/mensagens")
  }
}