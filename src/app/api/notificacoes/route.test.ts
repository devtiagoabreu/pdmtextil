import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextResponse, NextRequest } from "next/server"
import { db } from "@/lib/db"
import { requireAuth } from "@/lib/auth"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET, PUT } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
}))

const authOk = { session: {}, userId: 7 }
const notificacoes = [
  { id: 1, tipo: "INFO", mensagem: "Nova solicitação", lida: false },
  { id: 2, tipo: "INFO", mensagem: "Amostra concluída", lida: true },
]

describe("GET /api/notificacoes", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(authOk as any)
  })

  it("retorna 401 quando não está autenticado", async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      NextResponse.json({ error: "Não autorizado" }, { status: 401 }) as any,
    )
    const res = await GET(new NextRequest("http://localhost/api/notificacoes"))
    expect(res.status).toBe(401)
  })

  it("retorna a lista de notificações", async () => {
    db.select = vi.fn(() => createQueryBuilder(notificacoes))
    const res = await GET(new NextRequest("http://localhost/api/notificacoes"))
    expect(res.status).toBe(200)
    expect(res.headers.get("Cache-Control")).toBe("private, max-age=30, stale-while-revalidate=60")
    expect(await res.json()).toHaveLength(2)
  })

  it("retorna apenas não lidas com naoLidas=true", async () => {
    db.select = vi.fn(() => createQueryBuilder([notificacoes[0]]))
    const res = await GET(new NextRequest("http://localhost/api/notificacoes?naoLidas=true&limit=10"))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].lida).toBe(false)
  })
})

describe("PUT /api/notificacoes", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(authOk as any)
  })

  it("marca todas como lidas com marcarTodas", async () => {
    db.update = vi.fn(() => createQueryBuilder(undefined))
    const res = await PUT(
      new NextRequest("http://localhost/api/notificacoes", {
        method: "PUT",
        body: JSON.stringify({ marcarTodas: true }),
        headers: { "Content-Type": "application/json" },
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(db.update).toHaveBeenCalled()
  })

  it("marca uma notificação específica como lida", async () => {
    db.update = vi.fn(() => createQueryBuilder(undefined))
    const res = await PUT(
      new NextRequest("http://localhost/api/notificacoes", {
        method: "PUT",
        body: JSON.stringify({ id: 3 }),
        headers: { "Content-Type": "application/json" },
      }),
    )
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ success: true })
    expect(db.update).toHaveBeenCalled()
  })
})
