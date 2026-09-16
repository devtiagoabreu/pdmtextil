import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { POST } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/db-admin/resolve-conn", () => ({
  resolverConnectionString: vi.fn(),
}))
vi.mock("@/lib/db-admin", () => ({
  cloneDatabase: vi.fn(),
}))

function session(role: string) {
  return { user: { id: "1", name: "Admin", email: "admin@pdm.com", role } } as any
}

function req(body: unknown) {
  return new NextRequest("http://localhost/api/admin/config/banco-dados/clonar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = {
  sourceBancoId: 1,
  targetBancoId: 2,
  sourceDb: "source",
  targetDb: "target",
}

describe("POST /api/admin/config/banco-dados/clonar", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
  })

  it("retorna 401 para não-admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("CRM"))
    const res = await POST(req(VALID_BODY))
    expect(res.status).toBe(401)
  })

  it("retorna 400 quando sourceBancoId ausente", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    const res = await POST(req({ ...VALID_BODY, sourceBancoId: undefined }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 quando targetBancoId ausente", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    const res = await POST(req({ ...VALID_BODY, targetBancoId: undefined }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 quando sourceDb ausente", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    const res = await POST(req({ ...VALID_BODY, sourceDb: undefined }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 quando targetDb ausente", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    const res = await POST(req({ ...VALID_BODY, targetDb: undefined }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 quando bancoId não é encontrado", async () => {
    const { resolverConnectionString } = await import("@/lib/db-admin/resolve-conn")
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    vi.mocked(resolverConnectionString).mockResolvedValue(null)
    const res = await POST(req(VALID_BODY))
    expect(res.status).toBe(400)
  })

  it("clona com sucesso via bancoIds", async () => {
    const { resolverConnectionString } = await import("@/lib/db-admin/resolve-conn")
    const { cloneDatabase } = await import("@/lib/db-admin")
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    vi.mocked(resolverConnectionString).mockResolvedValue("postgres://u:p@host/db")
    vi.mocked(cloneDatabase).mockResolvedValue({ success: true, message: "Clonado com sucesso." })
    const res = await POST(req(VALID_BODY))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it("retorna 400 quando cloneDatabase falha", async () => {
    const { resolverConnectionString } = await import("@/lib/db-admin/resolve-conn")
    const { cloneDatabase } = await import("@/lib/db-admin")
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    vi.mocked(resolverConnectionString).mockResolvedValue("postgres://u:p@host/db")
    vi.mocked(cloneDatabase).mockResolvedValue({ success: false, message: "Erro de clone" })
    const res = await POST(req(VALID_BODY))
    expect(res.status).toBe(400)
  })
})
