// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notificarDelecao } from "@/lib/notificar"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, DELETE } from "./route"

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

function get(id: string) {
  return GET(new NextRequest(`http://localhost/api/crm/oportunidades/${id}`), {
    params: Promise.resolve({ id }),
  })
}

function del(id: string) {
  return DELETE(new NextRequest(`http://localhost/api/crm/oportunidades/${id}`), {
    params: Promise.resolve({ id }),
  })
}

function txMock() {
  return {
    select: vi.fn(() => createQueryBuilder([])),
    delete: vi.fn(() => createQueryBuilder(undefined)),
  }
}

describe("GET /api/crm/oportunidades/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await get("1")
    expect(res.status).toBe(401)
  })

  it("retorna 404 quando a oportunidade não existe", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await get("99")
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Oportunidade não encontrada" })
  })

  it("retorna a oportunidade com faturamentos e pedidos de venda", async () => {
    const oportunidade = {
      id: 1,
      titulo: "Venda de malha 100% algodão",
      contatoId: null,
      propostas: [],
    }
    db.select
      .mockReturnValueOnce(createQueryBuilder([oportunidade]))
      .mockReturnValueOnce(createQueryBuilder([]))
      .mockReturnValueOnce(createQueryBuilder([{ id: 10, numero: "NF-001", status: "EMITIDO", origem: "MANUAL", total: 1250 }]))
      .mockReturnValueOnce(createQueryBuilder([{ id: 11, numero: "PV-001", status: "ABERTO", origem: "MANUAL", total: 850 }]))

    const res = await get("1")
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(1)
    expect(body.propostas).toEqual([])
    expect(body.faturamentos).toHaveLength(1)
    expect(body.faturamentos[0]).toMatchObject({ numero: "NF-001", total: 1250 })
    expect(body.pedidosVenda).toHaveLength(1)
    expect(body.pedidosVenda[0]).toMatchObject({ numero: "PV-001", total: 850 })
    expect(db.select).toHaveBeenCalledTimes(4)
  })
})

describe("DELETE /api/crm/oportunidades/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
    db.transaction = vi.fn((cb: any) => cb(txMock()))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await del("1")
    expect(res.status).toBe(401)
  })

  it("retorna 403 para usuário não administrador", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: { user: { id: "2", role: "CRM" } }, userId: 2 } as any)
    const res = await del("1")
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "Apenas administradores podem excluir" })
  })

  it("exclui a oportunidade e tudo vinculado em transação", async () => {
    const res = await del("5")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(db.transaction).toHaveBeenCalled()
    expect(notificarDelecao).toHaveBeenCalledWith("Oportunidade CRM", "5", "Tiago")
  })

  it("propaga erro quando a exclusão falha", async () => {
    db.transaction = vi.fn(() => {
      throw new Error("fk violation")
    })
    const res = await del("5")
    expect(res.status).toBe(500)
  })
})
