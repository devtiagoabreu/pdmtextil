// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createQueryBuilder } from "@/test/route-db-mock"
import { chamarIA, testarChave } from "./index"

vi.mock("@/lib/db", () => ({ db: { select: vi.fn(), update: vi.fn() } }))
import { db } from "@/lib/db"

const MENSAGENS = [
  { role: "system" as const, content: "Voce e um assistente." },
  { role: "user" as const, content: "Ola" },
]

function mockFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status < 400,
    status,
    json: vi.fn().mockResolvedValue(body),
  })
}

beforeEach(() => {
  vi.restoreAllMocks()
})

afterEach(() => {
  delete process.env.GROQ_API_KEY
  delete process.env.GROQ_MODEL
})

describe("chamarIA — prioridade banco (DB) primeiro, env (Vercel) como fallback", () => {
  it("usa a chave do env (GROQ_API_KEY) quando não há chave no banco", async () => {
    process.env.GROQ_API_KEY = "env-groq-chave"
    process.env.GROQ_MODEL = "qwen/qwen3.8-27b"

    const fetchMock = mockFetch(200, { choices: [{ message: { content: "resposta da env" } }] })
    vi.stubGlobal("fetch", fetchMock)

    const res = await chamarIA(MENSAGENS)

    expect(res.conteudo).toBe("resposta da env")
    expect(res.nomeChave).toBe("Groq (env)")
    expect(res.provedor).toBe("groq")
    const callArg = fetchMock.mock.calls[0][0]
    const fetchBody = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(fetchBody.model).toBe("qwen/qwen3.8-27b")
    expect(callArg).toContain("https://api.groq.com/openai/v1")
  })

  it("usa a chave do banco primeiro quando ela responde OK, mesmo com env configurada", async () => {
    process.env.GROQ_API_KEY = "env-groq-chave"
    process.env.GROQ_MODEL = "qwen/qwen3.8-27b"

    const urlsChamadas: string[] = []
    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      urlsChamadas.push(String(_url))
      return Promise.resolve({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ choices: [{ message: { content: "resposta do banco" } }] }),
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    db.select = vi.fn(() =>
      createQueryBuilder([
        { id: 1, provedor: "groq", nome: "Groq do Banco", chaveApi: "banco-chave", urlBase: null, modelo: "qwen/qwen3.8-27b", ordem: 1, ativo: true, failCount: 0 },
      ]),
    )

    const res = await chamarIA(MENSAGENS)

    expect(res.nomeChave).toBe("Groq do Banco")
    expect(res.conteudo).toBe("resposta do banco")
    expect(urlsChamadas).toHaveLength(1)
  })

  it("cai para a chave do env quando a chave do banco falha (banco primeiro)", async () => {
    process.env.GROQ_API_KEY = "env-groq-chave"
    process.env.GROQ_MODEL = "qwen/qwen3.8-27b"

    let primeiro = true
    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init?.body))
      if (primeiro && body.model === "qwen/qwen3.8-27b" && body.messages) {
        primeiro = false
        return Promise.resolve({ ok: false, status: 500, json: vi.fn().mockResolvedValue({}) })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ choices: [{ message: { content: "resposta da env" } }] }),
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    db.select = vi.fn(() =>
      createQueryBuilder([
        { id: 1, provedor: "groq", nome: "Groq do Banco", chaveApi: "banco-chave", urlBase: null, modelo: "qwen/qwen3.8-27b", ordem: 1, ativo: true, failCount: 0 },
      ]),
    )

    const res = await chamarIA(MENSAGENS)

    expect(res.nomeChave).toBe("Groq (env)")
    expect(res.conteudo).toBe("resposta da env")
  })

  it("retorna erro tecnico quando não há env nem chave no banco", async () => {
    vi.stubGlobal("fetch", mockFetch(200, {}))
    db.select = vi.fn(() => createQueryBuilder([]))

    const res = await chamarIA(MENSAGENS)

    expect(res.provedor).toBe("nenhum")
    expect(res.conteudo).toContain("dificuldades tecnicas")
  })
})

