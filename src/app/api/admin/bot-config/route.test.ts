import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, PUT } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), transaction: vi.fn(), insert: vi.fn() },
}))

const admin = { user: { id: "1", role: "ADMIN" } }
const comum = { user: { id: "2", role: "COMERCIAL" } }

const usuarios = [
  { id: 1, name: "Ana", email: "ana@empresa.com", role: "COMERCIAL", ativo: true, celWhatsapp: "5519999999999" },
  { id: 2, name: "Beto", email: "beto@empresa.com", role: "COMERCIAL", ativo: true, celWhatsapp: "5519999999998" },
  { id: 3, name: "Carla", email: "carla@empresa.com", role: "ADMIN", ativo: false, celWhatsapp: null },
]

const configItem = [
  {
    chave: "bot_monitoramento",
    valor: JSON.stringify({
      ativo: true,
      emailAlerta: true,
      notificacaoPdm: true,
      ultimoCheck: null,
      ultimoStatus: "ok",
      ultimoErro: null,
    }),
  },
]

const logs = [
  {
    id: 10,
    tipo: "OK",
    origem: "monitor",
    status: "ok",
    detalhe: { instanciaStatus: "open" },
    erro: null,
    createdAt: "2026-09-05T14:00:00.000Z",
  },
]

function getReq() {
  return GET()
}

function putReq(body: unknown) {
  return PUT(
    new NextRequest("http://localhost/api/admin/bot-config", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  )
}

function mockGet(result: unknown) {
  db.select = vi.fn(() => createQueryBuilder(result))
}

function mockSelectSequencia(itens: any[]) {
  const fila = [...itens]
  db.select = vi.fn(() => {
    const r = fila.length ? fila.shift() : itens[itens.length - 1]
    return createQueryBuilder(r)
  })
}

describe("GET /api/admin/bot-config", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 sem sessão", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await getReq()
    expect(res.status).toBe(401)
  })

  it("retorna destinatários agrupados por tipo, usuários, monitoramento e logs", async () => {
    vi.mocked(getServerSession).mockResolvedValue(comum as any)
    mockSelectSequencia([
      [
        { usuarioId: 1, tipoPessoa: "PJ" },
        { usuarioId: 2, tipoPessoa: "PF" },
        { usuarioId: 3, tipoPessoa: "PJ" },
      ],
      usuarios,
      configItem,
      logs,
    ])

    const res = await getReq()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.pj).toEqual([1, 3])
    expect(data.pf).toEqual([2])
    expect(data.usuarios).toHaveLength(3)
    expect(data.monitoramento.ativo).toBe(true)
    expect(data.monitoramento.ultimoStatus).toBe("ok")
    expect(data.logs).toHaveLength(1)
    expect(data.logs[0]).toMatchObject({ tipo: "OK", status: "ok" })
  })
})

describe("PUT /api/admin/bot-config", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 para não-admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(comum as any)
    const res = await putReq({ pj: [1], pf: [] })
    expect(res.status).toBe(401)
  })

  it("valida que pj/pf são listas", async () => {
    vi.mocked(getServerSession).mockResolvedValue(admin as any)
    const res = await putReq({ pj: "1", pf: [] })
    expect(res.status).toBe(400)
  })

  it("rejeita id de usuário inexistente", async () => {
    vi.mocked(getServerSession).mockResolvedValue(admin as any)
    mockGet(usuarios)
    const res = await putReq({ pj: [1, 999], pf: [] })
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain("999")
  })

  it("substitui a configuração em transação", async () => {
    vi.mocked(getServerSession).mockResolvedValue(admin as any)
    mockGet(usuarios)

    const txDelete = createQueryBuilder(undefined)
    const txInsert = createQueryBuilder([])
    let seq = 0
    const tx: any = {
      delete: vi.fn(() => {
        seq++
        return seq === 1 ? txDelete : txDelete
      }),
      insert: vi.fn(() => txInsert),
    }
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => cb(tx))

    const res = await putReq({ pj: [1, 2], pf: [2] })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ ok: true, pj: [1, 2], pf: [2] })

    expect(tx.delete).toHaveBeenCalledTimes(1)
    expect(tx.insert).toHaveBeenCalledTimes(1)
    expect(txInsert.values.mock.calls[0][0]).toEqual([
      { usuarioId: 1, tipoPessoa: "PJ" },
      { usuarioId: 2, tipoPessoa: "PJ" },
      { usuarioId: 2, tipoPessoa: "PF" },
    ])
  })

  it("aceita config vazia (limpa tudo)", async () => {
    vi.mocked(getServerSession).mockResolvedValue(admin as any)
    mockGet(usuarios)

    const tx: any = { delete: vi.fn(() => createQueryBuilder(undefined)), insert: vi.fn(() => createQueryBuilder([])) }
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => cb(tx))

    const res = await putReq({ pj: [], pf: [] })
    expect(res.status).toBe(200)
    expect(tx.insert).not.toHaveBeenCalled()
  })

  it("rejeita monitoramento com campos não booleanos", async () => {
    vi.mocked(getServerSession).mockResolvedValue(admin as any)
    mockGet(usuarios)
    const res = await putReq({ pj: [], pf: [], monitoramento: { ativo: "sim", emailAlerta: true, notificacaoPdm: true } })
    expect(res.status).toBe(400)
  })

  it("salva o monitoramento quando fornecido (upsert em config_geral)", async () => {
    vi.mocked(getServerSession).mockResolvedValue(admin as any)
    mockSelectSequencia([configItem])
    let configBuilder: any
    db.insert = vi.fn(() => {
      configBuilder = createQueryBuilder("ok")
      return configBuilder
    })
    const tx: any = { delete: vi.fn(() => createQueryBuilder(undefined)), insert: vi.fn(() => createQueryBuilder([])) }
    vi.mocked(db.transaction).mockImplementation(async (cb: any) => cb(tx))

    const res = await putReq({ pj: [], pf: [], monitoramento: { ativo: false, emailAlerta: true, notificacaoPdm: false } })
    expect(res.status).toBe(200)

    const v = configBuilder.values.mock.calls[0][0]
    expect(v.chave).toBe("bot_monitoramento")
    const salvo = JSON.parse(v.valor) as any
    expect(salvo.ativo).toBe(false)
    expect(salvo.emailAlerta).toBe(true)
    expect(salvo.notificacaoPdm).toBe(false)
    expect(salvo.ultimoStatus).toBe("ok")
    expect(configBuilder.onConflictDoUpdate).toHaveBeenCalled()
  })
})