// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { POST } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({ db: { select: vi.fn(), transaction: vi.fn() } }))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }

function post(body: any) {
  return POST(new NextRequest("http://localhost/api/representantes", {
    method: "POST",
    body: JSON.stringify(body),
  }))
}

function txMock() {
  return {
    insert: vi.fn((..._args: any[]) => createQueryBuilder([{ id: 99 }])),
    delete: vi.fn((..._args: any[]) => createQueryBuilder(undefined)),
  }
}

describe("POST /api/representantes", () => {
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
    const res = await post({ nome: "Rep", cnpj: "123" })
    expect(res.status).toBe(401)
  })

  it("retorna 400 quando CNPJ é obrigatório", async () => {
    const res = await post({ nome: "Rep" })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "CNPJ é obrigatório" })
  })

  it("retorna 409 quando o CNPJ já existe", async () => {
    db.select.mockReturnValue(createQueryBuilder([{ id: 1 }]))
    const res = await post({ nome: "Rep", cnpj: "11.222.333/0001-44" })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: "CNPJ já cadastrado" })
  })

  it("cria representante e vincula clientes em transação", async () => {
    const tx = txMock()
    db.transaction = vi.fn((cb: any) => cb(tx))

    const res = await post({
      nome: "Rep Teste",
      cnpj: "11.222.333/0001-44",
      razaoSocial: "Rep Ltda",
      gerenteId: 3,
      clientesIds: [9, 7],
    })

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual({ id: 99 })

    expect(tx.insert).toHaveBeenCalledTimes(2)
    const repValues = tx.insert.mock.results[0].value.values.mock.calls[0][0]
    expect(repValues).toMatchObject({ nome: "Rep Teste", cnpj: "11.222.333/0001-44", gerenteId: 3 })
    const vinculos = tx.insert.mock.results[1].value.values.mock.calls[0][0]
    expect(vinculos).toEqual([
      { clienteId: 9, representanteId: 99 },
      { clienteId: 7, representanteId: 99 },
    ])
  })

  it("cria representante sem vínculos quando clientesIds vazio", async () => {
    const tx = txMock()
    db.transaction = vi.fn((cb: any) => cb(tx))

    const res = await post({ nome: "Rep Teste", cnpj: "11.222.333/0001-44" })
    expect(res.status).toBe(201)
    expect(tx.insert).toHaveBeenCalledTimes(1)
  })
})
