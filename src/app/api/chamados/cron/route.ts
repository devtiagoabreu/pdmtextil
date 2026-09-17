import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { tickets, ticketMensagens } from "@/lib/db/schema/chamados"
import { eq, inArray, notInArray } from "drizzle-orm"
import { prazoEstourado } from "@/lib/chamados/sla"
import { notificarChamado } from "@/lib/chamados/notificar"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const MSG_PRIMEIRA_RESPOSTA = "SLA_ALERTA_PRIMEIRA_RESPOSTA"
const MSG_RESOLUCAO = "SLA_ALERTA_RESOLUCAO"

type TicketSlaRow = {
  id: number
  titulo: string
  status: string
  slaPrimeiraRespostaPrazo: Date | null
  slaResolucaoPrazo: Date | null
  primeiraRespostaEm: Date | null
  solicitanteId: number
}

type MensagemExistente = { ticketId: number; mensagem: string }

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET
    const session = await getServerSession(authOptions).catch(() => null)
    const isAdmin =
      session &&
      (session.user.role === "ADMIN" || session.user.role === "SUDO" || session.user.role === "CRM")
    if (!(cronSecret && authHeader === `Bearer ${cronSecret}`) && !isAdmin) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const agora = new Date()
    const abertos: TicketSlaRow[] = await db
      .select({
        id: tickets.id,
        titulo: tickets.titulo,
        status: tickets.status,
        slaPrimeiraRespostaPrazo: tickets.slaPrimeiraRespostaPrazo,
        slaResolucaoPrazo: tickets.slaResolucaoPrazo,
        primeiraRespostaEm: tickets.primeiraRespostaEm,
        solicitanteId: tickets.solicitanteId,
      })
      .from(tickets)
      .where(notInArray(tickets.status, ["FECHADO", "CANCELADO"]))

    if (abertos.length === 0) {
      return NextResponse.json({ verificados: 0, mensagensCriadas: 0 })
    }

    const ids = abertos.map((t) => t.id)
    const existentes: MensagemExistente[] = await db
      .select({ ticketId: ticketMensagens.ticketId, mensagem: ticketMensagens.mensagem })
      .from(ticketMensagens)
      .where(
        inArray(
          ticketMensagens.mensagem,
          [MSG_PRIMEIRA_RESPOSTA, MSG_RESOLUCAO].map((m) => `[SLA] ${m}`)
        )
      )

    const jaSinalizados = new Set(
      existentes.map((e) => `${e.ticketId}|${e.mensagem}`)
    )

    const novas: { ticketId: number; mensagem: string }[] = []
    for (const t of abertos) {
      if (prazoEstourado(t.slaPrimeiraRespostaPrazo, agora) && !t.primeiraRespostaEm) {
        if (!jaSinalizados.has(`${t.id}|[SLA] ${MSG_PRIMEIRA_RESPOSTA}`)) {
          novas.push({ ticketId: t.id, mensagem: `[SLA] ${MSG_PRIMEIRA_RESPOSTA}` })
        }
      }
      if (prazoEstourado(t.slaResolucaoPrazo, agora)) {
        if (!jaSinalizados.has(`${t.id}|[SLA] ${MSG_RESOLUCAO}`)) {
          novas.push({ ticketId: t.id, mensagem: `[SLA] ${MSG_RESOLUCAO}` })
        }
      }
    }

    if (novas.length > 0) {
      await db.insert(ticketMensagens).values(
        novas.map((n) => ({
          ticketId: n.ticketId,
          tipo: "SISTEMA",
          mensagem: n.mensagem,
          anexos: [],
        }))
      )

      const idsNotificar = new Set<number>()
      for (const n of novas) {
        const t = abertos.find((a) => a.id === n.ticketId)
        if (t) idsNotificar.add(t.solicitanteId)
      }
      for (const usuarioId of idsNotificar) {
        await notificarChamado({
          tipo: "CHAMADO",
          mensagem: "Atenção: um chamado seu estourou o prazo de SLA",
          link: "/chamados",
          usuarioId,
        })
      }
    }

    return NextResponse.json({ verificados: abertos.length, mensagensCriadas: novas.length })
  } catch (error) {
    console.error("[POST /api/chamados/cron]", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}