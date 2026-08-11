import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { POST } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), selectDistinct: vi.fn(), insert: vi.fn() },
}))

const session = { user: { id: "16", role: "ADMIN" } }

const disparo = {
  id: 2,
  nome: "07.08 | Feira Equipotel",
  para: "clientes",
  assunto: "Promo",
  modoEnvio: "individual",
  remetente: "sistema",
  remessaId: "abc-123",
  status: "concluido",
  total: 4711,
  enviados: 400,
  falhas: 0,
  erro: null,
  criadoPor: 16,
  criadoEm: new Date(),
  iniciadoEm: new Date(),
  concluidoEm: new Date(),
}

const lidos = [
  { nome: "Ana Souza", email: "ana@empresa.com" },
  { nome: "Bruno Lima", email: "bruno@empresa.com" },
]

function post(id: string, body: object) {
  return POST(
    new NextRequest(`http://localhost/api/admin/email-massa/disparos/${id}/criar-lista`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  )
}

describe("POST /api/admin/email-massa/disparos/[id]/criar-lista", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
    vi.mocked(getServerSession).mockResolvedValue(session as any)
  })

  it("retorna 401 sem sessão de admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await post("2", { tipo: "lidos", nome: "Lidos" })
    expect(res.status).toBe(401)
  })

  it("retorna 400 com tipo inválido", async () => {
    db.select = vi.fn(() => createQueryBuilder([disparo]))
    const res = await post("2", { tipo: "x", nome: "X" })
    expect(res.status).toBe(400)
  })

  it("retorna 404 quando o disparo não existe", async () => {
    db.select = vi.fn(() => createQueryBuilder([]))
    const res = await post("99", { tipo: "lidos", nome: "Lidos" })
    expect(res.status).toBe(404)
  })

  it("retorna 400 quando não há contatos com a característica", async () => {
    db.select = vi.fn(() => createQueryBuilder([disparo]))
    db.select.mockImplementationOnce(() => createQueryBuilder([disparo]))
    db.select.mockImplementationOnce(() => createQueryBuilder([]))
    const res = await post("2", { tipo: "lidos", nome: "Lidos" })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toContain("Nenhum contato")
  })

  it("cria lista de lidos com descricao e contatos", async () => {
    db.select = vi.fn()
    db.select.mockImplementationOnce(() => createQueryBuilder([disparo]))
    db.select.mockImplementationOnce(() => createQueryBuilder(lidos))
    db.insert = vi.fn()
    db.insert.mockImplementationOnce(() => createQueryBuilder([{ id: 7, nome: "Lidos Equipotel" }]))
    db.insert.mockImplementationOnce(() => createQueryBuilder([{ id: 1 }]))

    const res = await post("2", { tipo: "lidos", nome: "Lidos Equipotel" })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ listaId: 7, nome: "Lidos Equipotel", total: 2 })
    expect(db.insert).toHaveBeenNthCalledWith(
      1,
      expect.anything()
    )
  })

  it("cria lista de clicados usando selectDistinct com join", async () => {
    db.select = vi.fn(() => createQueryBuilder([disparo]))
    db.selectDistinct = vi.fn(() => createQueryBuilder([{ nome: "Ana Souza", email: "ana@empresa.com" }]))
    db.insert = vi.fn()
    db.insert.mockImplementationOnce(() => createQueryBuilder([{ id: 8, nome: "Clicados" }]))
    db.insert.mockImplementationOnce(() => createQueryBuilder([{ id: 1 }]))

    const res = await post("2", { tipo: "clicados", nome: "Clicados" })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ listaId: 8, nome: "Clicados", total: 1 })
  })

  it("cria lista de falhas", async () => {
    db.select = vi.fn()
    db.select.mockImplementationOnce(() => createQueryBuilder([disparo]))
    db.select.mockImplementationOnce(() => createQueryBuilder([{ nome: "Carla Dias", email: "carla@empresa.com" }]))
    db.insert = vi.fn()
    db.insert.mockImplementationOnce(() => createQueryBuilder([{ id: 9, nome: "Falhas" }]))
    db.insert.mockImplementationOnce(() => createQueryBuilder([{ id: 1 }]))

    const res = await post("2", { tipo: "falhas", nome: "Falhas" })
    expect(res.status).toBe(200)
    expect((await res.json()).total).toBe(1)
  })
})
