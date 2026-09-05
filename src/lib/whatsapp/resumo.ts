import { chamarIA } from "@/lib/ai"

export interface ResumoConversa {
  resumo: string
  turnos: number
  em?: string
}

const JANELA = 15
const LIMIAR_RESUMO = 24
const INTERVALO_RESUMO = 8

export function linhasAForaDaJanela(
  historico: Array<{ role: "user" | "assistant"; content: string }>,
  janela: number = JANELA
): Array<{ role: "user" | "assistant"; content: string }> {
  if (historico.length <= janela) return []
  return historico.slice(0, historico.length - janela)
}

export function precisaGerarResumo(
  historico: Array<{ role: "user" | "assistant"; content: string }>,
  resumo: ResumoConversa | undefined | null
): boolean {
  if (historico.length < LIMIAR_RESUMO) return false
  const turnos = typeof resumo?.turnos === "number" ? resumo.turnos : 0
  return historico.length - turnos >= INTERVALO_RESUMO
}

export function resumoAtual(resumo: ResumoConversa | undefined | null): string | undefined {
  if (!resumo || typeof resumo.resumo !== "string" || resumo.resumo.trim().length === 0) return undefined
  return resumo.resumo
}

export function promptResumo(
  historicoSegmento: Array<{ role: "user" | "assistant"; content: string }>,
  resumoAnterior: string | undefined
): string {
  const texto = historicoSegmento.map((m) => `${m.role === "assistant" ? "BOT" : "CLIENTE"}: ${m.content}`).join("\n")
  const anterior = resumoAnterior ? `Resumo anterior:\n${resumoAnterior}\n` : ""
  return `${anterior}Resuma a conversa de vendas abaixo em portugues, listando apenas os FATOS RELEVANTES que precisam ser lembrados nos proximos turnos (nome, tipo de pessoa, documento, empresa, linhas de interesse, pedidos pendentes de confirmacao), em no maximo 150 palavras, em forma de topicos curtos e objetivos.\n\nCONVERSA:\n${texto}`
}

export function extrairResumoDoConteudo(conteudo: string): string | undefined {
  const limpo = conteudo.trim()
  if (limpo.length === 0) return undefined
  const semFences = limpo.replace(/^```[\s\S]*?\n/, "").replace(/\n?```$/, "").trim()
  if (semFences.length === 0) return undefined
  return semFences.slice(0, 800)
}

export async function gerarResumoIA(
  segmento: Array<{ role: "user" | "assistant"; content: string }>,
  resumoAnterior: string | undefined
): Promise<string | undefined> {
  if (segmento.length === 0) return undefined
  try {
    const res = await chamarIA([{ role: "user", content: promptResumo(segmento, resumoAnterior) }], { temperatura: 0, maxTokens: 220 })
    return extrairResumoDoConteudo(res.conteudo)
  } catch (e) {
    console.error("[Resumo] erro ao gerar resumo:", e)
    return undefined
  }
}

export interface HistoricoIA {
  mensagens: Array<{ role: "user" | "assistant"; content: string }>
  segmentoParaResumo: Array<{ role: "user" | "assistant"; content: string }>
  resumoAnterior: string | undefined
  gerarResumo: boolean
}

export function prepararHistoricoIA(
  historico: Array<{ role: "user" | "assistant"; content: string }>,
  dados: Record<string, any>
): HistoricoIA {
  const resumo: ResumoConversa | undefined = dados?._resumo
  const anterior = resumoAtual(resumo)
  const gerarResumo = precisaGerarResumo(historico, resumo)

  if (!gerarResumo) {
    if (!anterior) {
      return { mensagens: historico, segmentoParaResumo: [], resumoAnterior: undefined, gerarResumo: false }
    }
    const mensagens = [
      { role: "assistant" as const, content: `[Resumo anterior] ${anterior}` },
      ...historico.slice(-JANELA),
    ]
    return { mensagens, segmentoParaResumo: [], resumoAnterior: anterior, gerarResumo: false }
  }

  const foraDaJanela = linhasAForaDaJanela(historico)
  const mensagens = [
    ...(anterior ? [{ role: "assistant" as const, content: `[Resumo anterior] ${anterior}` }] : []),
    ...historico.slice(-JANELA),
  ]
  return { mensagens, segmentoParaResumo: foraDaJanela, resumoAnterior: anterior, gerarResumo: true }
}