describe("chamarIA — Gemini", () => {
  it("monta body com systemInstruction e roles user/model em :generateContent", async () => {
    db.select = vi.fn(() =>
      createQueryBuilder([
        { id: 5, provedor: "gemini", nome: "Gemini", chaveApi: "gem-chave", urlBase: "https://generativelanguage.googleapis.com/v1beta", modelo: "gemini-3.6-flash", ordem: 1, ativo: true, failCount: 0 },
      ]),
    )

    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init?.body))
      expect(body.contents).toEqual([
        { role: "user", parts: [{ text: "Ola" }] },
      ])
      expect(body.systemInstruction).toEqual({ parts: [{ text: "Voce e um assistente." }] })
      expect(body.generationConfig).toEqual({ temperature: 0.7, maxOutputTokens: 1200 })
      return Promise.resolve({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ candidates: [{ content: { parts: [{ text: "resposta gemini" }] } }] }),
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    const res = await chamarIA(MENSAGENS)

    expect(res.conteudo).toBe("resposta gemini")
    expect(res.provedor).toBe("gemini")
    expect(fetchMock.mock.calls[0][0]).toContain(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
    )
  })

  it("não inclui systemInstruction quando não há mensagem de sistema", async () => {
    db.select = vi.fn(() =>
      createQueryBuilder([
        { id: 5, provedor: "gemini", nome: "Gemini", chaveApi: "gem-chave", urlBase: "https://generativelanguage.googleapis.com/v1beta", modelo: "gemini-3.6-flash", ordem: 1, ativo: true, failCount: 0 },
      ]),
    )

    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init?.body))
      expect(body.systemInstruction).toBeUndefined()
      return Promise.resolve({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }),
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    const res = await chamarIA([{ role: "user", content: "Oi" }])

    expect(res.provedor).toBe("gemini")
    expect(res.conteudo).toBe("ok")
  })
})

describe("chamarIA — OpenRouter", () => {
  it("usa /chat/completions e envia headers HTTP-Referer e X-Title", async () => {
    db.select = vi.fn(() =>
      createQueryBuilder([
        { id: 9, provedor: "openrouter", nome: "OpenRouter Principal", chaveApi: "or-chave", urlBase: "https://openrouter.ai/api/v1", modelo: "openai/gpt-4o-mini", ordem: 1, ativo: true, failCount: 0 },
      ]),
    )

    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init?.body))
      expect(body.model).toBe("openai/gpt-4o-mini")
      return Promise.resolve({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ choices: [{ message: { content: "resposta openrouter" } }] }),
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    const res = await chamarIA(MENSAGENS)

    expect(res.conteudo).toBe("resposta openrouter")
    expect(res.provedor).toBe("openrouter")
    expect(fetchMock.mock.calls[0][0]).toContain("https://openrouter.ai/api/v1/chat/completions")

    const headers = fetchMock.mock.calls[0][1].headers as Record<string, string>
    expect(headers["HTTP-Referer"]).toBeTruthy()
    expect(headers["X-Title"]).toBe("PDM Pro Têxtil")
  })

  it("propaga a mensagem de erro rica quando a API retorna erro", async () => {
    db.select = vi.fn(() =>
      createQueryBuilder([
        { id: 9, provedor: "openrouter", nome: "OpenRouter", chaveApi: "or-chave", urlBase: "https://openrouter.ai/api/v1", modelo: "openai/gpt-4o-mini", ordem: 1, ativo: true, failCount: 0 },
      ]),
    )

    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 429,
        text: vi.fn().mockResolvedValue(JSON.stringify({ error: { message: "Rate limit atingido" } })),
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await testarChave({
      id: 9,
      provedor: "openrouter",
      nome: "OpenRouter",
      chaveApi: "or-chave",
      urlBase: "https://openrouter.ai/api/v1",
      modelo: "openai/gpt-4o-mini",
      ordem: 1,
      ativo: true,
      failCount: 0,
    })

    expect(res.ok).toBe(false)
    expect(res.mensagem).toContain("HTTP 429")
    expect(res.mensagem).toContain("Rate limit atingido")
  })
})

describe("testarChave — Gemini", () => {
  it("propaga a mensagem de erro da API quando o modelo retorna 404", async () => {
    db.select = vi.fn(() => createQueryBuilder([]))

    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        text: vi.fn().mockResolvedValue(
          JSON.stringify({ error: { code: 404, message: "models/gemini-1.5-flash is not found for API version v1beta" } }),
        ),
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const res = await testarChave({
      id: 7,
      provedor: "gemini",
      nome: "Gemini",
      chaveApi: "gem-chave",
      urlBase: "https://generativelanguage.googleapis.com/v1beta",
      modelo: "gemini-1.5-flash",
      ordem: 1,
      ativo: true,
      failCount: 0,
    })

    expect(res.ok).toBe(false)
    expect(res.mensagem).toContain("Gemini HTTP 404")
    expect(res.mensagem).toContain("models/gemini-1.5-flash is not found")
  })
})
