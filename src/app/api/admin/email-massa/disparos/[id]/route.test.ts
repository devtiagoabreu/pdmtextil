import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
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

function get(id: string) {
  return GET(new NextRequest(`http://localhost/api/admin/email-massa/disparos/${id}`), {
    params: Promise.resolve({ id }),
  })
}

function mockSelectSequence(...results: any[]) {
  db.select = vi.fn()
  for (const r of results) {
    vi.mocked(db.select).mockImplementationOnce(() => createQueryBuilder(r))
  }
}

describe("GET /api/admin/email-massa/disparos/[id]", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
    vi.mocked(getServerSession).mockResolvedValue(null as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 sem sessão", async () => {
    const res = await get("2")
    expect(res.status).toBe(401)
  })

  it("retorna 400 para id inválido", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    const res = await get("abc")
    expect(res.status).toBe(400)
  })

  it("retorna 404 quando disparo não existe", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    mockSelectSequence([], [{ pendentes: 0, enviados: 0, falhas: 0 }])
    const res = await get("999")
    expect(res.status).toBe(404)
  })

  it("retorna o disparo com contadores de envio ao vivo", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    mockSelectSequence([disparo], [{ pendentes: 100, enviados: 380, falhas: 2 }])

    const res = await get("2")
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.id).toBe(2)
    expect(data.enviados).toBe(380)
    expect(data.falhas).toBe(2)
    expect(data.pendentes).toBe(100)
  })
})
