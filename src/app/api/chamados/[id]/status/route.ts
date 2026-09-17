import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { tickets } from "@/lib/db/schema/chamados"
import { eq } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { chamadoStatusSchema } from "@/lib/validation"
import { chamadoStatusLabel } from "@/lib/chamados/constantes"
import { notificarChamado } from "@/lib/chamados/notificar"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const body = await req.json()
    const parsed = validateRequest(chamadoStatusSchema, body)
    if ("error" in parsed) return parsed.error

    const [ticket] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, parseInt(id)))
      .limit(1)

    if (!ticket) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 })
    }

    const novoStatus = parsed.data.status
    if (ticket.status === "FECHADO" && novoStatus !== "REABERTO") {
      return NextResponse.json(
        { error: "Chamado fechado só pode ser reaberto" },
        { status: 400 }
      )
    }

    const update: Record<string, unknown> = { status: novoStatus, updatedAt: new Date() }
    if (novoStatus === "RESOLVIDO") {
      update.resolvidoEm = new Date()
      update.fechadoEm = null
    }
    if (novoStatus === "FECHADO") {
      update.fechadoEm = new Date()
    }
    if (novoStatus === "REABERTO") {
      update.resolvidoEm = null
      update.fechadoEm = null
      update.status = "REABERTO"
    }

    const [atualizado] = await db
      .update(tickets)
      .set(update)
      .where(eq(tickets.id, ticket.id))
      .returning()

    const label = chamadoStatusLabel(novoStatus)
    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar_status",
      descricao: `Chamado #${ticket.id} → ${label}`,
      entidade: "Chamado",
      entidadeId: ticket.id,
      usuarioNome: session.user.name,
    })

    await notificarChamado({
      tipo: "CHAMADO",
      mensagem: `Chamado #${ticket.id} "${ticket.titulo}" agora está ${label.toLowerCase()}`,
      link: `/chamados/${ticket.id}`,
      usuarioId: ticket.solicitanteId,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizado)
  } catch (error) {
    return handleApiError(error, "PATCH /api/chamados/[id]/status")
  }
}