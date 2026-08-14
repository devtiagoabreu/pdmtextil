// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { notificarDelecao } from "@/lib/notificar"
import { createQueryBuilder } from "@/test/route-db-mock"
import { DELETE } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificar: vi.fn(),
  notificarErro: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { transaction: vi.fn() },
}))

const session = { user: { name: "Tiago" } }

function del(id: string) {
  return DELETE(new NextRequest(`http://localhost/api/cadastros/clientes/${id}`), {
    params: Promise.resolve({ id }),
  })
}

function txMock() {
  return {
    delete: vi.fn(() => createQueryBuilder([{ id: 5, nome: "Cliente Teste" }])),
    update: vi.fn(() => createQueryBuilder(undefined)),
    execute: vi.fn(() => createQueryBuilder(undefined)),
  }
}

describe("DELETE /api/cadastros/clientes/[id]", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    db.transaction = vi.fn((cb: any) => cb(txMock()))
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 sem sessão", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await del("5")
    expect(res.status).toBe(401)
  })

  it("exclui o cliente e desvincula referências em transação", async () => {
    const res = await del("5")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(db.transaction).toHaveBeenCalled()
    expect(notificarDelecao).toHaveBeenCalledWith("Cliente", "Cliente Teste", "Tiago")
  })

  it("retorna 404 quando o cliente não existe", async () => {
    db.transaction = vi.fn((cb: any) => cb({ ...txMock(), delete: vi.fn(() => createQueryBuilder([])) }))
    const res = await del("999")
    expect(res.status).toBe(404)
  })

  it("propaga erro quando a exclusão falha", async () => {
    db.transaction = vi.fn(() => {
      throw new Error("fk violation")
    })
    const res = await del("5")
    expect(res.status).toBe(500)
  })
})
