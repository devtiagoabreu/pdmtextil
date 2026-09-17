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
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
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
  slaPrimeiraRespostaPrazo: new Date("2026-10-01T12:00:00.000Z"),
  slaResolucaoPrazo: new Date("2026-10-05T12:00:00.000Z"),
  primeiraRespostaEm: null,
  resolvidoEm: null,
  fechadoEm: null,
  anexos: [],
  ativo: true,
  createdAt: new Date("2026-09-16T10:00:00.000Z"),
  updatedAt: new Date("2026-09-16T10:00:00.000Z"),
}

function post(id: string, body: unknown) {
  return POST(
    new NextRequest(`http://localhost/api/chamados/${id}/mensagens`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id }) }
  )
}

describe("POST /api/chamados/[id]/mensagens", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionUser as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await post("3", { mensagem: "ok" })
    expect(res.status).toBe(401)
  })

  it("retorna 400 sem mensagem", async () => {
    const res = await post("3", {})
    expect(res.status).toBe(400)
  })

  it("bloqueia tipo SISTEMA", async () => {
    const res = await post("3", { tipo: "SISTEMA", mensagem: "ok" })
    expect(res.status).toBe(400)
  })

  it("retorna 404 quando o chamado não existe", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await post("3", { mensagem: "ok" })
    expect(res.status).toBe(404)
  })

  it("responde o chamado e marca primeira resposta", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([ticketRow]))
    db.insert.mockReturnValueOnce(
      createQueryBuilder([{ id: 200, ticketId: 3, autorId: 10, tipo: "RESPOSTA", mensagem: "ok", anexos: [], createdAt: new Date() }])
    )
    db.update.mockReturnValueOnce(createQueryBuilder([]))
    const res = await post("3", { mensagem: "ok" })
    expect(res.status).toBe(201)
    expect((await res.json()).mensagem).toBe("ok")
  })
})