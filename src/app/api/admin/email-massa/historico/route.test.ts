import { beforeEach, describe, expect, it, vi } from "vitest"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/db", () => ({ db: { select: vi.fn() } }))

const session = { user: { id: "16", role: "ADMIN" } }

const envio = {
  id: 1,
  email: "ana@empresa.com",
  nome: "Ana Souza",
  assunto: "Promo Julho",
  status: "enviado",
  error: null,
  abertoEm: new Date(),
  createdAt: new Date(),
  totalCliques: 3,
  disparoId: 2,
  disparoNome: "Promo Julho",
}

const stats = { total: 3, enviados: 2, lidos: 1, falhas: 1, totalCliques: 4 }

function get() {
  return GET()
}

describe("GET /api/admin/email-massa/historico", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
    vi.mocked(getServerSession).mockResolvedValue(session as any)
  })

  it("retorna 401 sem sessão de admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await get()
    expect(res.status).toBe(401)
  })

  it("retorna envios com dados do disparo e stats", async () => {
    db.select = vi.fn()
    db.select.mockImplementationOnce(() => createQueryBuilder([envio]))
    db.select.mockImplementationOnce(() => createQueryBuilder([stats]))

    const res = await get()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.envios).toHaveLength(1)
    expect(data.envios[0].disparoId).toBe(2)
    expect(data.envios[0].disparoNome).toBe("Promo Julho")
    expect(data.stats).toEqual(stats)
  })
})
