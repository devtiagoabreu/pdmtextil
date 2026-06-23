import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { solicitacoes } from "@/lib/db/schema/solicitacoes"
import { sql, desc } from "drizzle-orm"
import { getStatusMap } from "@/lib/status-utils"
export const dynamic = "force-dynamic"

function calcularDias(ms: number): string {
  const horas = ms / (1000 * 60 * 60)
  const dias = Math.floor(horas / 24)
  const h = Math.round(horas % 24)
  if (dias > 0) return `${dias}d ${h}h`
  return `${h}h`
}

function processarTimeline(historico: any[], statusAtual: string, dataConclusao: string | null, labelsMap: Map<string, string>) {
  const entries = [...(historico || [])].sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
  )

  const timeline: {
    status: string
    statusLabel: string
    entrada: string
    saida: string | null
    duracaoMs: number | null
    duracaoLabel: string
  }[] = []

  let currentStatus = "PENDENTE"
  let currentStart: string | null = null

  function getLabel(nome: string) {
    return labelsMap.get(nome) || nome
  }

  for (const entry of entries) {
    if (entry.acao === "CRIACAO") {
      currentStart = entry.data
    } else if (entry.acao === "MUDANCA_STATUS") {
      if (currentStart && entry.de) {
        const duracao = new Date(entry.data).getTime() - new Date(currentStart).getTime()
        timeline.push({
          status: entry.de,
          statusLabel: getLabel(entry.de),
          entrada: currentStart,
          saida: entry.data,
          duracaoMs: duracao,
          duracaoLabel: calcularDias(duracao),
        })
      }
      currentStart = entry.data
      currentStatus = entry.para || currentStatus
    }
  }

  // Último status (atual)
  if (currentStart) {
    const finalizado = statusAtual === "CONCLUIDO" || statusAtual === "CONCLUIDO_DEV" || statusAtual === "APROVADO_CLI"
    const fim = finalizado && dataConclusao
      ? dataConclusao
      : new Date().toISOString()
    const duracao = new Date(fim).getTime() - new Date(currentStart).getTime()
    timeline.push({
      status: statusAtual,
      statusLabel: getLabel(statusAtual),
      entrada: currentStart,
      saida: finalizado ? fim : null,
      duracaoMs: duracao,
      duracaoLabel: calcularDias(duracao),
    })
  }

  return timeline
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    const url = new URL(req.url)
    const dataInicio = url.searchParams.get("dataInicio")
    const dataFim = url.searchParams.get("dataFim")
    const statusFiltro = url.searchParams.get("status")

    const conditions: any[] = []
    if (dataInicio) conditions.push(sql`${solicitacoes.createdAt} >= ${dataInicio}::timestamp`)
    if (dataFim) conditions.push(sql`${solicitacoes.createdAt} <= ${dataFim}::timestamp`)
    if (statusFiltro) conditions.push(sql`${solicitacoes.status} = ${statusFiltro}`)

    const where = conditions.length > 0 ? sql`${conditions.join(" AND ")}` : undefined

    const rows = await db
      .select({
        id: solicitacoes.id,
        cliente: solicitacoes.cliente,
        tipo: solicitacoes.tipo,
        status: solicitacoes.status,
        historico: solicitacoes.historicoComunicacao,
        dataConclusao: solicitacoes.dataConclusao,
        createdAt: solicitacoes.createdAt,
      })
      .from(solicitacoes)
      .where(where)
      .orderBy(desc(solicitacoes.createdAt))

    const statusMap = await getStatusMap("SOLICITACAO_DESENVOLVIMENTO")
    const labelsMap = new Map<string, string>()
    for (const [k, v] of statusMap) labelsMap.set(k, v.rotulo || k)

    const resultados = rows.map((r) => {
      const timeline = processarTimeline(
        r.historico as any[],
        r.status,
        r.dataConclusao ? r.dataConclusao.toISOString() : null,
        labelsMap
      )

      const tempoTotalMs = timeline.reduce((acc, t) => acc + (t.duracaoMs ?? 0), 0)
      const trocasStatus = timeline.length

      return {
        id: r.id,
        cliente: r.cliente,
        tipo: r.tipo,
        statusAtual: r.status,
        statusAtualLabel: labelsMap.get(r.status) || r.status,
        criadoEm: r.createdAt?.toISOString() || null,
        concluidoEm: r.dataConclusao?.toISOString() || null,
        tempoTotalLabel: calcularDias(tempoTotalMs),
        tempoTotalHoras: Math.round(tempoTotalMs / (1000 * 60 * 60) * 100) / 100,
        trocasStatus,
        timeline,
      }
    })

    // Agregados
    const stats = {
      totalSolicitacoes: resultados.length,
      concluidas: resultados.filter((r) => r.statusAtual === "CONCLUIDO" || r.statusAtual === "CONCLUIDO_DEV" || r.statusAtual === "APROVADO_CLI").length,
      tempoMedioHoras: resultados.length > 0
        ? Math.round(resultados.reduce((a, r) => a + r.tempoTotalHoras, 0) / resultados.length * 100) / 100
        : 0,
      mediaTrocasStatus: resultados.length > 0
        ? Math.round(resultados.reduce((a, r) => a + r.trocasStatus, 0) / resultados.length * 100) / 100
        : 0,
    }

    return NextResponse.json({ resultados, stats })
  } catch (error) {
    console.error("[GET /api/relatorios/tempo-status]", error)
    return NextResponse.json({
      error: "Erro interno",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
