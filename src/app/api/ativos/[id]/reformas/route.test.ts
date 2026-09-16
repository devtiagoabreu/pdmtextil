// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, POST } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn() },
}))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }

const reformaRow = {
  id: 41,
  ativoId: 3,
  data: "2025-06-15",
  valor: "3000",
  extensaoVidaUtilAnos: 2,
  motivo: "Beneficiamento",
  descricao: null,
  createdAt: new Date("2025-06-15T00:00:00.000Z"),
  updatedAt: new Date("2025-06-15T00:00:00.000Z"),
}

function get() {
  return GET(new NextRequest("http://localhost/api/ativos/3/reformas"), {
    params: Promise.resolve({ id: "3" }),
  })
}

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/ativos/3/reformas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "3" }) }
  )
}

describe("GET /api/ativos/[id]/reformas", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await get()
    expect(res.status).toBe(401)
  })

  it("lista as reformas do ativo", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([reformaRow]))
    const res = await get()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].motivo).toBe("Beneficiamento")
  })

  it("retorna lista vazia quando não há reformas", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await get()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })
})

describe("POST /api/ativos/[id]/reformas", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await post({ data: "2026-07-01", valor: 3000 })
    expect(res.status).toBe(401)
  })

  it("retorna 404 quando o ativo não existe", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await post({ data: "2026-07-01", valor: 3000 })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Ativo não encontrado" })
  })

  it("retorna 400 sem data", async () => {
    const res = await post({ valor: 3000 })
    expect(res.status).toBe(400)
  })

  it("registra uma reforma capitalizável usando o id da rota", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([{ id: 3, nome: "Extintor" }]))
    db.insert.mockReturnValueOnce(createQueryBuilder([{ ...reformaRow, id: 42, motivo: null }]))

    const res = await post({ data: "2026-07-01", valor: 3000, extensaoVidaUtilAnos: 2 })

    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe(42)
    expect(body.data).toBe("2025-06-15")
  })
})
