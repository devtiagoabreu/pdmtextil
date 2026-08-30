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

const adminSession = { session: { user: { id: "1", role: "ADMIN" } }, userId: 1 }

function put(body: unknown, menuId = "5", itemId = "99") {
  return PUT(
    new NextRequest("http://localhost/api/admin/menus/5/itens/99", {
      method: "PUT",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
    { params: Promise.resolve({ id: menuId, itemId }) },
  )
}

function mockMenu(role: string) {
  vi.mocked(db.select).mockReset()
  vi.mocked(db.select).mockImplementationOnce(() => createQueryBuilder([{ id: 5, role }]))
}

describe("PUT /api/admin/menus/[id]/itens/[itemId]", () => {
  beforeEach(() => {
    resetDb(db)
    vi.mocked(requireAuth).mockReset()
  })

  it("retorna 403 quando não é admin", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 }) as any,
    )
    const res = await put({ titulo: "X", url: "/cadastros/clientes" })
    expect(res.status).toBe(403)
  })

  it("rejeita URL de detalhe na edição", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminSession as any)
    mockMenu("ADMIN")
    const res = await put({ titulo: "Detalhe", url: "/cadastros/fios/[id]" })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/detalhe/i)
  })

  it("rejeita página admin ao editar item de menu não-admin", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminSession as any)
    mockMenu("CRM")
    const res = await put({ titulo: "Usuários", url: "/admin/usuarios" })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/administradores/i)
  })

  it("edita item válido", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminSession as any)
    mockMenu("CRM")
    db.update = vi.fn(() =>
      createQueryBuilder([{ id: 99, userMenuId: 5, titulo: "Clientes", url: "/cadastros/clientes" }]),
    )
    const res = await put({ titulo: "Clientes", url: "/cadastros/clientes" })
    expect(res.status).toBe(200)
  })

  it("returna 404 quando o item não existe", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminSession as any)
    mockMenu("CRM")
    db.update = vi.fn(() => createQueryBuilder([]))
    const res = await put({ titulo: "Clientes", url: "/cadastros/clientes" })
    expect(res.status).toBe(404)
  })
})