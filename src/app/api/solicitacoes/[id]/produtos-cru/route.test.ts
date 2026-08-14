// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, POST, DELETE } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), update: vi.fn(), transaction: vi.fn() },
}))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }

const params = { params: Promise.resolve({ id: "5" }) }

function req(method: "GET" | "POST" | "DELETE", body?: unknown) {
  return new NextRequest("http://localhost/api/solicitacoes/5/produtos-cru", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

function mockAuth() {
  vi.mocked(requireAuth).mockReset()
  vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
}

function mockTransaction() {
  const tx = { update: vi.fn(() => createQueryBuilder(undefined)) }
  ;(db.transaction as ReturnType<typeof vi.fn>).mockReset()
  ;(db.transaction as ReturnType<typeof vi.fn>).mockImplementation(async (cb: any) => cb(tx))
  return tx
}

describe("GET /api/solicitacoes/[id]/produtos-cru", () => {
  beforeEach(() => {
    resetDb(db)
    mockAuth()
    db.select = vi.fn(() => createQueryBuilder([{ id: 1, codigoPdm: "TEC-001" }]))
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await GET(req("GET"), params as any)
    expect(res.status).toBe(401)
  })

  it("retorna a lista de produtos vinculados", async () => {
    const res = await GET(req("GET"), params as any)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 1, codigoPdm: "TEC-001" }])
  })
})

describe("POST /api/solicitacoes/[id]/produtos-cru", () => {
  beforeEach(() => {
    resetDb(db)
    mockAuth()
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await POST(req("POST", { produtos: [1] }), params as any)
    expect(res.status).toBe(401)
  })

  it("retorna 400 sem produtos", async () => {
    const res = await POST(req("POST", { produtos: [] }), params as any)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Selecione ao menos um produto" })
  })

  it("retorna 404 quando a solicitação não existe", async () => {
    db.select = vi.fn(() => createQueryBuilder([]))
    const res = await POST(req("POST", { produtos: [1] }), params as any)
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Solicitação não encontrada" })
  })

  it("vincula produtos e muda status PENDENTE para EM_DESENVOLVIMENTO", async () => {
    db.select = vi.fn(() =>
      createQueryBuilder([{ status: "PENDENTE", historicoComunicacao: [] }])
    )
    const tx = mockTransaction()

    const res = await POST(req("POST", { produtos: [1, 2] }), params as any)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })

    const txUpdate = tx.update as ReturnType<typeof vi.fn>
    expect(txUpdate).toHaveBeenCalledTimes(2)
    const builders = txUpdate.mock.results.map((r) => r.value)
    expect(builders[0].set).toHaveBeenCalledWith(
      expect.objectContaining({ solicitacaoDesenvolvimentoId: 5 })
    )
    expect(builders[1].set).toHaveBeenCalledWith(
      expect.objectContaining({ status: "EM_DESENVOLVIMENTO" })
    )
    const historico = builders[1].set.mock.calls[0][0].historicoComunicacao
    expect(historico[0]).toMatchObject({ acao: "MUDANCA_STATUS", de: "PENDENTE", para: "EM_DESENVOLVIMENTO" })
  })

  it("mantém o status quando a solicitação não está PENDENTE", async () => {
    db.select = vi.fn(() =>
      createQueryBuilder([{ status: "EM_DESENVOLVIMENTO", historicoComunicacao: [] }])
    )
    const tx = mockTransaction()

    const res = await POST(req("POST", { produtos: [1] }), params as any)
    expect(res.status).toBe(200)

    const txUpdate = tx.update as ReturnType<typeof vi.fn>
    expect(txUpdate).toHaveBeenCalledTimes(1)
  })
})

describe("DELETE /api/solicitacoes/[id]/produtos-cru", () => {
  beforeEach(() => {
    resetDb(db)
    mockAuth()
    db.update = vi.fn(() => createQueryBuilder(undefined))
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await DELETE(req("DELETE", { produtos: [1] }), params as any)
    expect(res.status).toBe(401)
  })

  it("retorna 400 sem produtos", async () => {
    const res = await DELETE(req("DELETE", { produtos: [] }), params as any)
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Selecione ao menos um produto" })
  })

  it("desvincula os produtos da solicitação", async () => {
    const res = await DELETE(req("DELETE", { produtos: [1, 2] }), params as any)
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })

    const builder = (db.update as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(builder.set).toHaveBeenCalledWith(
      expect.objectContaining({ solicitacaoDesenvolvimentoId: null })
    )
  })
})
