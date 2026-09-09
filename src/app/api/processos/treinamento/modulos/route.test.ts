// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, POST } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn() },
}))
vi.mock("@/lib/notificar", () => ({
  registrarLog: vi.fn(),
  notificar: vi.fn(),
  notificarErro: vi.fn(),
  notificarDelecao: vi.fn(),
}))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }

describe("GET /api/processos/treinamento/modulos", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("retorna a lista de módulos", async () => {
    const modulos = [{ id: 1, titulo: "Visão Geral", descricao: null, icone: "GraduationCap", cor: "#0ea5e9", ordem: 1, ativo: true }]
    db.select = vi.fn(() => createQueryBuilder(modulos))
    const res = await GET()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(modulos)
  })
})

describe("POST /api/processos/treinamento/modulos", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("cria um módulo com sucesso", async () => {
    const novo = { id: 5, titulo: "Novo Módulo", descricao: null, icone: "GraduationCap", cor: "#0ea5e9", ordem: 0, ativo: true }
    db.insert = vi.fn(() => createQueryBuilder([novo]))
    const res = await POST(
      new NextRequest("http://localhost/api/processos/treinamento/modulos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: "Novo Módulo" }),
      })
    )
    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(novo)
  })

  it("retorna 400 sem titulo", async () => {
    const res = await POST(
      new NextRequest("http://localhost/api/processos/treinamento/modulos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
    )
    expect(res.status).toBe(400)
    expect(db.insert).not.toHaveBeenCalled()
  })
})