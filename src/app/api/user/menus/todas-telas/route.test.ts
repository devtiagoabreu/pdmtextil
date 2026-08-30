import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { GET } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))

function session(role: string) {
  return { session: { user: { id: "16", role } }, userId: 16 }
}

describe("GET /api/user/menus/todas-telas", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
  })

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Não autorizado" }, { status: 401 }) as any,
    )
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("não expõe páginas administrativas para usuário não-admin", async () => {
    vi.mocked(requireAuth).mockResolvedValue(session("CRM") as any)
    const res = await GET()
    expect(res.status).toBe(200)
    const telas = await res.json()
    expect(telas.length).toBeGreaterThan(0)
    expect(telas.every((t: any) => !t.href.startsWith("/admin"))).toBe(true)
  })

  it("não lista nenhuma rota de detalhe ([id])", async () => {
    vi.mocked(requireAuth).mockResolvedValue(session("ADMIN") as any)
    const res = await GET()
    const telas = await res.json()
    expect(telas.every((t: any) => !t.href.includes("[") && !t.href.includes("]"))).toBe(true)
  })

  it("expõe páginas administrativas para admin", async () => {
    vi.mocked(requireAuth).mockResolvedValue(session("ADMIN") as any)
    const res = await GET()
    const telas = await res.json()
    expect(telas.some((t: any) => t.href.startsWith("/admin"))).toBe(true)
  })
})