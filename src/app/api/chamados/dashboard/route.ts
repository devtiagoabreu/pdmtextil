import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { tickets } from "@/lib/db/schema/chamados"
import { procAreas } from "@/lib/db/schema/processos"
import { usuarios } from "@/lib/db/schema/usuarios"
import { alias } from "drizzle-orm/pg-core"
import { count, eq, desc, and, gte, lte, notInArray } from "drizzle-orm"
import { prazoEstourado } from "@/lib/chamados/sla"

const solicitante = alias(usuarios, "solicitante")

const ABERTOS = ["ABERTO", "EM_ANDAMENTO", "AGUARDANDO", "REABERTO"]

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth()
    if (auth instanceof NextResponse) return auth

    const agora = new Date()
    const primeiroDia = new Date(agora.getFullYear(), agora.getMonth(), 1)

    const abertos = await db
      .select({
        id: tickets.id,
        status: tickets.status,
        prioridade: tickets.prioridade,
        slaPrimeiraRespostaPrazo: tickets.slaPrimeiraRespostaPrazo,
        slaResolucaoPrazo: tickets.slaResolucaoPrazo,
        primeiraRespostaEm: tickets.primeiraRespostaEm,
        areaId: tickets.areaId,
        areaNome: procAreas.nome,
        responsavelId: tickets.responsavelId,
      })
      .from(tickets)
      .leftJoin(procAreas, eq(tickets.areaId, procAreas.id))
      .where(notInArray(tickets.status, ["FECHADO", "CANCELADO"]))

    const [rResolvidos] = await db
      .select({ n: count() })
      .from(tickets)
      .where(and(gte(tickets.resolvidoEm, primeiroDia), lte(tickets.resolvidoEm, agora)))
    const [rFechados] = await db
      .select({ n: count() })
      .from(tickets)
      .where(and(gte(tickets.fechadoEm, primeiroDia), lte(tickets.fechadoEm, agora)))
    const [rCancelados] = await db
      .select({ n: count() })
      .from(tickets)
      .where(and(eq(tickets.status, "CANCELADO"), gte(tickets.updatedAt, primeiroDia)))

    const recentes = await db
      .select({
        id: tickets.id,
        titulo: tickets.titulo,
        status: tickets.status,
        prioridade: tickets.prioridade,
        categoria: tickets.categoria,
        areaNome: procAreas.nome,
        solicitanteNome: solicitante.name,
        createdAt: tickets.createdAt,
      })
      .from(tickets)
      .leftJoin(procAreas, eq(tickets.areaId, procAreas.id))
      .leftJoin(solicitante, eq(tickets.solicitanteId, solicitante.id))
      .where(eq(tickets.ativo, true))
      .orderBy(desc(tickets.createdAt))
      .limit(8)

    const porStatus: Record<string, number> = {}
    const porPrioridade: Record<string, number> = {}
    const filasMap = new Map<
      number | null,
      { areaId: number | null; areaNome: string; total: number; vencidos: number }
    >()
    let vencidosPrimeiraResposta = 0
    let vencidosResolucao = 0
    let semResponsavel = 0

    for (const t of abertos) {
      porStatus[t.status] = (porStatus[t.status] || 0) + 1
      porPrioridade[t.prioridade] = (porPrioridade[t.prioridade] || 0) + 1
      if (t.responsavelId === null || t.responsavelId === undefined) semResponsavel++
      if (prazoEstourado(t.slaPrimeiraRespostaPrazo, agora) && !t.primeiraRespostaEm) {
        vencidosPrimeiraResposta++
      }
      if (prazoEstourado(t.slaResolucaoPrazo, agora)) vencidosResolucao++

      const key = t.areaId
      const fila = filasMap.get(key) || {
        areaId: key,
        areaNome: t.areaNome || "Sem área",
        total: 0,
        vencidos: 0,
      }
      fila.total++
      if (prazoEstourado(t.slaResolucaoPrazo, agora)) fila.vencidos++
      filasMap.set(key, fila)
    }

    return NextResponse.json({
      totais: {
        abertos: abertos.length,
        ativosPorStatus: porStatus,
        porPrioridade,
        semResponsavel,
        vencidosPrimeiraResposta,
        vencidosResolucao,
        resolvidosMes: rResolvidos.n,
        fechadosMes: rFechados.n,
        canceladosMes: rCancelados.n,
      },
      porFila: [...filasMap.values()].sort((a, b) => b.total - a.total),
      recentes,
    })
  } catch (error) {
    console.error("[GET /api/chamados/dashboard]", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}