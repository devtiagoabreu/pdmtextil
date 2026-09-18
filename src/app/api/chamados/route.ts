import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { tickets } from "@/lib/db/schema/chamados"
import { procAreas, procProcessos } from "@/lib/db/schema/processos"
import { usuarios } from "@/lib/db/schema/usuarios"
import { ativos } from "@/lib/db/schema/ativos"
import { alias } from "drizzle-orm/pg-core"
import { eq, desc, and, type SQLWrapper } from "drizzle-orm"
import { registrarLog } from "@/lib/notificar"
import { handleApiError } from "@/lib/api-error"
import { validateRequest } from "@/lib/validation"
import { chamadoSchema } from "@/lib/validation"
import { calcularSLA } from "@/lib/chamados/sla"
import { notificarChamado } from "@/lib/chamados/notificar"
import type { ChamadoPrioridade } from "@/lib/db/schema/chamados"

const responsavel = alias(usuarios, "responsavel")
const solicitante = alias(usuarios, "solicitante")

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const { searchParams } = req.nextUrl
    const status = searchParams.get("status")
    const prioridade = searchParams.get("prioridade")
    const categoria = searchParams.get("categoria")
    const areaId = searchParams.get("areaId")
    const ativoId = searchParams.get("ativoId")
    const solicitanteId = searchParams.get("solicitanteId")
    const responsavelId = searchParams.get("responsavelId")
    const minhasFilas = searchParams.get("minhasFilas") === "true"

    const condicoes: SQLWrapper[] = [eq(tickets.ativo, true)]
    if (status) condicoes.push(eq(tickets.status, status))
    if (prioridade) condicoes.push(eq(tickets.prioridade, prioridade))
    if (categoria) condicoes.push(eq(tickets.categoria, categoria))
    if (areaId) condicoes.push(eq(tickets.areaId, parseInt(areaId)))
    if (ativoId) condicoes.push(eq(tickets.ativoId, parseInt(ativoId)))
    if (solicitanteId) condicoes.push(eq(tickets.solicitanteId, parseInt(solicitanteId)))
    if (responsavelId) condicoes.push(eq(tickets.responsavelId, parseInt(responsavelId)))

    const lista = await db
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
        createdAt: tickets.createdAt,
        updatedAt: tickets.updatedAt,
      })
      .from(tickets)
      .leftJoin(procAreas, eq(tickets.areaId, procAreas.id))
      .leftJoin(solicitante, eq(tickets.solicitanteId, solicitante.id))
      .leftJoin(responsavel, eq(tickets.responsavelId, responsavel.id))
      .leftJoin(ativos, eq(tickets.ativoId, ativos.id))
      .leftJoin(procProcessos, eq(tickets.processoId, procProcessos.id))
      .where(condicoes.length > 0 ? and(...condicoes) : undefined)
      .orderBy(desc(tickets.createdAt))

    if (minhasFilas && auth.userId) {
      return NextResponse.json(
        lista.filter(
          (t: { responsavelId: number | null }) => t.responsavelId === auth.userId
        )
      )
    }

    return NextResponse.json(lista)
  } catch (error) {
    console.error("[GET /api/chamados]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth
    const session = auth.session

    const body = await req.json()
    const parsed = validateRequest(chamadoSchema, body)
    if ("error" in parsed) return parsed.error

    if (parsed.data.processoId) {
      const [processo] = await db
        .select({ areaId: procProcessos.areaId })
        .from(procProcessos)
        .where(eq(procProcessos.id, parsed.data.processoId))
        .limit(1)
      if (!processo) {
        return NextResponse.json({ error: "Processo não encontrado" }, { status: 400 })
      }
      if (processo.areaId !== parsed.data.areaId) {
        return NextResponse.json(
          { error: "O processo deve pertencer à fila (área) selecionada" },
          { status: 400 }
        )
      }
    }

    const sla = calcularSLA(parsed.data.prioridade as ChamadoPrioridade)

    const [nova] = await db
      .insert(tickets)
      .values({
        titulo: parsed.data.titulo,
        descricao: parsed.data.descricao,
        categoria: parsed.data.categoria,
        prioridade: parsed.data.prioridade,
        areaId: parsed.data.areaId,
        solicitanteId: auth.userId,
        ativoId: parsed.data.ativoId || null,
        processoId: parsed.data.processoId || null,
        slaPrimeiraRespostaPrazo: sla.primeiraRespostaPrazo,
        slaResolucaoPrazo: sla.resolucaoPrazo,
        anexos: parsed.data.anexos || [],
      })
      .returning()

    await registrarLog({
      tipo: "CADASTRO",
      acao: "criar",
      descricao: `Chamado criado: #${nova.id} ${nova.titulo}`,
      entidade: "Chamado",
      entidadeId: nova.id,
      usuarioNome: session.user.name,
    })

    await notificarChamado({
      tipo: "CHAMADO",
      mensagem: `Chamado #${nova.id} cadastrado: ${nova.titulo}`,
      link: `/chamados/${nova.id}`,
      usuarioId: nova.solicitanteId,
      usuarioNome: session.user.name,
    })

    return NextResponse.json(nova, { status: 201 })
  } catch (error) {
    return handleApiError(error, "POST /api/chamados")
  }
}