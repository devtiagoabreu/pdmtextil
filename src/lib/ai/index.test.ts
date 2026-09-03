// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { createQueryBuilder } from "@/test/route-db-mock"
import { chamarIA } from "./index"

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

describe("chamarIA — prioridade env (Vercel) primeiro", () => {
  it("usa a chave do env (GROQ_API_KEY) primeiro quando ela responde OK", async () => {
    process.env.GROQ_API_KEY = "env-groq-chave"
    process.env.GROQ_MODEL = "llama-3.3-70b-versatile"

    const fetchMock = mockFetch(200, { choices: [{ message: { content: "resposta da env" } }] })
    vi.stubGlobal("fetch", fetchMock)

    const res = await chamarIA(MENSAGENS)

    expect(res.conteudo).toBe("resposta da env")
    expect(res.nomeChave).toBe("Groq (env)")
    expect(res.provedor).toBe("groq")
    const callArg = fetchMock.mock.calls[0][0]
    const fetchBody = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(fetchBody.model).toBe("llama-3.3-70b-versatile")
    expect(callArg).toContain("https://api.groq.com/openai/v1")
  })

  it("cai para a chave do banco quando a chave do env falha", async () => {
    process.env.GROQ_API_KEY = "env-groq-chave"
    process.env.GROQ_MODEL = "llama-3.3-70b-versatile"

    let envFirst = true
    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init?.body))
      if (envFirst && body.model === "llama-3.3-70b-versatile" && body.messages) {
        envFirst = false
        return Promise.resolve({ ok: false, status: 500, json: vi.fn().mockResolvedValue({}) })
      }
      return Promise.resolve({
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue({ choices: [{ message: { content: "resposta do banco" } }] }),
      })
    })
    vi.stubGlobal("fetch", fetchMock)

    db.select = vi.fn(() =>
      createQueryBuilder([
        { id: 1, provedor: "groq", nome: "Groq do Banco", chaveApi: "banco-chave", urlBase: null, modelo: "llama-3.3-70b-versatile", ordem: 1, ativo: true, failCount: 0 },
      ]),
    )

    const res = await chamarIA(MENSAGENS)

    expect(res.nomeChave).toBe("Groq do Banco")
    expect(res.conteudo).toBe("resposta do banco")
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
        { id: 5, provedor: "gemini", nome: "Gemini", chaveApi: "gem-chave", urlBase: "https://generativelanguage.googleapis.com/v1beta", modelo: "gemini-1.5-flash", ordem: 1, ativo: true, failCount: 0 },
      ]),
    )

    const fetchMock = vi.fn((_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init?.body))
      expect(body.contents).toEqual([
        { role: "user", parts: [{ text: "Ola" }] },
      ])
      expect(body.systemInstruction).toEqual({ parts: [{ text: "Voce e um assistente." }] })
      expect(body.generationConfig).toEqual({ temperature: 0.7, maxOutputTokens: 300 })
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
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
    )
  })

  it("não inclui systemInstruction quando não há mensagem de sistema", async () => {
    db.select = vi.fn(() =>
      createQueryBuilder([
        { id: 5, provedor: "gemini", nome: "Gemini", chaveApi: "gem-chave", urlBase: "https://generativelanguage.googleapis.com/v1beta", modelo: "gemini-1.5-flash", ordem: 1, ativo: true, failCount: 0 },
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
