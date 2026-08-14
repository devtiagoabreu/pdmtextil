// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notificarDelecao } from "@/lib/notificar"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { DELETE } from "./route"

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

function del(id: string) {
  return DELETE(new NextRequest(`http://localhost/api/crm/propostas/${id}`), {
    params: Promise.resolve({ id }),
  })
}

function txMock() {
  return {
    select: vi.fn(() => createQueryBuilder([])),
    delete: vi.fn(() => createQueryBuilder(undefined)),
  }
}

describe("DELETE /api/crm/propostas/[id]", () => {
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

  it("exclui a proposta e limpa os eventos de timeline em transação", async () => {
    const res = await del("9")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(db.transaction).toHaveBeenCalled()
    expect(notificarDelecao).toHaveBeenCalledWith("Proposta CRM", "9", "Tiago")
  })

  it("propaga erro quando a exclusão falha", async () => {
    db.transaction = vi.fn(() => {
      throw new Error("fk violation")
    })
    const res = await del("9")
    expect(res.status).toBe(500)
  })
})
