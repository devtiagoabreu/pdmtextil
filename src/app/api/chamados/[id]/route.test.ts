// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, PUT } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn() },
}))

const sessionUser = { session: { user: { id: "10", role: "Tecnico", name: "Marcos" } }, userId: 10 }

const ticketRow = {
  id: 7,
  titulo: "Computador não liga",
  descricao: "Computador não liga",
  categoria: "INCIDENTE",
  status: "ABERTO",
  prioridade: "ALTA",
  areaId: 2,
  areaNome: "TI",
  solicitanteId: 5,
  solicitanteNome: "João",
  responsavelId: null,
  responsavelNome: null,
  ativoId: null,
  ativoNome: null,
  ativoCodigo: null,
  processoId: null,
  processoNome: null,
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

function get() {
  return GET(new NextRequest("http://localhost/api/chamados/7"), {
    params: Promise.resolve({ id: "7" }),
  })
}

function put(body: unknown) {
  return PUT(
    new NextRequest("http://localhost/api/chamados/7", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
    { params: Promise.resolve({ id: "7" }) }
  )
}

describe("GET /api/chamados/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionUser as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await get()
    expect(res.status).toBe(401)
  })

  it("retorna 404 quando o chamado não existe", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await get()
    expect(res.status).toBe(404)
  })

  it("retorna o chamado com mensagens", async () => {
    db.select
      .mockReturnValueOnce(createQueryBuilder([ticketRow]))
      .mockReturnValueOnce(
        createQueryBuilder([
          { id: 100, ticketId: 7, autorId: 5, autorNome: "João", tipo: "RESPOSTA", mensagem: "ok", anexos: [], createdAt: new Date() },
        ])
      )
    const res = await get()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.id).toBe(7)
    expect(body.mensagens).toHaveLength(1)
    expect(body.mensagens[0].mensagem).toBe("ok")
  })
})

describe("PUT /api/chamados/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionUser as any)
  })

  it("retorna 400 sem titulo", async () => {
    const res = await put({ descricao: "x", categoria: "INCIDENTE", prioridade: "MEDIA", areaId: 1 })
    expect(res.status).toBe(400)
  })

  it("retorna 404 quando o chamado não existe", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await put({
      titulo: "Novo título",
      descricao: "x",
      categoria: "INCIDENTE",
      prioridade: "MEDIA",
      areaId: 2,
    })
    expect(res.status).toBe(404)
  })

  it("atualiza o chamado", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([{ ...ticketRow }]))
    db.update.mockReturnValueOnce(createQueryBuilder([{ ...ticketRow, titulo: "Novo título" }]))
    const res = await put({
      titulo: "Novo título",
      descricao: "descricao maior",
      categoria: "SOLICITACAO",
      prioridade: "BAIXA",
      areaId: 2,
    })
    expect(res.status).toBe(200)
    expect((await res.json()).titulo).toBe("Novo título")
  })
})