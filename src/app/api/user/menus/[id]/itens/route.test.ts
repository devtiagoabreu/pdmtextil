import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { POST } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), execute: vi.fn() },
}))

function session(role: string) {
  return { session: { user: { id: "16", role } }, userId: 16 }
}

function post(body: unknown) {
  return POST(
    new NextRequest("http://localhost/api/user/menus/100/itens", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
    { params: Promise.resolve({ id: "100" }) },
  )
}

describe("POST /api/user/menus/[id]/itens", () => {
  beforeEach(() => {
    resetDb(db)
    vi.mocked(requireAuth).mockReset()
  })

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Não autorizado" }, { status: 401 }) as any,
    )
    const res = await post({ titulo: "X", url: "/cadastros/clientes" })
    expect(res.status).toBe(401)
  })

  it("rejeita URL de detalhe ([id])", async () => {
    vi.mocked(requireAuth).mockResolvedValue(session("ADMIN") as any)
    const res = await post({ titulo: "Detalhe", url: "/cadastros/produto-cru/[id]" })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/detalhe/i)
  })

  it("rejeita página admin para usuário não-admin", async () => {
    vi.mocked(requireAuth).mockResolvedValue(session("CRM") as any)
    const res = await post({ titulo: "Usuários", url: "/admin/usuarios" })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/administradores/i)
  })

  it("permite página admin para usuário admin", async () => {
    vi.mocked(requireAuth).mockResolvedValue(session("ADMIN") as any)
    db.insert = vi.fn(() => createQueryBuilder([{ id: 10, userMenuId: 100, url: "/admin/usuarios" }]))
    const res = await post({ titulo: "Usuários", url: "/admin/usuarios" })
    expect(res.status).toBe(201)
    expect(db.insert).toHaveBeenCalled()
  })

  it("cria item válido", async () => {
    vi.mocked(requireAuth).mockResolvedValue(session("CRM") as any)
    db.insert = vi.fn(() => createQueryBuilder([{ id: 10, userMenuId: 100, url: "/cadastros/clientes" }]))
    const res = await post({ titulo: "Clientes", url: "/cadastros/clientes" })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.url).toBe("/cadastros/clientes")
  })

  it("exige título e URL", async () => {
    vi.mocked(requireAuth).mockResolvedValue(session("CRM") as any)
    const res = await post({ titulo: "", url: "" })
    expect(res.status).toBe(400)
  })
})