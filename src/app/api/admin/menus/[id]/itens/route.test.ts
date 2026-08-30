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

const adminSession = { session: { user: { id: "1", role: "ADMIN" } }, userId: 1 }

function post(body: unknown, menuId = "5") {
  return POST(
    new NextRequest("http://localhost/api/admin/menus/5/itens", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
    { params: Promise.resolve({ id: menuId }) },
  )
}

function mockMenu(role: string) {
  vi.mocked(db.select).mockReset()
  vi.mocked(db.select).mockImplementationOnce(() => createQueryBuilder([{ id: 5, role }]))
}

describe("POST /api/admin/menus/[id]/itens", () => {
  beforeEach(() => {
    resetDb(db)
    vi.mocked(requireAuth).mockReset()
  })

  it("retorna 403 quando não é admin", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Acesso restrito a administradores" }, { status: 403 }) as any,
    )
    const res = await post({ titulo: "X", url: "/cadastros/clientes" })
    expect(res.status).toBe(403)
  })

  it("retorna 404 quando o menu não existe", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminSession as any)
    vi.mocked(db.select).mockReset()
    vi.mocked(db.select).mockImplementationOnce(() => createQueryBuilder([]))
    const res = await post({ titulo: "X", url: "/cadastros/clientes" })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Menu não encontrado" })
  })

  it("rejeita URL de detalhe ([id]) mesmo para admin", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminSession as any)
    mockMenu("ADMIN")
    const res = await post({ titulo: "Detalhe", url: "/cadastros/produto-cru/[id]" })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/detalhe/i)
  })

  it("rejeita página admin em menu de perfil não-admin", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminSession as any)
    mockMenu("CRM")
    const res = await post({ titulo: "Usuários", url: "/admin/usuarios" })
    expect(res.status).toBe(400)
    expect((await res.json()).error).toMatch(/administradores/i)
  })

  it("permite página admin em menu de perfil administrador", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminSession as any)
    mockMenu("ADMIN")
    db.insert = vi.fn(() => createQueryBuilder([{ id: 10, userMenuId: 5, url: "/admin/usuarios" }]))
    const res = await post({ titulo: "Usuários", url: "/admin/usuarios" })
    expect(res.status).toBe(201)
  })

  it("cria item válido em menu não-admin", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminSession as any)
    mockMenu("CRM")
    db.insert = vi.fn(() => createQueryBuilder([{ id: 10, userMenuId: 5, url: "/cadastros/clientes" }]))
    const res = await post({ titulo: "Clientes", url: "/cadastros/clientes" })
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.url).toBe("/cadastros/clientes")
    expect(db.insert).toHaveBeenCalled()
  })

  it("exige título e URL", async () => {
    vi.mocked(requireAuth).mockResolvedValue(adminSession as any)
    const res = await post({ titulo: "", url: "" })
    expect(res.status).toBe(400)
  })
})