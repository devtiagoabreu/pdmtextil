// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({ db: { select: vi.fn() } }))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }

function flattenSql(c: any): string {
  const acc: string[] = []
  const walk = (node: any) => {
    if (!node || typeof node !== "object") return
    if (Array.isArray(node.value)) acc.push(node.value.join(""))
    if (Array.isArray(node.queryChunks)) node.queryChunks.forEach(walk)
  }
  walk(c)
  return acc.join("")
}

function list(url = "http://localhost/api/usuarios/ativos") {
  return GET(new NextRequest(url))
}

describe("GET /api/usuarios/ativos", () => {
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
    const res = await list()
    expect(res.status).toBe(401)
  })

  it("lista usuários ativos sem filtro de role", async () => {
    db.select.mockReturnValue(createQueryBuilder([{ id: 1, name: "Tiago" }, { id: 3, name: "Ana Vendas" }]))
    const res = await list()
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 1, name: "Tiago" }, { id: 3, name: "Ana Vendas" }])
    const cond = db.select.mock.results[0].value.where.mock.calls[0][0]
    expect(flattenSql(cond)).not.toContain(" in ")
  })

  it("filtra por role quando informado", async () => {
    db.select.mockReturnValue(createQueryBuilder([{ id: 3, name: "Ana Vendas" }]))
    const res = await list("http://localhost/api/usuarios/ativos?role=COMERCIAL,ADMIN")
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([{ id: 3, name: "Ana Vendas" }])
    const cond = db.select.mock.results[0].value.where.mock.calls[0][0]
    expect(flattenSql(cond)).toContain(" in ")
  })
})
