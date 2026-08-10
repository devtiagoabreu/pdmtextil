import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { userMenus } from "@/lib/db/schema/user-menus"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { PATCH } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn(), insert: vi.fn(), update: vi.fn(), delete: vi.fn(), execute: vi.fn() },
}))

const session = { user: { id: "16", role: "CRM" } }

function patch(body: unknown) {
  return PATCH(
    new NextRequest("http://localhost/api/user/menus/reorder", {
      method: "PATCH",
      body: JSON.stringify(body),
      headers: { "Content-Type": "application/json" },
    }),
  )
}

function mockSelectSequence(...results: any[]) {
  vi.mocked(db.select).mockReset()
  for (const r of results) {
    vi.mocked(db.select).mockImplementationOnce(() => createQueryBuilder(r))
  }
}

function extractParamValues(node: any, out: any[] = []): any[] {
  if (node == null || typeof node !== "object") return out
  if (Array.isArray(node.queryChunks)) {
    for (const chunk of node.queryChunks) {
      if (chunk && typeof chunk === "object" && "value" in chunk && chunk.value !== null && typeof chunk.value !== "object") {
        out.push(chunk.value)
      }
      extractParamValues(chunk, out)
    }
  }
  return out
}

describe("PATCH /api/user/menus/reorder", () => {
  beforeEach(() => {
    resetDb(db)
    vi.mocked(requireAuth).mockReset()
  })

  it("retorna 401 quando não autenticado", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Não autorizado" }, { status: 401 }) as any,
    )
    const res = await patch({ ids: [1] })
    expect(res.status).toBe(401)
  })

  it("retorna 400 quando a lista de ids é inválida", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session, userId: 16 } as any)
    const res = await patch({ ids: [] })
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Lista de IDs inválida" })
  })

  it("reordena menus próprios sem criar fork", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session, userId: 16 } as any)
    const upd = createQueryBuilder(undefined)
    db.update = vi.fn(() => upd)
    mockSelectSequence(
      [
        { id: 100, usuarioId: 16, titulo: "A" },
        { id: 101, usuarioId: 16, titulo: "B" },
      ],
      [
        { id: 100, usuarioId: 16, titulo: "A" },
        { id: 101, usuarioId: 16, titulo: "B" },
      ],
      [],
    )

    const res = await patch({ ids: [101, 100] })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
    expect(db.insert).not.toHaveBeenCalled()
    expect(db.update).toHaveBeenCalledTimes(2)
    expect(extractParamValues(upd.where.mock.calls[0][0])).toContain(101)
    expect(extractParamValues(upd.where.mock.calls[1][0])).toContain(100)
  })

  it("cria o conjunto pessoal (fork) quando o usuário não tem menus e reordena os novos", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session, userId: 16 } as any)
    const upd = createQueryBuilder(undefined)
    db.update = vi.fn(() => upd)

    let seq = 500
    db.insert = vi.fn((table: any) =>
      createQueryBuilder(table === userMenus ? [{ id: seq++ }] : undefined),
    )

    mockSelectSequence(
      [],
      [{ id: 50, role: "CRM", usuarioId: null, titulo: "CRM" }],
      [],
      [
        { id: 50, titulo: "CRM", icone: "c", ordem: 0 },
        { id: 51, titulo: "Financeiro", icone: "f", ordem: 1 },
      ],
      [{ id: 10, userMenuId: 50, titulo: "Clientes", url: "/clientes", ordem: 0 }],
      [],
      [
        { id: 500, usuarioId: 16, titulo: "CRM" },
        { id: 501, usuarioId: 16, titulo: "Financeiro" },
      ],
      [],
    )

    const res = await patch({ ids: [50, 51] })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)

    const menuInserts = db.insert.mock.results.filter(
      (r: any) => r.value.values.mock.calls[0]?.[0]?.usuarioId === 16,
    )
    expect(menuInserts).toHaveLength(2)
    expect(db.insert).toHaveBeenCalledTimes(3)

    expect(extractParamValues(upd.where.mock.calls[0][0])).toContain(500)
    expect(extractParamValues(upd.where.mock.calls[1][0])).toContain(501)
  })

  it("não duplica menus quando o usuário já tem conjunto pessoal e reordena ids role-based", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session, userId: 16 } as any)
    const upd = createQueryBuilder(undefined)
    db.update = vi.fn(() => upd)

    mockSelectSequence(
      [
        { id: 39, usuarioId: 16, titulo: "CRM" },
        { id: 40, usuarioId: 16, titulo: "Financeiro" },
      ],
      [{ id: 50, role: "CRM", usuarioId: null, titulo: "CRM" }],
      [
        { id: 39, usuarioId: 16, titulo: "CRM" },
        { id: 40, usuarioId: 16, titulo: "Financeiro" },
      ],
      [
        { id: 50, titulo: "CRM", icone: "c", ordem: 0 },
        { id: 51, titulo: "Financeiro", icone: "f", ordem: 1 },
      ],
      [
        { id: 39, usuarioId: 16, titulo: "CRM" },
        { id: 40, usuarioId: 16, titulo: "Financeiro" },
      ],
      [],
    )

    const res = await patch({ ids: [50, 51] })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)

    // Ponto central da regressão: nenhum insert — o fork reutiliza os menus existentes
    expect(db.insert).not.toHaveBeenCalled()
    expect(db.update).toHaveBeenCalledTimes(2)
    expect(extractParamValues(upd.where.mock.calls[0][0])).toContain(39)
    expect(extractParamValues(upd.where.mock.calls[1][0])).toContain(40)
  })

  it("retorna 404 quando não existe menu role-based para fazer o fork", async () => {
    vi.mocked(requireAuth).mockResolvedValue({ session, userId: 16 } as any)
    mockSelectSequence([], [], [])
    const res = await patch({ ids: [50] })
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Menu não encontrado" })
  })
})
