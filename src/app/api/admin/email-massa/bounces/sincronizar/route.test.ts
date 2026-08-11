import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { sincronizarBounces } from "@/lib/email-bounces"
import { POST } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/email-bounces", () => ({ sincronizarBounces: vi.fn() }))

const session = { user: { id: "16", role: "ADMIN" } }

describe("POST /api/admin/email-massa/bounces/sincronizar", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    vi.mocked(sincronizarBounces).mockReset()
    vi.mocked(getServerSession).mockResolvedValue(session as any)
  })

  it("retorna 401 sem sessão de admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await POST(new NextRequest("http://localhost/api/admin/email-massa/bounces/sincronizar", { method: "POST" }))
    expect(res.status).toBe(401)
  })

  it("sincroniza bounces do usuário e retorna o resultado", async () => {
    vi.mocked(sincronizarBounces).mockResolvedValue({
      processados: 195,
      marcados: 163,
      disparos: [{ disparoId: 2, marcados: 163 }],
    })
    const res = await POST(new NextRequest("http://localhost/api/admin/email-massa/bounces/sincronizar", { method: "POST" }))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toEqual({ processados: 195, marcados: 163, disparos: [{ disparoId: 2, marcados: 163 }] })
    expect(sincronizarBounces).toHaveBeenCalledWith(16)
  })

  it("retorna 500 quando o IMAP falha", async () => {
    vi.mocked(sincronizarBounces).mockRejectedValue(new Error("connection refused"))
    const res = await POST(new NextRequest("http://localhost/api/admin/email-massa/bounces/sincronizar", { method: "POST" }))
    expect(res.status).toBe(500)
  })
})
