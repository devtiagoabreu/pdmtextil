// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { PUT, DELETE } from "./route"

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

const modulo = {
  id: 5,
  titulo: "Visão Geral",
  descricao: null,
  icone: "GraduationCap",
  cor: "#0ea5e9",
  ordem: 1,
  ativo: true,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
}

function request(method: string, body?: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/processos/treinamento/modulos/5", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

const callParams = () => ({ params: Promise.resolve({ id: "5" }) })

describe("PUT /api/processos/treinamento/modulos/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("atualiza o módulo com sucesso", async () => {
    db.update = vi.fn(() => createQueryBuilder([{ ...modulo, titulo: "Novo título" }]))
    const res = await PUT(request("PUT", { titulo: "Novo título" }), callParams())
    expect(res.status).toBe(200)
    expect((await res.json()).titulo).toBe("Novo título")
  })

  it("retorna 404 quando o módulo não existe", async () => {
    db.update = vi.fn(() => createQueryBuilder([]))
    const res = await PUT(request("PUT", { titulo: "X" }), callParams())
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Módulo não encontrado" })
  })
})

describe("DELETE /api/processos/treinamento/modulos/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("remove o módulo com sucesso", async () => {
    db.delete = vi.fn(() => createQueryBuilder([modulo]))
    const res = await DELETE(request("DELETE"), callParams())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it("retorna 404 quando o módulo não existe", async () => {
    db.delete = vi.fn(() => createQueryBuilder([]))
    const res = await DELETE(request("DELETE"), callParams())
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Módulo não encontrado" })
  })
})