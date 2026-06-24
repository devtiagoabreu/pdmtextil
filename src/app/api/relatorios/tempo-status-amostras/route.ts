import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"
import { sql } from "drizzle-orm"
export const dynamic = "force-dynamic"

const STATUS_LABELS: Record<string, string> = {
  PENDENTE: "Pendente",
  APROVADO: "Aprovado",
  REPROVADA: "Reprovada",
}

function calcDias(ms: number): string {
  const horas = ms / (1000 * 60 * 60)
  const dias = Math.floor(horas / 24)
  const h = Math.round(horas % 24)
  if (dias > 0) return `${dias}d ${h}h`
  return `${h}h`
}

function processarTimeline(historico: any[], statusAtual: string) {
  const entries = [...(historico || [])].sort(
    (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime()
  )

  const timeline: {
    status: string
    statusLabel: string
    entrada: string
    saida: string | null
    duracaoMs: number
    duracaoLabel: string
  }[] = []

  let currentStatus = "PENDENTE"
  let currentStart: string | null = null

  for (const entry of entries) {
    if (entry.acao === "CRIACAO") {
      currentStart = entry.data
      currentStatus = entry.status || "PENDENTE"
    } else if (entry.acao === "MUDANCA_STATUS") {
      if (currentStart && entry.de) {
        const duracao = new Date(entry.data).getTime() - new Date(currentStart).getTime()
        timeline.push({
          status: entry.de,
          statusLabel: STATUS_LABELS[entry.de] || entry.de,
          entrada: currentStart,
          saida: entry.data,
          duracaoMs: duracao,
          duracaoLabel: calcDias(duracao),
        })
      }
      currentStart = entry.data
      currentStatus = entry.para || currentStatus
    }
  }

  // Último status (atual)
  if (currentStart) {
    const fim = new Date().toISOString()
    const duracao = new Date(fim).getTime() - new Date(currentStart).getTime()
    timeline.push({
      status: statusAtual,
      statusLabel: STATUS_LABELS[statusAtual] || statusAtual,
      entrada: currentStart,
      saida: null,
      duracaoMs: duracao,
      duracaoLabel: calcDias(duracao),
    })
  }

  return timeline
}

async function q(sqlFragment: ReturnType<typeof sql>, fallback: any = null) {
  try {
    return await db.execute(sqlFragment)
  } catch (e) {
    console.error("[DB]", e)
    return fallback
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 })

    // Fetch tecido cru amostras with historico
    const cruRows = await q(sql`
      SELECT
        am.id, am.descricao, am.status, am.historico,
        am.created_at as "createdAt",
        p.codigo_pdm as "produtoCodigo", p.descricao as "produtoDescricao"
      FROM produto_cru_amostra am
      JOIN produtos_cru p ON p.id = am.produto_cru_id
      ORDER BY am.created_at DESC
    `)

    // Fetch acabamento amostras with historico
    const acabRows = await q(sql`
      SELECT
        aam.id, aam.descricao, aam.status, aam.historico,
        aam.created_at as "createdAt",
        p.codigo_pdm as "produtoCodigo", p.descricao as "produtoDescricao",
        ac.descricao as "acabamentoDescricao"
      FROM produto_cru_acabamento_amostra aam
      JOIN produto_cru_acabamento ac ON ac.id = aam.acabamento_id
      JOIN produtos_cru p ON p.id = ac.produto_cru_id
      ORDER BY aam.created_at DESC
    `)

    const tecidoCru = Array.isArray(cruRows) ? cruRows : []
    const acabamento = Array.isArray(acabRows) ? acabRows : []

    function processar(items: any[], tipoAmostra: string) {
      return items.map((r: any) => {
        const historico = typeof r.historico === "string" ? JSON.parse(r.historico) : (r.historico || [])
        const timeline = processarTimeline(historico, r.status)
        const tempoTotalMs = timeline.reduce((a: number, t: any) => a + (t.duracaoMs ?? 0), 0)
        return {
          id: r.id,
          descricao: r.descricao,
          statusAtual: r.status,
          statusLabel: STATUS_LABELS[r.status] || r.status,
          produtoCodigo: r.produtoCodigo,
          produtoDescricao: r.produtoDescricao,
          acabamentoDescricao: r.acabamentoDescricao || null,
          tipoAmostra,
          criadoEm: r.createdAt ? new Date(r.createdAt).toISOString() : null,
          tempoTotalLabel: calcDias(tempoTotalMs),
          tempoTotalMs,
          trocasStatus: timeline.length - 1,
          timeline,
        }
      })
    }

    const tecidoCruProcessados = processar(tecidoCru, "TECIDO_CRU")
    const acabamentoProcessados = processar(acabamento, "ACABAMENTO")

    return NextResponse.json({
      tecidoCru: tecidoCruProcessados,
      acabamento: acabamentoProcessados,
      stats: {
        total: tecidoCruProcessados.length + acabamentoProcessados.length,
        totalTecidoCru: tecidoCruProcessados.length,
        totalAcabamento: acabamentoProcessados.length,
        pendentes: [...tecidoCruProcessados, ...acabamentoProcessados].filter((r) => r.statusAtual === "PENDENTE").length,
        aprovadas: [...tecidoCruProcessados, ...acabamentoProcessados].filter((r) => r.statusAtual === "APROVADO").length,
        reprovadas: [...tecidoCruProcessados, ...acabamentoProcessados].filter((r) => r.statusAtual === "REPROVADA").length,
      },
    })
  } catch (error) {
    console.error("[GET /api/relatorios/tempo-status-amostras]", error)
    return NextResponse.json({
      error: "Erro interno",
      detail: error instanceof Error ? error.message : String(error),
    }, { status: 500 })
  }
}
