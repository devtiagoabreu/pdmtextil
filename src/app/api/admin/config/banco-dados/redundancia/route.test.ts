import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { POST } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/db-admin/resolve-conn", () => ({
  resolverConnectionString: vi.fn(),
}))
vi.mock("@/lib/db-admin", () => ({
  setupRedundancy: vi.fn(),
}))

function session(role: string) {
  return { user: { id: "1", name: "Admin", email: "admin@pdm.com", role } } as any
}

function req(body: unknown) {
  return new NextRequest("http://localhost/api/admin/config/banco-dados/redundancia", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const VALID_BODY = {
  primaryBancoId: 1,
  standbyBancoId: 2,
  primaryDb: "primary",
  standbyDb: "standby",
}

describe("POST /api/admin/config/banco-dados/redundancia", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
  })

  it("retorna 401 para não-admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("CRM"))
    const res = await POST(req(VALID_BODY))
    expect(res.status).toBe(401)
  })

  it("retorna 400 quando primaryBancoId ausente", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    const res = await POST(req({ ...VALID_BODY, primaryBancoId: undefined }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 quando standbyBancoId ausente", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    const res = await POST(req({ ...VALID_BODY, standbyBancoId: undefined }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 quando primaryDb ausente", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    const res = await POST(req({ ...VALID_BODY, primaryDb: undefined }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 quando standbyDb ausente", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    const res = await POST(req({ ...VALID_BODY, standbyDb: undefined }))
    expect(res.status).toBe(400)
  })

  it("retorna 400 quando bancoId não é encontrado", async () => {
    const { resolverConnectionString } = await import("@/lib/db-admin/resolve-conn")
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    vi.mocked(resolverConnectionString).mockResolvedValue(null)
    const res = await POST(req(VALID_BODY))
    expect(res.status).toBe(400)
  })

  it("configura redundância com sucesso via bancoIds", async () => {
    const { resolverConnectionString } = await import("@/lib/db-admin/resolve-conn")
    const { setupRedundancy } = await import("@/lib/db-admin")
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    vi.mocked(resolverConnectionString).mockResolvedValue("postgres://u:p@host/db")
    vi.mocked(setupRedundancy).mockResolvedValue({ success: true, message: "Redundância OK." })
    const res = await POST(req(VALID_BODY))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
  })

  it("retorna 400 quando setupRedundancy falha", async () => {
    const { resolverConnectionString } = await import("@/lib/db-admin/resolve-conn")
    const { setupRedundancy } = await import("@/lib/db-admin")
    vi.mocked(getServerSession).mockResolvedValue(session("ADMIN"))
    vi.mocked(resolverConnectionString).mockResolvedValue("postgres://u:p@host/db")
    vi.mocked(setupRedundancy).mockResolvedValue({ success: false, message: "Falha" })
    const res = await POST(req(VALID_BODY))
    expect(res.status).toBe(400)
  })
})
