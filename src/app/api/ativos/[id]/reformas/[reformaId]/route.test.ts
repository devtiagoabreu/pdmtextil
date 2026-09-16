// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { PUT, DELETE } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }
const sessionCrm = { session: { user: { id: "2", role: "CRM", name: "Maria" } }, userId: 2 }

const reformaRow = {
  id: 41,
  ativoId: 3,
  data: "2025-06-15",
  valor: "3000",
  extensaoVidaUtilAnos: 2,
  motivo: "Beneficiamento",
  descricao: null,
  createdAt: new Date("2025-06-15T00:00:00.000Z"),
  updatedAt: new Date("2025-06-15T00:00:00.000Z"),
}

function put(body: unknown) {
  return PUT(
    new NextRequest("http://localhost/api/ativos/3/reformas/41", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "3", reformaId: "41" }) }
  )
}

function del() {
  return DELETE(new NextRequest("http://localhost/api/ativos/3/reformas/41"), {
    params: Promise.resolve({ id: "3", reformaId: "41" }),
  })
}

describe("PUT /api/ativos/[id]/reformas/[reformaId]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await put({ data: "2025-06-20", valor: 3500 })
    expect(res.status).toBe(401)
  })

  it("retorna 404 quando a reforma não existe no ativo", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await put({ data: "2025-06-20" })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Reforma não encontrada" })
  })

  it("atualiza a reforma do ativo", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([reformaRow]))
    db.update.mockReturnValueOnce(
      createQueryBuilder([{ ...reformaRow, valor: "3500", data: "2025-06-20" }])
    )

    const res = await put({ data: "2025-06-20", valor: 3500 })

    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.valor).toBe("3500")
  })
})

describe("DELETE /api/ativos/[id]/reformas/[reformaId]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await del()
    expect(res.status).toBe(401)
  })

  it("retorna 403 para usuário não administrador", async () => {
    vi.mocked(requireAuth).mockResolvedValue(sessionCrm as any)
    const res = await del()
    expect(res.status).toBe(403)
    expect(await res.json()).toEqual({ error: "Apenas administradores podem excluir" })
  })

  it("retorna 404 quando a reforma não existe", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await del()
    expect(res.status).toBe(404)
  })

  it("exclui a reforma do ativo", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([reformaRow]))
    db.delete.mockReturnValueOnce(createQueryBuilder(undefined))
    const res = await del()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(db.delete).toHaveBeenCalled()
  })
})
