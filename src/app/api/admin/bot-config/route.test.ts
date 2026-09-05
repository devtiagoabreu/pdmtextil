import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, PUT } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), transaction: vi.fn() },
}))

const admin = { user: { id: "1", role: "ADMIN" } }
const comum = { user: { id: "2", role: "COMERCIAL" } }

const usuarios = [
  { id: 1, name: "Ana", email: "ana@empresa.com", role: "COMERCIAL", ativo: true, celWhatsapp: "5519999999999" },
  { id: 2, name: "Beto", email: "beto@empresa.com", role: "COMERCIAL", ativo: true, celWhatsapp: "5519999999998" },
  { id: 3, name: "Carla", email: "carla@empresa.com", role: "ADMIN", ativo: false, celWhatsapp: null },
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

  it("retorna destinatários agrupados por tipo e lista de usuários", async () => {
    vi.mocked(getServerSession).mockResolvedValue(comum as any)
    const builders: any[] = []
    const mk = (result: any) => {
      const b = createQueryBuilder(result)
      builders.push(b)
      return b
    }
    db.select = vi.fn()
    vi.mocked(db.select).mockImplementationOnce(() =>
      mk([
        { usuarioId: 1, tipoPessoa: "PJ" },
        { usuarioId: 2, tipoPessoa: "PF" },
        { usuarioId: 3, tipoPessoa: "PJ" },
      ])
    )
    vi.mocked(db.select).mockImplementationOnce(() => mk(usuarios))

    const res = await getReq()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.pj).toEqual([1, 3])
    expect(data.pf).toEqual([2])
    expect(data.usuarios).toHaveLength(3)
    expect(builders.length).toBe(2)
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
})