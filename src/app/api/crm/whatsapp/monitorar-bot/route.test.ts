// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { executarMonitoramento } from "@/lib/whatsapp/monitoramento"
import { POST } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/whatsapp/monitoramento", () => ({ executarMonitoramento: vi.fn() }))

function post(authHeader?: string) {
  const headers = new Headers()
  if (authHeader) headers.set("authorization", authHeader)
  return POST(new NextRequest("http://localhost/api/crm/whatsapp/monitorar-bot", { method: "POST", headers }))
}

describe("POST /api/crm/whatsapp/monitorar-bot", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    vi.mocked(executarMonitoramento).mockReset()
    delete process.env.CRON_SECRET
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    vi.mocked(executarMonitoramento).mockResolvedValue({
      verificado: true,
      online: true,
      instanciaStatus: "open",
      alertaEnviado: false,
    })
  })

  it("retorna 401 sem sessão e sem cron secret", async () => {
    const res = await post()
    expect(res.status).toBe(401)
    expect(executarMonitoramento).not.toHaveBeenCalled()
  })

  it("autoriza via cron secret e retorna o resultado", async () => {
    process.env.CRON_SECRET = "s3cr3t"
    const res = await post("Bearer s3cr3t")
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.status).toBe("ok")
    expect(json.online).toBe(true)
    expect(json.alertaEnviado).toBe(false)
    expect(executarMonitoramento).toHaveBeenCalled()
  })

  it("autoriza via sessão de admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "28", role: "ADMIN" } } as any)
    const res = await post()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.online).toBe(true)
    expect(executarMonitoramento).toHaveBeenCalled()
  })

  it("retorna 500 quando executarMonitoramento falha", async () => {
    process.env.CRON_SECRET = "s3cr3t"
    vi.mocked(executarMonitoramento).mockRejectedValue(new Error("db fora"))
    const res = await post("Bearer s3cr3t")
    expect(res.status).toBe(500)
  })
})