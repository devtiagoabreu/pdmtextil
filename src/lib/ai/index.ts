import { db } from "@/lib/db"
import { aiChaves, type AiChave } from "@/lib/db/schema/ai-chaves"
import { eq, and, lt, sql } from "drizzle-orm"

export type ProvedorIA = "groq" | "openai" | "anthropic" | "gemini" | "deepseek" | "openai_compatible"

export interface MensagemIA {
  role: "system" | "user" | "assistant"
  content: string
}

export interface ResultadoIA {
  conteudo: string
  provedor: string
  modelo: string
  nomeChave: string
  tentativas: number
}

export interface ChaveIA {
  id: number
  provedor: ProvedorIA
  nome: string
  chaveApi: string
  urlBase?: string | null
  modelo?: string | null
  ordem: number
  ativo: boolean
  failCount: number
  ultimaFalha?: Date | string | null
}

export const BASE_URLS: Record<ProvedorIA, string> = {
  groq: "https://api.groq.com/openai/v1",
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  deepseek: "https://api.deepseek.com/v1",
  openai_compatible: "",
}

export const MODELOS_PADRAO: Record<ProvedorIA, string> = {
  groq: "llama-3.3-70b-versatile",
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-sonnet-latest",
  gemini: "gemini-1.5-flash",
  deepseek: "deepseek-chat",
  openai_compatible: "",
}

export const PROVEDOR_LABELS: Record<ProvedorIA, string> = {
  groq: "Groq",
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  gemini: "Google Gemini",
  deepseek: "DeepSeek",
  openai_compatible: "OpenAI Compatível (URL custom)",
}

interface ChaveReserva {
  id: number
  prov: ProvedorIA
  nome: string
  chave: string
  url: string
  modelo: string
  ordem: number
}

const cooldownCache = new Map<number, number>()
const MSG_ERRO_TECNICO =
  "Desculpe, estou com dificuldades tecnicas no momento. Por favor, tente novamente em instantes."

function isErroTecnico(texto: string): boolean {
  return texto.includes("dificuldades tecnicas") || texto.includes("nao consegui processar")
}

async function buscarChavesAtivas(): Promise<ChaveReserva[]> {
  const registros = await db
    .select()
    .from(aiChaves)
    .where(and(eq(aiChaves.ativo, true), lt(aiChaves.failCount, 5)))
    .orderBy(aiChaves.ordem)

  const agora = Date.now()
  return registros
    .filter((r: AiChave) => {
      const cooldown = cooldownCache.get(r.id)
      return !cooldown || cooldown < agora
    })
    .map((r: AiChave) => ({
      id: r.id,
      prov: (r.provedor || "groq") as ProvedorIA,
      nome: r.nome || r.provedor,
      chave: r.chaveApi,
      url: r.urlBase || BASE_URLS[r.provedor as ProvedorIA] || BASE_URLS.groq,
      modelo: r.modelo || MODELOS_PADRAO[r.provedor as ProvedorIA] || "",
      ordem: r.ordem,
    }))
}

