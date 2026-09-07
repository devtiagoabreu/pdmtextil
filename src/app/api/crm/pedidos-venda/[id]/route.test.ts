// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, PUT, DELETE } from "./route"

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

const pedido = {
  id: 1,
  oportunidadeId: 1,
  oportunidadeTitulo: "Malha penteada",
  numero: "PV-001",
  dataEmissao: "2026-09-01",
  status: "ABERTO",
  observacao: null,
  origem: "MANUAL",
  referenciaExterna: null,
}

const itens = [
  { id: 1, pedidoVendaId: 1, produto: "Malha penteada azul", codigo: "MP-01", unidade: "METROS", quantidade: "100", valorUnitario: "12.5", valorTotal: "1250" },
]

function req(id: string, method = "GET", body?: Record<string, unknown>) {
  return new NextRequest(`http://localhost/api/crm/pedidos-venda/${id}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

async function get(id: string) {
  return GET(req(id), { params: Promise.resolve({ id }) })
}

describe("GET /api/crm/pedidos-venda/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await get("1")
    expect(res.status).toBe(401)
  })

  it("retorna 404 quando não existe", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await get("99")
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Pedido de venda não encontrado" })
  })

  it("retorna o pedido com itens", async () => {
    db.select
      .mockReturnValueOnce(createQueryBuilder([pedido]))
      .mockReturnValueOnce(createQueryBuilder(itens))
    const res = await get("1")
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(1)
    expect(body.numero).toBe("PV-001")
    expect(body.itens).toHaveLength(1)
    expect(db.select).toHaveBeenCalledTimes(2)
  })
})

describe("PUT /api/crm/pedidos-venda/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await PUT(req("1", "PUT", { status: "FATURADO" }), { params: Promise.resolve({ id: "1" }) })
    expect(res.status).toBe(401)
  })

  it("retorna 404 quando não existe", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await PUT(req("99", "PUT", { status: "FATURADO" }), { params: Promise.resolve({ id: "99" }) })
    expect(res.status).toBe(404)
  })

  it("retorna 400 com oportunidade inválida", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([pedido]))
    const res = await PUT(req("1", "PUT", { oportunidadeId: "" }), { params: Promise.resolve({ id: "1" }) })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Oportunidade é obrigatória" })
  })

  it("retorna 400 com lista de itens vazia", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([pedido]))
    const res = await PUT(req("1", "PUT", { status: "FATURADO", itens: [] }), { params: Promise.resolve({ id: "1" }) })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Adicione ao menos um item com produto" })
  })

  it("atualiza capa e substitui itens em transação", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([pedido]))
    const tx = {
      update: vi.fn(() => createQueryBuilder([{ id: 1, numero: "PV-001", status: "FATURADO" }])),
      delete: vi.fn(() => createQueryBuilder(undefined)),
      insert: vi.fn(() => createQueryBuilder(undefined)),
    }
    db.transaction = vi.fn((cb: any) => cb(tx))
    const res = await PUT(req("1", "PUT", { status: "FATURADO", itens: itens.map(i => ({ produto: i.produto, unidade: i.unidade, quantidade: Number(i.quantidade), valorUnitario: Number(i.valorUnitario), valorTotal: Number(i.valorTotal) })) }), { params: Promise.resolve({ id: "1" }) })
    expect(res.status).toBe(200)
    expect(db.transaction).toHaveBeenCalled()
    expect(await res.json()).toEqual({ id: 1, numero: "PV-001", status: "FATURADO" })
  })
})

describe("DELETE /api/crm/pedidos-venda/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await DELETE(req("1", "DELETE"), { params: Promise.resolve({ id: "1" }) })
    expect(res.status).toBe(401)
  })

  it("retorna 404 quando não existe", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await DELETE(req("99", "DELETE"), { params: Promise.resolve({ id: "99" }) })
    expect(res.status).toBe(404)
  })

  it("exclui itens e capa em transação", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([pedido]))
    const tx = { delete: vi.fn(() => createQueryBuilder(undefined)) }
    db.transaction = vi.fn((cb: any) => cb(tx))
    const res = await DELETE(req("1", "DELETE"), { params: Promise.resolve({ id: "1" }) })
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(db.transaction).toHaveBeenCalled()
    expect(tx.delete).toHaveBeenCalledTimes(2)
  })
})