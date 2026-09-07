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

const faturamentos = [
  { id: 1, oportunidadeId: 1, oportunidadeTitulo: "Malha penteada", numero: "FAT-001", status: "EMITIDO" },
  { id: 2, oportunidadeId: 1, oportunidadeTitulo: "Malha penteada", numero: "FAT-002", status: "RECEBIDO" },
]

function get(url: string) {
  return GET(new NextRequest(url))
}

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/crm/faturamentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  )
}

describe("GET /api/crm/faturamentos", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await get("http://localhost/api/crm/faturamentos")
    expect(res.status).toBe(401)
  })

  it("lista faturamentos paginados com total", async () => {
    db.select
      .mockReturnValueOnce(createQueryBuilder(faturamentos))
      .mockReturnValueOnce(createQueryBuilder([{ total: 2 }]))
    const res = await get("http://localhost/api/crm/faturamentos")
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toHaveLength(2)
    expect(body.total).toBe(2)
    expect(body.page).toBe(1)
    expect(body.totalPages).toBe(1)
    expect(body.limit).toBe(50)
  })

  it("aplica filtro where quando há busca ou status", async () => {
    db.select
      .mockReturnValueOnce(createQueryBuilder([]))
      .mockReturnValueOnce(createQueryBuilder([{ total: 0 }]))
    await get("http://localhost/api/crm/faturamentos?q=FAT&status=EMITIDO")
    const builder = (db.select as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(builder.where).toHaveBeenCalled()
  })

  it("retorna array simples quando all=true (para dropdowns)", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder(faturamentos))
    const res = await get("http://localhost/api/crm/faturamentos?all=true")
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body).toHaveLength(2)
  })
})

describe("POST /api/crm/faturamentos", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await post({ oportunidadeId: 1 })
    expect(res.status).toBe(401)
  })

  it("retorna 400 sem oportunidade", async () => {
    const res = await post({ itens: [{ produto: "Tecido" }] })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Oportunidade é obrigatória" })
  })

  it("retorna 404 quando a oportunidade não existe", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await post({ oportunidadeId: 99 })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Oportunidade não encontrada" })
  })

  it("retorna 400 sem itens válidos", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([{ id: 1, titulo: "Malha penteada" }]))
    const res = await post({ oportunidadeId: 1, itens: [] })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Adicione ao menos um item com produto" })
  })

  it("cria faturamento com itens em transação", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([{ id: 1, titulo: "Malha penteada" }]))
    const tx = { insert: vi.fn(() => createQueryBuilder([{ id: 10, numero: "FAT-001", status: "EMITIDO" }])) }
    db.transaction = vi.fn((cb: any) => cb(tx))
    const res = await post({
      oportunidadeId: 1,
      numero: "FAT-001",
      status: "EMITIDO",
      itens: [
        { produto: "Malha penteada azul", codigo: "MP-01", unidade: "METROS", quantidade: 100, valorUnitario: 12.5, valorTotal: 1250 },
      ],
    })
    expect(res.status).toBe(201)
    expect(db.transaction).toHaveBeenCalled()
    expect(await res.json()).toEqual({ id: 10, numero: "FAT-001", status: "EMITIDO" })
  })
})