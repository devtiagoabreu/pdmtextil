// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { PATCH } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/chamados/notificar", () => ({
  notificarChamado: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}))

const sessionUser = { session: { user: { id: "10", role: "Tecnico", name: "Marcos" } }, userId: 10 }

const ticketRow = (overrides: Record<string, unknown> = {}) => ({
  id: 3,
  titulo: "Computador não liga",
  descricao: "x",
  categoria: "INCIDENTE",
  status: "ABERTO",
  prioridade: "ALTA",
  areaId: 2,
  solicitanteId: 5,
  responsavelId: null,
  slaPrimeiraRespostaPrazo: new Date("2026-10-01T12:00:00.000Z"),
  slaResolucaoPrazo: new Date("2026-10-05T12:00:00.000Z"),
  primeiraRespostaEm: null,
  resolvidoEm: null,
  fechadoEm: null,
  anexos: [],
  ativo: true,
  createdAt: new Date("2026-09-16T10:00:00.000Z"),
  updatedAt: new Date("2026-09-16T10:00:00.000Z"),
  ...overrides,
})

function patch(id: string, body: unknown) {
  return PATCH(
    new NextRequest(`http://localhost/api/chamados/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  )
}

describe("PATCH /api/chamados/[id]/status", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionUser as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await patch("3", { status: "RESOLVIDO" })
    expect(res.status).toBe(401)
  })

  it("retorna 400 sem status", async () => {
    const res = await patch("3", {})
    expect(res.status).toBe(400)
  })

  it("retorna 404 quando o chamado não existe", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await patch("3", { status: "RESOLVIDO" })
    expect(res.status).toBe(404)
  })

  it("resolve o chamado", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([ticketRow()]))
    db.update.mockReturnValueOnce(createQueryBuilder([ticketRow({ status: "RESOLVIDO" })]))
    const res = await patch("3", { status: "RESOLVIDO" })
    expect(res.status).toBe(200)
    expect((await res.json()).status).toBe("RESOLVIDO")
  })

  it("bloqueia mudança de um chamado fechado para algo que não seja reaberto", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([ticketRow({ status: "FECHADO" })]))
    const res = await patch("3", { status: "CANCELADO" })
    expect(res.status).toBe(400)
  })
})