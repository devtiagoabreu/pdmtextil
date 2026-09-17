import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { tickets } from "@/lib/db/schema/chamados"
import { eq } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { chamadoAssumirSchema } from "@/lib/validation"
import { notificarChamado } from "@/lib/chamados/notificar"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params

    let responsavelId = auth.userId
    const body = await req.json().catch(() => null)
    if (body && typeof body === "object" && Object.keys(body).length > 0) {
      const parsed = validateRequest(chamadoAssumirSchema, body)
      if ("error" in parsed) return parsed.error
      responsavelId = parsed.data.responsavelId ?? auth.userId
    }

    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, parseInt(id)))
      .limit(1)

    if (!ticket) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 })
    }

    const update: Record<string, unknown> = { responsavelId, updatedAt: new Date() }
    if (["ABERTO", "REABERTO"].includes(ticket.status)) {
      update.status = "EM_ANDAMENTO"
    }

    const [atualizado] = await db
      .update(tickets)
      .set(update)
      .where(eq(tickets.id, ticket.id))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "assumir",
      descricao: `Chamado #${ticket.id} assumido por ${session.user.name}`,
      entidade: "Chamado",
      entidadeId: ticket.id,
      usuarioNome: session.user.name,
    })

    if (ticket.solicitanteId !== responsavelId) {
      await notificarChamado({
        tipo: "CHAMADO",
        mensagem: `Chamado #${ticket.id} "${ticket.titulo}" assumido por ${session.user.name}`,
        link: `/chamados/${ticket.id}`,
        usuarioId: ticket.solicitanteId,
        usuarioNome: session.user.name,
      })
    }

    return NextResponse.json(atualizado)
  } catch (error) {
    return handleApiError(error, "POST /api/chamados/[id]/assumir")
  }
}