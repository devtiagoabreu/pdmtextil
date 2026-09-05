import { buildSystemPrompt } from "./prompt"
import { chamarIA, type ResultadoIA } from "@/lib/ai"

export interface DadosLeadExtraidos {
  nome?: string
  tipoPessoa?: string
  documento?: string
  email?: string
  empresa?: string
  telefone?: string
  linhasInteresse?: number[]
}

function extrairJsonDoConteudo(conteudo: string): Record<string, any> | null {
  const trimmed = conteudo.trim()
  let candidato = trimmed
  const m = trimmed.match(/\{[\s\S]*\}/)
  if (m) candidato = m[0]
  try {
    const parsed = JSON.parse(candidato)
    return typeof parsed === "object" && parsed !== null ? parsed : null
  } catch {
    try {
      const idx = candidato.indexOf("{")
      const fim = candidato.lastIndexOf("}")
      if (idx !== -1 && fim > idx) {
        return JSON.parse(candidato.slice(idx, fim + 1))
      }
    } catch {
      return null
    }
    return null
  }
}

const NOMES_INVALIDOS = new Set(["ola", "olá", "oi", "oe", "eai", "e aí", "cliente", "anonimo", "anônimo", "bom dia", "boa tarde", "boa noite", "usuario", "usuário", "nao informado", "não informado", "sem nome"])

function nomeValido(nome: unknown): string | undefined {
  if (typeof nome !== "string") return undefined
  const limpo = nome.trim().replace(/\s+/g, " ")
  if (limpo.length < 2 || limpo.length > 80) return undefined
  if (NOMES_INVALIDOS.has(limpo.toLowerCase())) return undefined
  if (/^\d+$/.test(limpo)) return undefined
  return limpo
}

function tipoValido(tipo: unknown): string | undefined {
  if (typeof tipo !== "string") return undefined
  const t = tipo.trim()
  const low = t.toLowerCase()
  if (t.toUpperCase() === "PF" || t.toUpperCase() === "PJ") return t.toUpperCase()
  if (/fisic|física|cpf/.test(low)) return "PF"
  if (/jurid|jurídic|cnpj/.test(low)) return "PJ"
  return undefined
}

function docValido(doc: unknown): string | undefined {
  if (typeof doc !== "string") return undefined
  const numeros = doc.replace(/\D/g, "")
  if (numeros.length !== 11 && numeros.length !== 14) return undefined
  if (/^0+$/.test(numeros)) return undefined
  return numeros
}

function linhasValidas(linhas: unknown): number[] | undefined {
  let nums: number[] = []
  if (Array.isArray(linhas)) {
    nums = linhas.map((n: any) => Number(n)).filter((n: any) => Number.isFinite(n) && n >= 1)
  } else if (typeof linhas === "string") {
    nums = (linhas.match(/\d+/g) || []).map(Number)
  } else {
    return undefined
  }
  nums = [...new Set(nums)].filter((n) => n >= 1).sort((a, b) => a - b)
  return nums.length > 0 ? nums : undefined
}

export async function extrairDadosLead(
  historico: Array<{ role: "user" | "assistant"; content: string }>,
  pushName: string
): Promise<DadosLeadExtraidos> {
  const historicoTexto = historico
    .map((m) => `${m.role === "assistant" ? "BOT" : "CLIENTE"}: ${m.content}`)
    .join("\n")

  const prompt = `Voce e um extrator de dados de leads. Analise a conversa de vendas abaixo e extraia as informacoes do cliente potencial.
Regras:
- nome: nome proprio REAL do cliente informado na conversa. NUNCA use "Ola", "Cliente", "Anonimo", saudações ou o nome do assistente.
- tipoPessoa: "PF" (pessoa fisica / cpf) ou "PJ" (pessoa juridica / cnpj) conforme documentos ou razao social mencionados.
- documento: CPF ou CNPJ informado (somente numeros), se houver.
- email: email informado, se houver.
- empresa: razao social ou nome da empresa, se houver.
- telefone: telefone do cliente informado, se houver (somente numeros).
- linhasInteresse: a lista de numeros das linhas de produto que o cliente demonstrou interesse (ex: 1, 2, 3).
Para qualquer dado ausente use null.
Responda APENAS com um objeto JSON valido, sem texto, sem markdown, sem comentarios.

CONVERSA:
${historicoTexto}

pushName do contato (pode ser nome real): ${pushName}

JSON:`

  const resultado = await chamarIA(
    [{ role: "user" as const, content: prompt }],
    { temperatura: 0, maxTokens: 200 }
  )

  const dados = extrairJsonDoConteudo(resultado.conteudo)

  return {
    nome: nomeValido(dados?.nome),
    tipoPessoa: tipoValido(dados?.tipoPessoa),
    documento: docValido(dados?.documento),
    email: typeof dados?.email === "string" && dados.email.trim() ? dados.email.trim() : undefined,
    empresa: typeof dados?.empresa === "string" && dados.empresa.trim() ? dados.empresa.trim() : undefined,
    telefone: typeof dados?.telefone === "string" ? dados.telefone.replace(/\D/g, "") || undefined : undefined,
    linhasInteresse: linhasValidas(dados?.linhasInteresse),
  }
}

export async function chamarGroq(
  userMessage: string,
  pushName: string,
  estado: string,
  dados: Record<string, any>,
  historico: Array<{ role: "user" | "assistant"; content: string }>,
  linhas: { numero: number; nome: string }[]
): Promise<ResultadoIA> {
  const systemMessage = buildSystemPrompt(linhas)
    .replace("{{pushName}}", pushName)
    .replace("{{estado}}", estado)
    .replace("{{dados}}", JSON.stringify(dados))

  const messages = [
    { role: "system" as const, content: systemMessage },
    ...historico.slice(-15),
    { role: "user" as const, content: userMessage },
  ]

  return chamarIA(messages, { temperatura: 0.7, maxTokens: 300 })
}
