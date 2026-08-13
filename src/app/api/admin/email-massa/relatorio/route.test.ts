import { beforeEach, describe, expect, it, vi } from "vitest"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/db", () => ({ db: { select: vi.fn() } }))

const session = { user: { id: "28", role: "ADMIN" } }

function mockSelectSequence(...results: any[]) {
  db.select = vi.fn()
  for (const r of results) {
    vi.mocked(db.select).mockImplementationOnce(() => createQueryBuilder(r))
  }
}

describe("GET /api/admin/email-massa/relatorio", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
    vi.mocked(getServerSession).mockResolvedValue(null as any)
  })

  it("retorna 401 sem sessão", async () => {
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("agrega remessas sem inflar contagens pelos cliques", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    mockSelectSequence(
      [
        {
          remessaId: "r1",
          assunto: "Promo Julho",
          total: 4711,
          enviados: 3953,
          falhas: 758,
          lidos: 435,
          createdAt: "2026-07-10T10:00:00.000Z",
        },
      ],
      [{ remessaId: "r1", clicados: 41, totalCliques: 248 }],
      [{ remessaId: "r1", urlOriginal: "https://pdmprotextil.com.br/promo", total: 200 }],
    )

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.remessas).toHaveLength(1)
    expect(data.remessas[0].total).toBe(4711)
    expect(data.remessas[0].enviados).toBe(3953)
    expect(data.remessas[0].falhas).toBe(758)
    expect(data.remessas[0].lidos).toBe(435)
    expect(data.remessas[0].clicados).toBe(41)
    expect(data.remessas[0].totalCliques).toBe(248)
    expect(data.remessas[0].links).toHaveLength(1)
    expect(data.remessas[0].links[0].urlOriginal).toContain("pdmprotextil.com.br")
  })

  it("zera cliques e links quando não há remessas", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    mockSelectSequence([])

    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.remessas).toHaveLength(0)
  })
})
