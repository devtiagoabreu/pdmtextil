import { beforeEach, describe, expect, it, vi } from "vitest"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/db", () => ({ db: { select: vi.fn() } }))

const session = { user: { id: "28", role: "ADMIN" } }

const disparo = {
  id: 2,
  nome: "07.08 | Feira Equipotel",
  para: "clientes",
  assunto: "Promo",
  modoEnvio: "individual",
  remetente: "sistema",
  remessaId: "abc-123",
  status: "enviando",
  total: 4711,
  enviados: 376,
  falhas: 0,
  erro: null,
  criadoPor: 28,
  criadoEm: new Date(),
  iniciadoEm: new Date(),
  concluidoEm: null,
}

function mockSelectSequence(...results: any[]) {
  db.select = vi.fn()
  for (const r of results) {
    vi.mocked(db.select).mockImplementationOnce(() => createQueryBuilder(r))
  }
}

describe("GET /api/admin/email-massa/disparos", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
    vi.mocked(getServerSession).mockResolvedValue(null as any)
  })

  it("retorna 401 sem sessão", async () => {
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("lista disparos com contadores ao vivo", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    mockSelectSequence([disparo], [{ disparoId: 2, pendentes: 10, enviados: 380, falhas: 2 }])

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.disparos).toHaveLength(1)
    expect(data.disparos[0].enviados).toBe(380)
    expect(data.disparos[0].falhas).toBe(2)
    expect(data.disparos[0].pendentes).toBe(10)
  })

  it("zera contadores quando não há envios registrados", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    mockSelectSequence([disparo], [])

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.disparos[0].enviados).toBe(0)
    expect(data.disparos[0].falhas).toBe(0)
    expect(data.disparos[0].pendentes).toBe(0)
  })
})
