import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { tickets, ticketMensagens } from "@/lib/db/schema/chamados"
import { procAreas, procProcessos } from "@/lib/db/schema/processos"
import { usuarios } from "@/lib/db/schema/usuarios"
import { ativos } from "@/lib/db/schema/ativos"
import { alias } from "drizzle-orm/pg-core"
import { eq, asc } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { chamadoSchema } from "@/lib/validation"
import { calcularSLA } from "@/lib/chamados/sla"
import type { ChamadoPrioridade } from "@/lib/db/schema/chamados"

const responsavel = alias(usuarios, "responsavel")
const solicitante = alias(usuarios, "solicitante")
const autorMsg = alias(usuarios, "autor_msg")

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { id } = await params

    const [registro] = await db
      .select({
        id: tickets.id,
        titulo: tickets.titulo,
        descricao: tickets.descricao,
        categoria: tickets.categoria,
        status: tickets.status,
        prioridade: tickets.prioridade,
        areaId: tickets.areaId,
        areaNome: procAreas.nome,
        solicitanteId: tickets.solicitanteId,
        solicitanteNome: solicitante.name,
        responsavelId: tickets.responsavelId,
        responsavelNome: responsavel.name,
        ativoId: tickets.ativoId,
        ativoNome: ativos.nome,
        ativoCodigo: ativos.codigo,
        processoId: tickets.processoId,
        processoNome: procProcessos.nome,
        slaPrimeiraRespostaPrazo: tickets.slaPrimeiraRespostaPrazo,
        slaResolucaoPrazo: tickets.slaResolucaoPrazo,
        primeiraRespostaEm: tickets.primeiraRespostaEm,
        resolvidoEm: tickets.resolvidoEm,
        fechadoEm: tickets.fechadoEm,
        anexos: tickets.anexos,
        ativo: tickets.ativo,
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
      })
      .from(tickets)
      .leftJoin(procAreas, eq(tickets.areaId, procAreas.id))
      .leftJoin(solicitante, eq(tickets.solicitanteId, solicitante.id))
      .leftJoin(responsavel, eq(tickets.responsavelId, responsavel.id))
      .leftJoin(ativos, eq(tickets.ativoId, ativos.id))
      .leftJoin(procProcessos, eq(tickets.processoId, procProcessos.id))
      .where(eq(tickets.id, parseInt(id)))
      .limit(1)

    if (!registro) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 })
    }

    const mensagens = await db
      .select({
        id: ticketMensagens.id,
        ticketId: ticketMensagens.ticketId,
        autorId: ticketMensagens.autorId,
        autorNome: autorMsg.name,
        tipo: ticketMensagens.tipo,
        mensagem: ticketMensagens.mensagem,
        anexos: ticketMensagens.anexos,
        createdAt: ticketMensagens.createdAt,
      })
      .from(ticketMensagens)
      .leftJoin(autorMsg, eq(ticketMensagens.autorId, autorMsg.id))
      .where(eq(ticketMensagens.ticketId, registro.id))
      .orderBy(asc(ticketMensagens.createdAt))

    return NextResponse.json({ ...registro, mensagens })
  } catch (error) {
    console.error("[GET /api/chamados/[id]]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const { id } = await params
    const body = await req.json()
    const parsed = validateRequest(chamadoSchema, body)
    if ("error" in parsed) return parsed.error

    const [existente] = await db
      .select()
      .from(tickets)
      .where(eq(tickets.id, parseInt(id)))
      .limit(1)

    if (!existente) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 })
    }

    if (["FECHADO", "CANCELADO"].includes(existente.status)) {
      return NextResponse.json(
        { error: "Chamado fechado ou cancelado não pode ser editado" },
        { status: 400 }
      )
    }

    const prioridadeMudou = existente.prioridade !== parsed.data.prioridade
    const sla = prioridadeMudou
      ? calcularSLA(parsed.data.prioridade as ChamadoPrioridade)
      : {
          primeiraRespostaPrazo: existente.slaPrimeiraRespostaPrazo,
          resolucaoPrazo: existente.slaResolucaoPrazo,
        }

    const [atualizada] = await db
      .update(tickets)
      .set({
        titulo: parsed.data.titulo,
        descricao: parsed.data.descricao,
        categoria: parsed.data.categoria,
        prioridade: parsed.data.prioridade,
        areaId: parsed.data.areaId,
        ativoId: parsed.data.ativoId || null,
        processoId: parsed.data.processoId || null,
        anexos: parsed.data.anexos || [],
        slaPrimeiraRespostaPrazo: sla.primeiraRespostaPrazo,
        slaResolucaoPrazo: sla.resolucaoPrazo,
        updatedAt: new Date(),
      })
      .where(eq(tickets.id, parseInt(id)))
      .returning()

    await registrarLog({
      tipo: "ATUALIZACAO",
      acao: "atualizar",
      descricao: `Chamado #${id} atualizado`,
      entidade: "Chamado",
      entidadeId: atualizada.id,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(atualizada)
  } catch (error) {
    return handleApiError(error, "PUT /api/chamados/[id]")
  }
}