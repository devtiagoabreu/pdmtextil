// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { verificarAbandonos } from "@/lib/whatsapp/abandon-checker"
import { POST } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/whatsapp/abandon-checker", () => ({ verificarAbandonos: vi.fn() }))

function post(authHeader?: string) {
  const headers = new Headers()
  if (authHeader) headers.set("authorization", authHeader)
  return POST(new NextRequest("http://localhost/api/crm/whatsapp/verificar-abandonos", { method: "POST", headers }))
}

describe("POST /api/crm/whatsapp/verificar-abandonos", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    vi.mocked(verificarAbandonos).mockReset()
    delete process.env.CRON_SECRET
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    vi.mocked(verificarAbandonos).mockResolvedValue({ notificados: 2 })
  })

  it("retorna 401 sem sessão e sem cron secret", async () => {
    const res = await post()
    expect(res.status).toBe(401)
    expect(verificarAbandonos).not.toHaveBeenCalled()
  })

  it("autoriza via cron secret e retorna notificados", async () => {
    process.env.CRON_SECRET = "s3cr3t"
    const res = await post("Bearer s3cr3t")
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.status).toBe("ok")
    expect(json.notificados).toBe(2)
    expect(verificarAbandonos).toHaveBeenCalled()
  })

  it("autoriza via sessão de admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "28", role: "ADMIN" } } as any)
    const res = await post()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.notificados).toBe(2)
    expect(verificarAbandonos).toHaveBeenCalled()
  })

  it("retorna 500 quando verificarAbandonos falha", async () => {
    process.env.CRON_SECRET = "s3cr3t"
    vi.mocked(verificarAbandonos).mockRejectedValue(new Error("db fora"))
    const res = await post("Bearer s3cr3t")
    expect(res.status).toBe(500)
  })
})
