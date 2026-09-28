// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { registrarLog } from "@/lib/notificar"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, POST } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/notificar", () => ({ registrarLog: vi.fn() }))
vi.mock("@/lib/db", () => ({ db: { select: vi.fn(), insert: vi.fn() } }))

const sessionUser = {
  session: { user: { id: "10", role: "ADMIN", name: "Marcos" } },
  userId: 10,
}

const categoriaRow = {
  id: 1,
  codigo: "INCIDENTE",
  nome: "Incidente",
  cor: "red",
  ativo: true,
  ordem: 10,
  createdAt: new Date("2026-09-16T10:00:00.000Z"),
  updatedAt: new Date("2026-09-16T10:00:00.000Z"),
}

function get(query = "") {
  return GET(new NextRequest(`http://localhost/api/chamados/categorias${query}`))
}

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/chamados/categorias", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  )
}

describe("GET /api/chamados/categorias", () => {
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

  it("lista as categorias", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([categoriaRow]))
    const res = await get()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toHaveLength(1)
    expect(body[0].codigo).toBe("INCIDENTE")
  })

  it("filtra somente ativas", async () => {
    db.select.mockReturnValueOnce(createQueryBuilder([categoriaRow]))
    const res = await get("?somenteAtivas=true")
    expect(res.status).toBe(200)
    expect(db.select).toHaveBeenCalledTimes(1)
  })

  it("retorna 500 quando a consulta falha", async () => {
    db.select.mockReturnValueOnce({
      from: () => {
        throw new Error("boom")
      },
    })
    const res = await get()
    expect(res.status).toBe(500)
  })
})

describe("POST /api/chamados/categorias", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    vi.mocked(registrarLog).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionUser as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any
    )
    const res = await post({ codigo: "NOVA", nome: "Nova" })
    expect(res.status).toBe(401)
  })

  it("retorna 400 sem codigo", async () => {
    const res = await post({ nome: "Nova" })
    expect(res.status).toBe(400)
  })

  it("retorna 400 sem nome", async () => {
    const res = await post({ codigo: "NOVA" })
    expect(res.status).toBe(400)
  })

  it("cria a categoria normalizando o codigo", async () => {
    db.insert.mockReturnValueOnce(createQueryBuilder([{ ...categoriaRow, id: 7, codigo: "MANUTENCAO_CORRETIVA" }]))
    const res = await post({ codigo: " manutencao corretiva ", nome: "Manutenção corretiva" })
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.id).toBe(7)
    expect(body.codigo).toBe("MANUTENCAO_CORRETIVA")
    expect(registrarLog).toHaveBeenCalledWith(
      expect.objectContaining({ entidade: "ChamadoCategoria", entidadeId: 7 })
    )
  })
})
