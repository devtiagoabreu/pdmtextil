// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { POST } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/chamados/notificar", () => ({
  notificarChamado: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))

const sessionUser = { session: { user: { id: "10", role: "Tecnico", name: "Marcos" } }, userId: 10 }

const ticketRow = {
  id: 3,
  titulo: "Computador não liga",
  descricao: "x",
  categoria: "INCIDENTE",
  status: "ABERTO",
  prioridade: "ALTA",
  areaId: 2,
  solicitanteId: 5,
  responsavelId: null,
  slaPrimeiraRespostaPrazo: null,
  slaResolucaoPrazo: null,
  primeiraRespostaEm: null,
  resolvidoEm: null,
  fechadoEm: null,
  anexos: [],
  ativo: true,
  createdAt: new Date("2026-09-16T10:00:00.000Z"),
  updatedAt: new Date("2026-09-16T10:00:00.000Z"),
}

function post(id: string, body: unknown = {}) {
  return POST(
    new NextRequest(`http://localhost/api/chamados/${id}/assumir`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  )
}

describe("POST /api/chamados/[id]/assumir", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionUser as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await post("3")
    expect(res.status).toBe(401)
  })

  it("retorna 404 quando o chamado não existe", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await post("3")
    expect(res.status).toBe(404)
  })

  it("assumir define responsável como usuário logado em corpo vazio", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([ticketRow]))
    db.update.mockReturnValueOnce(createQueryBuilder([{ ...ticketRow, responsavelId: 10 }]))
    const res = await post("3")
    expect(res.status).toBe(200)
    expect((await res.json()).responsavelId).toBe(10)
  })

  it("designa responsável informado", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([ticketRow]))
    db.update.mockReturnValueOnce(createQueryBuilder([{ ...ticketRow, responsavelId: 99 }]))
    const res = await post("3", { responsavelId: 99 })
    expect(res.status).toBe(200)
    expect((await res.json()).responsavelId).toBe(99)
  })
})