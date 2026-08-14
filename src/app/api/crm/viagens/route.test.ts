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
  notificar: vi.fn(),
  notificarErro: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), transaction: vi.fn() },
}))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }

const viagens = [
  { id: 1, titulo: "Feira Agritech", destinoCidade: "São Paulo", destinoUf: "SP", status: "PLANEJADA" },
  { id: 2, titulo: "Visita ao cliente", destinoCidade: "Campinas", destinoUf: "SP", status: "CONCLUIDA" },
]

function get(url: string) {
  return GET(new NextRequest(url))
}

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/crm/viagens", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  )
}

describe("GET /api/crm/viagens", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await get("http://localhost/api/crm/viagens")
    expect(res.status).toBe(401)
  })

  it("lista viagens paginadas com total", async () => {
    db.select
      .mockReturnValueOnce(createQueryBuilder(viagens))
      .mockReturnValueOnce(createQueryBuilder([{ total: 2 }]))
    const res = await get("http://localhost/api/crm/viagens")
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.total).toBe(2)
    expect(body.page).toBe(1)
    expect(body.totalPages).toBe(1)
    expect(body.limit).toBe(50)
  })

  it("aplica filtro where quando há busca com 2+ caracteres", async () => {
    db.select
      .mockReturnValueOnce(createQueryBuilder([]))
      .mockReturnValueOnce(createQueryBuilder([{ total: 0 }]))
    await get("http://localhost/api/crm/viagens?q=feira&status=PLANEJADA")
    const builder = (db.select as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(builder.where).toHaveBeenCalled()
  })

  it("retorna array simples quando all=true (para dropdowns)", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder(viagens))
    const res = await get("http://localhost/api/crm/viagens?all=true")
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(2)
  })
})

describe("POST /api/crm/viagens", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await post({ titulo: "Feira" })
    expect(res.status).toBe(401)
  })

  it("retorna 400 sem título", async () => {
    const res = await post({ status: "PLANEJADA" })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Título é obrigatório" })
  })

  it("cria viagem com investimentos em transação", async () => {
    const tx = { insert: vi.fn(() => createQueryBuilder([{ id: 1, titulo: "Feira Agritech" }])) }
    db.transaction = vi.fn((cb: any) => cb(tx))
    const res = await post({
      titulo: "Feira Agritech",
      destinoCidade: "São Paulo",
      destinoUf: "SP",
      investimentos: [
        { tipo: "PASSAGEM", valor: 500, observacao: "Voo ida e volta" },
        { tipo: "HOSPEDAGEM", valor: "", observacao: "" },
      ],
    })
    expect(res.status).toBe(201)
    expect(db.transaction).toHaveBeenCalled()
    expect((tx.insert as ReturnType<typeof vi.fn>).mock.results[0].value.values).toHaveBeenCalledWith(
      expect.objectContaining({ titulo: "Feira Agritech", status: "PLANEJADA", criadoPor: 1 })
    )
    expect(await res.json()).toEqual({ id: 1, titulo: "Feira Agritech" })
  })
})
