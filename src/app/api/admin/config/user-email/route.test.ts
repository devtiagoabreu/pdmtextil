import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { encrypt, decrypt } from "@/lib/crypto"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, PUT, DELETE } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), execute: vi.fn() },
}))
vi.mock("@/lib/crypto", () => ({ encrypt: vi.fn((p: string) => `enc:${p}`), decrypt: vi.fn((p: string) => String(p).replace("enc:", "")) }))

function session(role: string) {
  return { user: { id: "1", name: "Admin", email: "admin@pdm.com", role } } as any
}

function req(method: string, body?: unknown, query = "") {
  const url = `http://localhost/api/admin/config/user-email${query}`
  return new NextRequest(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
}

describe("GET /api/admin/config/user-email", () => {
  beforeEach(() => {
    resetDb(db)
    vi.mocked(getServerSession).mockReset()
  })

  it("retorna 401 para não-admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("COMERCIAL"))
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("lista configs de usuários para admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    db.select = vi.fn(() =>
      createQueryBuilder([
        { id: 1, usuarioId: 2, email: "ana@gmail.com", ativo: true, limiteDiario: 1500, usuarioNome: "Ana Comercial", usuarioEmail: "ana@pdm.com" },
      ]),
    )
    const res = await GET()
    expect(res.status).toBe(200)
    const rows = await res.json()
    expect(rows).toHaveLength(1)
  })
})

describe("PUT /api/admin/config/user-email", () => {
  beforeEach(() => {
    resetDb(db)
    vi.mocked(getServerSession).mockReset()
  })

  it("exige admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("CRM"))
    const res = await PUT(req("PUT", { usuarioId: 2, email: "x@gmail.com", senhaApp: "abc" }))
    expect(res.status).toBe(401)
  })

  it("valida campos obrigatórios", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    const res = await PUT(req("PUT", { usuarioId: 2 }))
    expect(res.status).toBe(400)
  })

  it("atualiza config existente", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    db.select = vi.fn(() => createQueryBuilder([{ id: 1, usuarioId: 2, email: "old@gmail.com", pass: "x", limiteDiario: 1500, ativo: true }]))
    db.update = vi.fn(() => createQueryBuilder([]))
    const res = await PUT(req("PUT", { usuarioId: 2, email: "new@gmail.com", senhaApp: "senha" }))
    expect(res.status).toBe(200)
    expect(encrypt).toHaveBeenCalledWith("senha")
  })

  it("cria config nova para usuário sem config", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    db.select = vi.fn(() => createQueryBuilder([]))
    db.insert = vi.fn(() => createQueryBuilder([]))
    const res = await PUT(req("PUT", { usuarioId: 3, email: "novo@gmail.com", senhaApp: "senha" }))
    expect(res.status).toBe(200)
    expect(db.insert).toHaveBeenCalled()
  })
})

describe("DELETE /api/admin/config/user-email", () => {
  beforeEach(() => {
    resetDb(db)
    vi.mocked(getServerSession).mockReset()
  })

  it("exige admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("COMERCIAL"))
    const res = await DELETE(req("DELETE", undefined, "?usuarioId=2"))
    expect(res.status).toBe(401)
  })

  it("exige usuarioId", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    const res = await DELETE(req("DELETE"))
    expect(res.status).toBe(400)
  })

  it("remove config", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    db.delete = vi.fn(() => createQueryBuilder([]))
    const res = await DELETE(req("DELETE", undefined, "?usuarioId=2"))
    expect(res.status).toBe(200)
    expect(db.delete).toHaveBeenCalled()
  })
})
