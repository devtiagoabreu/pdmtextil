// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notificar } from "@/lib/notificar"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { DELETE, PUT } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificar: vi.fn(),
  notificarErro: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { transaction: vi.fn() },
}))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }
const sessionVendedor = { session: { user: { id: "2", role: "VENDEDOR", name: "Ana" } }, userId: 2 }

function del(id: string) {
  return DELETE(new NextRequest(`http://localhost/api/crm/contatos/${id}`), {
    params: Promise.resolve({ id }),
  })
}

function txMock() {
  return {
    update: vi.fn(() => createQueryBuilder(undefined)),
    delete: vi.fn(() => createQueryBuilder(undefined)),
  }
}

describe("DELETE /api/crm/contatos/[id]", () => {
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
    vi.mocked(requireAuth).mockResolvedValue(sessionVendedor as any)
    const res = await del("1")
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "Apenas administradores podem excluir" })
    expect(db.transaction).not.toHaveBeenCalled()
  })

  it("exclui o contato e desvincula referências em transação", async () => {
    const res = await del("4")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(db.transaction).toHaveBeenCalled()
    expect(notificar).not.toHaveBeenCalled()
  })

  it("propaga erro quando a exclusão falha", async () => {
    db.transaction = vi.fn(() => {
      throw new Error("fk violation")
    })
    const res = await del("4")
    expect(res.status).toBe(500)
  })
})

describe("PUT /api/crm/contatos/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
    db.select = vi.fn(() => createQueryBuilder([{ id: 1, nome: "Ana", empresaId: 5, clienteId: null }]))
    db.update = vi.fn(() => createQueryBuilder([{ id: 1, nome: "Ana", empresaId: 5, clienteId: null }]))
  })

  function put(id: string, body: Record<string, unknown>) {
    return PUT(
      new NextRequest(`http://localhost/api/crm/contatos/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
      { params: Promise.resolve({ id }) }
    )
  }

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await put("1", { nome: "Ana" })
    expect(res.status).toBe(401)
  })

  it("retorna 404 quando o contato não existe", async () => {
    db.select = vi.fn(() => createQueryBuilder([]))
    const res = await put("99", { nome: "Ana" })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Contato não encontrado" })
  })

  it("vincula a um cliente e limpa o vínculo anterior com pessoa", async () => {
    await put("1", { clienteId: "9" })
    const builder = (db.update as ReturnType<typeof vi.fn>).mock.results[0].value
    const setValues = builder.set.mock.calls[0][0]
    expect(setValues).toMatchObject({ clienteId: 9, empresaId: null })
  })

  it("desvincula o contato quando envia vínculos nulos", async () => {
    await put("1", { empresaId: null, clienteId: null })
    const builder = (db.update as ReturnType<typeof vi.fn>).mock.results[0].value
    const setValues = builder.set.mock.calls[0][0]
    expect(setValues).toMatchObject({ empresaId: null, clienteId: null })
  })
})