async function marcarFalha(id: number) {
  try {
    await db
      .update(aiChaves)
      .set({
        failCount: sql`${aiChaves.failCount} + 1`,
        ultimaFalha: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(aiChaves.id, id))
  } catch {}
  cooldownCache.set(id, Date.now() + 10 * 60 * 1000)
}

async function resetarFalha(id: number) {
  try {
    await db
      .update(aiChaves)
      .set({ failCount: 0, ultimaFalha: null, updatedAt: new Date() })
      .where(eq(aiChaves.id, id))
  } catch {}
  cooldownCache.delete(id)
}

function montarMensagens(messages: MensagemIA[]): MensagemIA[] {
  const ultimaMsg = messages[messages.length - 1]
  const historico = messages.slice(-16)
  if (ultimaMsg && historico[historico.length - 1] !== ultimaMsg) {
    return [...historico, ultimaMsg]
  }
  return historico
}

async function chamarProvedor(
  chave: ChaveReserva,
  messages: MensagemIA[],
  opcoes: { temperatura?: number; maxTokens?: number }
): Promise<string> {
  const temperatura = opcoes.temperatura ?? 0.7
  const maxTokens = opcoes.maxTokens ?? 300
  const systemContent = messages.find(m => m.role === "system")?.content || ""
  const historico = messages.filter(m => m.role !== "system")

  if (chave.prov === "anthropic") {
    const res = await fetch(`${chave.url}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": chave.chave,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: chave.modelo,
        max_tokens: maxTokens,
        temperature: temperatura,
        system: systemContent || undefined,
        messages: historico,
      }),
    })
    if (!res.ok) throw new Error(`Anthropic HTTP ${res.status}`)
    const data = await res.json()
    const texto = data.content?.[0]?.text
    return texto || MSG_ERRO_TECNICO
  }

  if (chave.prov === "gemini") {
    const contents = historico.map(m => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }))
    if (contents.length > 0 && contents[0].role !== "user") {
      contents.unshift({ role: "user", parts: [{ text: "Iniciar conversa" }] })
    }
    const res = await fetch(`${chave.url}/models/${chave.modelo}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": chave.chave,
      },
      body: JSON.stringify({
        contents,
        systemInstruction: systemContent ? { parts: [{ text: systemContent }] } : undefined,
        generationConfig: { temperature: temperatura, maxOutputTokens: maxTokens },
      }),
    })
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`)
    const data = await res.json()
    const texto = data.candidates?.[0]?.content?.parts?.[0]?.text
    return texto || MSG_ERRO_TECNICO
  }

  const res = await fetch(`${chave.url}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${chave.chave}`,
    },
    body: JSON.stringify({
      model: chave.modelo,
      messages,
      temperature: temperatura,
      max_tokens: maxTokens,
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const texto = data.choices?.[0]?.message?.content
  return texto || MSG_ERRO_TECNICO
}

async function carregarChavesEnvFallback(): Promise<ChaveReserva[]> {
  const envKey = process.env.GROQ_API_KEY
  if (envKey && envKey !== "cole-sua-chave-groq-aqui") {
    return [
      {
        id: -1,
        prov: "groq",
        nome: "Groq (env)",
        chave: envKey,
        url: BASE_URLS.groq,
        modelo: process.env.GROQ_MODEL || MODELOS_PADRAO.groq,
        ordem: 1,
      },
    ]
  }
  return []
}

export async function chamarIA(
  messages: MensagemIA[],
  opcoes: { temperatura?: number; maxTokens?: number } = {}
): Promise<ResultadoIA> {
  const chavesEnv = await carregarChavesEnvFallback()
  const chavesBanco = await buscarChavesAtivas().catch(() => [])
  const chaves = [...chavesEnv, ...chavesBanco]

  if (chaves.length === 0) {
    console.error("[IA] Nenhuma chave de IA configurada")
    return { conteudo: MSG_ERRO_TECNICO, provedor: "nenhum", modelo: "", nomeChave: "", tentativas: 0 }
  }

  const mensagens = montarMensagens(messages)
  let ultimoErro: unknown = null
  let tentativas = 0

  for (const chave of chaves) {
    tentativas++
    try {
      const conteudo = await chamarProvedor(chave, mensagens, opcoes)

      if (isErroTecnico(conteudo)) {
        ultimoErro = new Error("Provedor retornou erro tecnico")
        await marcarFalha(chave.id)
        continue
      }

      if (chave.id > 0) await resetarFalha(chave.id)
      return { conteudo, provedor: chave.prov, modelo: chave.modelo, nomeChave: chave.nome, tentativas }
    } catch (err) {
      ultimoErro = err
      console.error(`[IA] Provedor ${chave.prov} (${chave.nome}) falhou:`, err)
      if (chave.id > 0) await marcarFalha(chave.id)
    }
  }

  console.error("[IA] Todos os provedores falharam:", ultimoErro)
  return { conteudo: MSG_ERRO_TECNICO, provedor: "nenhum", modelo: "", nomeChave: "", tentativas }
}

export async function testarChave(chave: ChaveIA): Promise<{ ok: boolean; mensagem: string; detalhe?: string }> {
  const prov = (chave.provedor || "groq") as ProvedorIA
  const url = chave.urlBase || BASE_URLS[prov] || BASE_URLS.groq
  const modelo = chave.modelo || MODELOS_PADRAO[prov] || ""

  try {
    const conteudo = await chamarProvedor(
      { id: chave.id, prov, nome: chave.nome, chave: chave.chaveApi, url, modelo, ordem: chave.ordem },
      [
        { role: "system", content: "Voce e um assistente." },
        { role: "user", content: "Responda apenas: OK" },
      ],
      { maxTokens: 10 }
    )
    if (isErroTecnico(conteudo)) {
      return { ok: false, mensagem: "Provedor respondeu com erro tecnico", detalhe: conteudo }
    }
    return { ok: true, mensagem: `Provedor respondeu: ${conteudo.substring(0, 200)}` }
  } catch (err: any) {
    return { ok: false, mensagem: `Falha: ${err?.message || "erro desconhecido"}` }
  }
}
