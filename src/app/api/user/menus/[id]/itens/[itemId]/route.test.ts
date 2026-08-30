import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { PUT } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), execute: vi.fn() },
}))

function session(role: string) {
  return { session: { user: { id: "16", role } }, userId: 16 }
}

function put(body: unknown) {
  return PUT(
    new NextRequest("http://localhost/api/user/menus/100/itens/99", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
    { params: Promise.resolve({ id: "100", itemId: "99" }) },
  )
}

describe("PUT /api/user/menus/[id]/itens/[itemId]", () => {
  beforeEach(() => {
    resetDb(db)
    vi.mocked(requireAuth).mockReset()
  })

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Não autorizado" }, { status: 401 }) as any,
    )
    const res = await put({ titulo: "X", url: "/cadastros/clientes" })
    expect(res.status).toBe(401)
  })

  it("rejeita URL de detalhe na edição", async () => {
    vi.mocked(requireAuth).mockResolvedValue(session("ADMIN") as any)
    const res = await put({ titulo: "Detalhe", url: "/cadastros/fios/[id]" })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/detalhe/i)
  })

  it("rejeita página admin para usuário não-admin", async () => {
    vi.mocked(requireAuth).mockResolvedValue(session("CRM") as any)
    const res = await put({ titulo: "Usuários", url: "/admin/usuarios" })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/administradores/i)
  })

  it("edita item válido", async () => {
    vi.mocked(requireAuth).mockResolvedValue(session("CRM") as any)
    db.update = vi.fn(() =>
      createQueryBuilder([{ id: 99, userMenuId: 100, titulo: "Clientes", url: "/cadastros/clientes" }]),
    )
    const res = await put({ titulo: "Clientes", url: "/cadastros/clientes" })
    expect(res.status).toBe(200)
  })
})