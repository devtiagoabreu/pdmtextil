// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, PUT, DELETE } from "./route"

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

const licao = {
  id: 10,
  moduloId: 1,
  moduloTitulo: "Visão Geral",
  moduloCor: "#0ea5e9",
  moduloIcone: "GraduationCap",
  titulo: "O que é um processo",
  conteudoMd: "## Conteúdo",
  preRequisitos: null,
  linksPop: [],
  linksVideo: [],
  pathnameRelacionado: "/processos",
  ordem: 1,
  ativo: true,
  createdAt: "2026-01-01",
  updatedAt: "2026-01-01",
}

function request(method: string, body?: Record<string, unknown>) {
  return new NextRequest("http://localhost/api/processos/treinamento/10", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  })
}

const callParams = () => ({ params: Promise.resolve({ id: "10" }) })

describe("GET /api/processos/treinamento/[id]", () => {
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
    const res = await GET(request("GET"), callParams())
    expect(res.status).toBe(401)
  })

  it("retorna a lição encontrada", async () => {
    db.select = vi.fn(() => createQueryBuilder([licao]))
    const res = await GET(request("GET"), callParams())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(licao)
  })

  it("retorna 404 quando a lição não existe", async () => {
    db.select = vi.fn(() => createQueryBuilder([]))
    const res = await GET(request("GET"), callParams())
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Lição não encontrada" })
  })
})

describe("PUT /api/processos/treinamento/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("atualiza a lição com sucesso", async () => {
    db.update = vi.fn(() => createQueryBuilder([{ ...licao, titulo: "Novo título" }]))
    const res = await PUT(request("PUT", { titulo: "Novo título", moduloId: 1 }), callParams())
    expect(res.status).toBe(200)
    expect((await res.json()).titulo).toBe("Novo título")
  })

  it("retorna 404 quando a lição não existe", async () => {
    db.update = vi.fn(() => createQueryBuilder([]))
    const res = await PUT(request("PUT", { titulo: "X", moduloId: 1 }), callParams())
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Lição não encontrada" })
  })
})

describe("DELETE /api/processos/treinamento/[id]", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("remove a lição com sucesso", async () => {
    db.delete = vi.fn(() => createQueryBuilder([licao]))
    const res = await DELETE(request("DELETE"), callParams())
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
  })

  it("retorna 404 quando a lição não existe", async () => {
    db.delete = vi.fn(() => createQueryBuilder([]))
    const res = await DELETE(request("DELETE"), callParams())
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Lição não encontrada" })
  })
})