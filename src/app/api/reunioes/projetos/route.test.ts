// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { reunioesProjetos } from "@/lib/db/schema"
import { GET, POST } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificar: vi.fn(),
  notificarErro: vi.fn(),
  notificarDelecao: vi.fn(),
}))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn() },
}))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }
const sessionQualidade = { session: { user: { id: "2", role: "QUALIDADE", name: "Ana" } }, userId: 2 }

const projetoRow = {
  id: 2,
  nome: "Systêxtil",
  descricao: null,
  dataInicio: null,
  dataFim: null,
  status: "EM_ANDAMENTO",
  cor: "#6366f1",
  ativo: true,
  createdAt: new Date("2026-09-10T10:00:00.000Z"),
  updatedAt: new Date("2026-09-10T10:00:00.000Z"),
}

function get(url = "http://localhost/api/reunioes/projetos") {
  return GET(new NextRequest(url))
}

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/reunioes/projetos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  )
}

describe("GET /api/reunioes/projetos", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await get()
    expect(res.status).toBe(401)
  })

  it("lista projetos", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([projetoRow]))
    const res = await get()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.projetos).toHaveLength(1)
    expect(body.projetos[0]).toEqual(expect.objectContaining({ id: 2, nome: "Systêxtil" }))
  })

  it("retorna lista vazia quando não há projetos", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    const res = await get()
    expect(res.status).toBe(200)
    expect((await res.json()).projetos).toEqual([])
  })
})

describe("POST /api/reunioes/projetos", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await post({ nome: "Novo" })
    expect(res.status).toBe(401)
  })

  it("retorna 403 para perfil sem permissão de escrita", async () => {
    vi.mocked(requireAuth).mockResolvedValue(sessionQualidade as any)
    const res = await post({ nome: "Novo" })
    expect(res.status).toBe(403)
  })

  it("retorna 400 sem nome", async () => {
    const res = await post({})
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "O nome do projeto é obrigatório." })
  })

  it("retorna 400 com cor inválida", async () => {
    const res = await post({ nome: "Novo", cor: "vermelho" })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Cor inválida (use #RRGGBB)." })
  })

  it("retorna 409 para nome duplicado (case-insensitive)", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([{ id: 5 }]))
    const res = await post({ nome: "systêxtil" })
    expect(res.status).toBe(409)
    expect(await res.json()).toEqual({ error: "Já existe um projeto com esse nome." })
    expect(db.insert).not.toHaveBeenCalled()
  })

  it("cria projeto com sucesso", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([]))
    db.insert.mockReturnValueOnce(createQueryBuilder([projetoRow]))

    const res = await post({ nome: "Systêxtil", status: "EM_ANDAMENTO", cor: "#6366f1" })
    expect(res.status).toBe(201)
    expect(db.insert).toHaveBeenCalledWith(reunioesProjetos)
    const body = await res.json()
    expect(body.projeto).toEqual(expect.objectContaining({ id: 2, nome: "Systêxtil" }))
  })
})