// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notificar } from "@/lib/notificar"
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

function req(id: string, method = "GET") {
  return new NextRequest(`http://localhost/api/crm/viagens/${id}`, { method })
}

function get(id: string) {
  return GET(req(id), { params: Promise.resolve({ id }) })
}

function put(id: string, body: Record<string, unknown>) {
  return PUT(
    new NextRequest(`http://localhost/api/crm/viagens/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  )
}

function del(id: string) {
  return DELETE(req(id, "DELETE"), { params: Promise.resolve({ id }) })
}

describe("GET /api/crm/viagens/[id]", () => {
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

  it("retorna 404 quando a viagem não existe", async () => {
    db.select.mockReturnValue(createQueryBuilder([]))
    const res = await get("99")
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Viagem não encontrada" })
  })

  it("retorna viagem com investimentos e visitas vinculadas", async () => {
    db.select
      .mockReturnValueOnce(createQueryBuilder([{ id: 1, titulo: "Feira Agritech", status: "PLANEJADA" }]))
      .mockReturnValueOnce(createQueryBuilder([{ id: 10, tipo: "PASSAGEM", valor: 500 }]))
      .mockReturnValueOnce(createQueryBuilder([{ id: 3, dataVisita: "2026-07-01", nomeAvulso: "Cliente X" }]))
    const res = await get("1")
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.titulo).toBe("Feira Agritech")
    expect(body.investimentos).toHaveLength(1)
    expect(body.visitas).toHaveLength(1)
  })
})

describe("PUT /api/crm/viagens/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await put("1", { titulo: "X" })
    expect(res.status).toBe(401)
  })

  it("retorna 400 quando o título é vazio", async () => {
    db.select.mockReturnValue(createQueryBuilder([{ id: 1, criadoPor: 1 }]))
    const res = await put("1", { titulo: "  " })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Título é obrigatório" })
  })

  it("retorna 403 quando não é o criador e não é admin", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: { user: { id: "2", role: "GERENTE" } }, userId: 2 } as any)
    db.select.mockReturnValue(createQueryBuilder([{ id: 1, criadoPor: 1 }]))
    const res = await put("1", { titulo: "X" })
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "Apenas o criador da viagem pode editá-la" })
  })

  it("atualiza a viagem e substitui investimentos em transação", async () => {
    const tx = {
      update: vi.fn(() => createQueryBuilder([{ id: 1, titulo: "Feira 2026" }])),
      delete: vi.fn(() => createQueryBuilder(undefined)),
      insert: vi.fn(() => createQueryBuilder([{ id: 20 }])),
    }
    db.select.mockReturnValue(createQueryBuilder([{ id: 1, criadoPor: 1, titulo: "Feira" }]))
    db.transaction = vi.fn((cb: any) => cb(tx))
    const res = await put("1", {
      titulo: "Feira 2026",
      status: "EM_ANDAMENTO",
      investimentos: [{ tipo: "PASSAGEM", valor: 700, observacao: "Voo" }],
    })
    expect(res.status).toBe(200)
    expect(db.transaction).toHaveBeenCalled()
    expect(tx.delete).toHaveBeenCalled()
    expect(notificar).toHaveBeenCalledWith("VIAGEM_ATUALIZADA", expect.stringContaining("Feira 2026"), expect.stringContaining("/1"), "Tiago")
  })
})

describe("DELETE /api/crm/viagens/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await del("1")
    expect(res.status).toBe(401)
  })

  it("retorna 404 quando a viagem não existe", async () => {
    db.select.mockReturnValue(createQueryBuilder([]))
    const res = await del("99")
    expect(res.status).toBe(404)
  })

  it("retorna 403 quando não é o criador e não é admin", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session: { user: { id: "2", role: "GERENTE" } }, userId: 2 } as any)
    db.select.mockReturnValue(createQueryBuilder([{ id: 1, criadoPor: 1 }]))
    const res = await del("1")
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "Apenas o criador da viagem pode excluí-la" })
  })

  it("desvincula visitas e exclui a viagem em transação", async () => {
    const tx = {
      update: vi.fn(() => createQueryBuilder(undefined)),
      delete: vi.fn(() => createQueryBuilder(undefined)),
    }
    db.select.mockReturnValue(createQueryBuilder([{ id: 1, criadoPor: 1, titulo: "Feira" }]))
    db.transaction = vi.fn((cb: any) => cb(tx))
    const res = await del("1")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(db.transaction).toHaveBeenCalled()
    expect(tx.update).toHaveBeenCalled()
    expect(tx.delete).toHaveBeenCalled()
  })

  it("propaga erro quando a exclusão falha", async () => {
    db.select.mockReturnValue(createQueryBuilder([{ id: 1, criadoPor: 1 }]))
    db.transaction = vi.fn(() => {
      throw new Error("fk violation")
    })
    const res = await del("1")
    expect(res.status).toBe(500)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })
})
