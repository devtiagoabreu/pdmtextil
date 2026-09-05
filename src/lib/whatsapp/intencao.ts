import { chamarIA } from "@/lib/ai"
import { pediuAtendente as regexPediuAtendente, pediuReiniciar as regexPediuReiniciar } from "./validation"

export interface EscalacaoIntencao {
  querAtendente: boolean
  querReiniciar: boolean
  via: "regex" | "llm"
}

const GATE_ESCALACAO =
  /\b(falar com|quero falar|queria falar|preciso falar|conversar com|quero conversar|atendente|atendimento|humano|alguem|alguma pessoa|uma pessoa|pessoa|representante|suporte|admin|gerente|me atender|ligar|manda alguem|quem pode me atender|reiniciar|recomecar|recomeçar|resetar|reset|limpar|do zero|voltar ao inicio|voltar ao início|volta ao inicio|volta ao início|comecar de novo|começar de novo|começar do zero|ajuda)\b/i

const GATE_LINHAS = /\b(linha|linhas|interessad|tenho interesse|quero|gostaria|todos|todas|tudo|qualquer|catalogo|catalog|vou querer|poderia me enviar|me manda)\b/i

export function parecePedidoEscalacao(texto: string): boolean {
  return GATE_ESCALACAO.test(texto)
}

export function temIndicioDeLinhas(texto: string): boolean {
  return GATE_LINHAS.test(texto)
}

function extrairJsonDoConteudo(conteudo: string): Record<string, any> | null {
  const trimmed = conteudo.trim()
  const m = trimmed.match(/\{[\s\S]*\}/)
  const candidato = m ? m[0] : trimmed
  try {
    const parsed = JSON.parse(candidato)
    return typeof parsed === "object" && parsed !== null ? parsed : null
  } catch {
    return null
  }
}

async function classificarEscalacao(mensagem: string, estado: string): Promise<EscalacaoIntencao | null> {
  const prompt = `Voce e um classificador de intencao de um chatbot de vendas de tecidos (B2B).
O cliente esta na etapa "${estado}" do funil de cadastro.
Mensagem do cliente: "${mensagem}"

Responda APENAS com um objeto JSON valido, sem texto, sem markdown:
{"querAtendente": true|false, "querReiniciar": true|false}

Regras:
- "querAtendente" = true SOMENTE se o cliente pede explicitamente para falar com uma pessoa/atendente/representante/suporte/gerente/humano, ou pede para ser ligado/contatado por alguem.
  FALSO para respostas de cadastro ou perguntas de produto — exemplos: "pessoa fisica", "sou uma pessoa", "sou representante de uma marca", "qual valor", "quanto custa", "qual representante atende minha regiao".
- "querReiniciar" = true SOMENTE se o cliente pede explicitamente para recomecar do zero / reiniciar / resetar / limpar a conversa.
  FALSO para "bom dia", "quero comecar", confirmacoes, repeticoes da mesma resposta, etc.

JSON:`

  const res = await chamarIA([{ role: "user", content: prompt }], { temperatura: 0, maxTokens: 40 })
  const dados = extrairJsonDoConteudo(res.conteudo)
  if (!dados || typeof dados.querAtendente !== "boolean" || typeof dados.querReiniciar !== "boolean") {
    return null
  }
  return { querAtendente: dados.querAtendente, querReiniciar: dados.querReiniciar, via: "llm" }
}

export async function analisarEscalacao(mensagem: string, estado: string): Promise<EscalacaoIntencao> {
  const regexAtendente = regexPediuAtendente(mensagem)
  const regexReiniciar = regexPediuReiniciar(mensagem)

  if (!parecePedidoEscalacao(mensagem)) {
    return { querAtendente: regexAtendente, querReiniciar: regexReiniciar, via: "regex" }
  }

  try {
    const llm = await classificarEscalacao(mensagem, estado)
    if (llm) return llm
  } catch (e) {
    console.error("[Intencao] erro ao classificar escalacao:", e)
  }

  return { querAtendente: regexAtendente, querReiniciar: regexReiniciar, via: "regex" }
}

export async function analisarLinhas(
  mensagem: string,
  linhaMap: Record<number, string>,
  maxNumero: number
): Promise<number[] | undefined> {
  const lista =
    Object.keys(linhaMap).length > 0
      ? Object.keys(linhaMap)
          .map((n) => `${n} = ${linhaMap[Number(n)]}`)
          .join("; ")
      : `numeros de 1 a ${maxNumero} (nomes disponiveis na ordem do catalogo)`

  const prompt = `Voce identifica quais linhas de produto (de 1 a ${maxNumero}) o cliente citou na mensagem.
Linhas disponiveis: ${lista}
Mensagem: "${mensagem}"

Responda APENAS com JSON valido: {"linhas": [numeros]} — somente numeros de linha citados ou claramente referidos na mensagem (por numero ou nome). Se nenhuma, use {"linhas": []}.

JSON:`

  try {
    const res = await chamarIA([{ role: "user", content: prompt }], { temperatura: 0, maxTokens: 40 })
    const dados = extrairJsonDoConteudo(res.conteudo)
    if (!dados || !Array.isArray(dados.linhas)) return undefined
    const linhas = [...new Set(dados.linhas.map(Number).filter((n: any) => Number.isFinite(n) && n >= 1 && n <= maxNumero))].sort((a: any, b: any) => a - b)
    return linhas.length > 0 ? linhas : undefined
  } catch (e) {
    console.error("[Intencao] erro ao extrair linhas:", e)
    return undefined
  }
}