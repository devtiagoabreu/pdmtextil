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
    nome: typeof dados?.nome === "string" && dados.nome.trim() ? dados.nome.trim() : undefined,
    tipoPessoa: typeof dados?.tipoPessoa === "string" ? dados.tipoPessoa.toUpperCase().trim() : undefined,
    documento: typeof dados?.documento === "string" ? dados.documento.replace(/\D/g, "") : undefined,
    email: typeof dados?.email === "string" ? dados.email.trim() : undefined,
    empresa: typeof dados?.empresa === "string" ? dados.empresa.trim() : undefined,
    telefone: typeof dados?.telefone === "string" ? dados.telefone.replace(/\D/g, "") : undefined,
    linhasInteresse: Array.isArray(dados?.linhasInteresse)
      ? dados.linhasInteresse.filter((n: any) => Number.isFinite(Number(n))).map((n: any) => Number(n))
      : undefined,
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
