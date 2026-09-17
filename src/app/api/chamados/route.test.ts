// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, POST } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/chamados/notificar", () => ({
  notificarChamado: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn() },
}))

const sessionUser = { session: { user: { id: "10", role: "Tecnico", name: "Marcos" } }, userId: 10 }

const ticketRow = {
  id: 1,
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
  createdAt: new Date("2026-09-16T10:00:00.000Z"),
  updatedAt: new Date("2026-09-16T10:00:00.000Z"),
}

function getList() {
  return GET(new NextRequest("http://localhost/api/chamados"))
}

function getWithParam(param: string) {
  return GET(new NextRequest(`http://localhost/api/chamados?${param}`))
}

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/chamados", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  )
}

describe("GET /api/chamados", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionUser as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await getList()
    expect(res.status).toBe(401)
  })

  it("lista chamados ativos", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([ticketRow]))
    const res = await getList()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].titulo).toBe("Computador não liga")
  })

  it("filtra por status", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([ticketRow]))
    const res = await getWithParam("status=ABERTO")
    expect(res.status).toBe(200)
    expect((await res.json()).length).toBeGreaterThanOrEqual(1)
  })
})

describe("POST /api/chamados", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionUser as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await post({ titulo: "Teste", descricao: "Teste", categoria: "INCIDENTE", prioridade: "MEDIA", areaId: 1 })
    expect(res.status).toBe(401)
  })

  it("retorna 400 sem titulo", async () => {
    const res = await post({ descricao: "Teste", categoria: "INCIDENTE", prioridade: "MEDIA", areaId: 1 })
    expect(res.status).toBe(400)
  })

  it("cria chamado com dados válidos", async () => {
    db.insert.mockReturnValueOnce(createQueryBuilder([{ ...ticketRow, id: 50 }]))
    const res = await post({
      titulo: "Teste",
      descricao: "Problema",
      categoria: "INCIDENTE",
      prioridade: "MEDIA",
      areaId: 2,
    })
    expect(res.status).toBe(201)
    expect((await res.json()).id).toBe(50)
  })
})