// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { notificar } from "@/lib/notificar"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
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

function get(url: string) {
  return GET(new NextRequest(url))
}

function post(body: Record<string, unknown>) {
  return POST(
    new NextRequest("http://localhost/api/crm/contatos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  )
}

describe("GET /api/crm/contatos", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
    db.select = vi.fn(() => createQueryBuilder([]))
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await get("http://localhost/api/crm/contatos")
    expect(res.status).toBe(401)
  })

  it("aplica filtro orfao=true para listar contatos sem vínculo", async () => {
    await get("http://localhost/api/crm/contatos?orfao=true")
    const builder = (db.select as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(builder.where).toHaveBeenCalled()
  })

  it("não aplica where quando não há filtros", async () => {
    await get("http://localhost/api/crm/contatos")
    const builder = (db.select as ReturnType<typeof vi.fn>).mock.results[0].value
    expect(builder.where).not.toHaveBeenCalled()
  })
})

describe("POST /api/crm/contatos", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
    const insertBuilder = createQueryBuilder([{ id: 1, nome: "Ana", empresaId: null, clienteId: null }])
    db.insert = vi.fn(() => insertBuilder)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await post({ nome: "Ana" })
    expect(res.status).toBe(401)
  })

  it("retorna 400 sem nome", async () => {
    const res = await post({ email: "ana@x.com" })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Nome é obrigatório" })
  })

  it("cria contato órfão (sem vínculo com pessoa ou cliente)", async () => {
    const res = await post({ nome: "Ana", email: "ana@x.com" })
    expect(res.status).toBe(201)
    const builder = (db.insert as ReturnType<typeof vi.fn>).mock.results[0].value
    const values = builder.values.mock.calls[0][0]
    expect(values).toMatchObject({ nome: "Ana", email: "ana@x.com", empresaId: null, clienteId: null })
  })

  it("cria contato vinculado a um cliente", async () => {
    const res = await post({ nome: "Ana", clienteId: "9" })
    expect(res.status).toBe(201)
    const builder = (db.insert as ReturnType<typeof vi.fn>).mock.results[0].value
    const values = builder.values.mock.calls[0][0]
    expect(values).toMatchObject({ empresaId: null, clienteId: 9 })
  })
})
