// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, PUT, DELETE } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), transaction: vi.fn() },
}))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }

function get(id: string) {
  return GET(new NextRequest(`http://localhost/api/representantes/${id}`), {
    params: Promise.resolve({ id }),
  })
}

function put(id: string, body: any) {
  return PUT(new NextRequest(`http://localhost/api/representantes/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  }), { params: Promise.resolve({ id }) })
}

function del(id: string) {
  return DELETE(new NextRequest(`http://localhost/api/representantes/${id}`), {
    params: Promise.resolve({ id }),
  })
}

function txMock(updateResult: any = [{ id: 5 }]) {
  return {
    update: vi.fn((..._args: any[]) => createQueryBuilder(updateResult)),
    insert: vi.fn((..._args: any[]) => createQueryBuilder([{ id: 1 }])),
    delete: vi.fn((..._args: any[]) => createQueryBuilder(undefined)),
  }
}

describe("GET /api/representantes/[id]", () => {
  beforeEach(() => {
    resetDb(db)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 404 quando não encontrado", async () => {
    db.select.mockReturnValue(createQueryBuilder([]))
    const res = await get("5")
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Representante não encontrado" })
  })

  it("retorna o representante com os clientes vinculados", async () => {
    db.select
      .mockReturnValueOnce(createQueryBuilder([{ id: 5, nome: "Rep ABC" }]))
      .mockReturnValueOnce(createQueryBuilder([{ id: 9, nome: "Tecelagem Beta" }]))
    const res = await get("5")
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.nome).toBe("Rep ABC")
    expect(data.clientes).toEqual([{ id: 9, nome: "Tecelagem Beta" }])
  })
})

describe("PUT /api/representantes/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
    db.select.mockReturnValue(createQueryBuilder([]))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await put("5", { nome: "Rep ABC", cnpj: "11222333000144" })
    expect(res.status).toBe(401)
  })

  it("atualiza o representante e substitui os vínculos em transação", async () => {
    const tx = txMock([{ id: 5, nome: "Rep ABC" }])
    db.transaction = vi.fn((cb: any) => cb(tx))

    const res = await put("5", {
      nome: "Rep ABC",
      cnpj: "11.222.333/0001-44",
      gerenteId: 2,
      idIntegracao: "ERP-1",
      clientesIds: [9, 7],
    })

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ id: 5, nome: "Rep ABC" })
    expect(tx.update).toHaveBeenCalled()
    expect(tx.delete).toHaveBeenCalled()
    const vinculos = tx.insert.mock.results[0].value.values.mock.calls[0][0]
    expect(vinculos).toEqual([
      { clienteId: 9, representanteId: 5 },
      { clienteId: 7, representanteId: 5 },
    ])
  })

  it("atualiza removendo todos os vínculos quando clientesIds vazio", async () => {
    const tx = txMock([{ id: 5, nome: "Rep ABC" }])
    db.transaction = vi.fn((cb: any) => cb(tx))

    const res = await put("5", { nome: "Rep ABC", cnpj: "11222333000144", clientesIds: [] })
    expect(res.status).toBe(200)
    expect(tx.delete).toHaveBeenCalled()
    expect(tx.insert).not.toHaveBeenCalled()
  })

  it("retorna 409 quando o CNPJ pertence a outro representante", async () => {
    db.select.mockReturnValue(createQueryBuilder([{ id: 8 }]))
    const res = await put("5", { nome: "Rep ABC", cnpj: "11222333000144" })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: "CNPJ já cadastrado em outro representante" })
  })
})

describe("DELETE /api/representantes/[id]", () => {
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
    const res = await del("3")
    expect(res.status).toBe(401)
  })

  it("exclui o representante e seus vínculos em transação", async () => {
    const res = await del("3")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(db.transaction).toHaveBeenCalled()
  })

  it("propaga erro quando a exclusão falha", async () => {
    db.transaction = vi.fn(() => {
      throw new Error("fk violation")
    })
    const res = await del("3")
    expect(res.status).toBe(500)
  })
})
