import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { POST } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/db-admin/resolve-conn", () => ({
  resolverConnectionString: vi.fn(),
}))
vi.mock("@/lib/db-admin", () => ({
  createDatabase: vi.fn(),
}))

function session(role: string) {
  return { user: { id: "1", name: "Admin", email: "admin@pdm.com", role } } as any
}

function req(body: unknown) {
  return new NextRequest("http://localhost/api/admin/config/banco-dados/criar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

describe("POST /api/admin/config/banco-dados/criar", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
  })

  it("retorna 401 para não-admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("COMERCIAL"))
    const res = await POST(req({ bancoId: 1, dbName: "test" }))
    expect(res.status).toBe(401)
  })

  it("retorna 400 quando bancoId ausente", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    const res = await POST(req({ dbName: "test" }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain("bancoId")
  })

  it("retorna 400 quando dbName ausente", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    const res = await POST(req({ bancoId: 1 }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain("dbName")
  })

  it("retorna 400 quando bancoId não é encontrado no banco de dados", async () => {
    const { resolverConnectionString } = await import("@/lib/db-admin/resolve-conn")
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    vi.mocked(resolverConnectionString).mockResolvedValue(null)
    const res = await POST(req({ bancoId: 999, dbName: "test" }))
    expect(res.status).toBe(400)
    const data = await res.json()
    expect(data.error).toContain("Conexão não encontrada")
  })

  it("cria banco com sucesso via bancoId", async () => {
    const { resolverConnectionString } = await import("@/lib/db-admin/resolve-conn")
    const { createDatabase } = await import("@/lib/db-admin")
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    vi.mocked(resolverConnectionString).mockResolvedValue("postgres://user:pass@host/db")
    vi.mocked(createDatabase).mockResolvedValue({ success: true, message: 'Banco "novo" criado.' })
    const res = await POST(req({ bancoId: 1, dbName: "novo" }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it("retorna 400 quando createDatabase falha", async () => {
    const { resolverConnectionString } = await import("@/lib/db-admin/resolve-conn")
    const { createDatabase } = await import("@/lib/db-admin")
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    vi.mocked(resolverConnectionString).mockResolvedValue("postgres://user:pass@host/db")
    vi.mocked(createDatabase).mockResolvedValue({ success: false, message: "duplicate database" })
    const res = await POST(req({ bancoId: 1, dbName: "duplicado" }))
    expect(res.status).toBe(400)
  })
})
