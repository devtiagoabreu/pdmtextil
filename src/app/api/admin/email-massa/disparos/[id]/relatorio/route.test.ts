import { beforeEach, describe, expect, it, vi } from "vitest"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/db", () => ({ db: { select: vi.fn() } }))

const session = { user: { id: "16", role: "ADMIN" } }

const disparo = {
  id: 2,
  nome: "07.08 | Feira Equipotel",
  para: "clientes",
  assunto: "Promo",
  modoEnvio: "individual",
  remetente: "sistema",
  remessaId: "abc-123",
  status: "concluido",
  total: 4711,
  enviados: 400,
  falhas: 0,
  erro: null,
  criadoPor: 16,
  criadoEm: new Date(),
  iniciadoEm: new Date(),
  concluidoEm: new Date(),
}

const stats = {
  pendentes: 0,
  enviados: 400,
  falhas: 0,
  lidos: 120,
  clicados: 45,
  totalCliques: 90,
}

const envio = {
  id: 1,
  email: "ana@empresa.com",
  nome: "Ana Souza",
  status: "enviado",
  error: null,
  abertoEm: new Date(),
  enviadoEm: new Date(),
  createdAt: new Date(),
  totalCliques: 3,
}

const link = { urlOriginal: "https://pdmprotextil.com.br/produto", total: 30 }

function get(id: string) {
  return GET(new Request(`http://localhost/api/admin/email-massa/disparos/${id}/relatorio`), {
    params: Promise.resolve({ id }),
  })
}

describe("GET /api/admin/email-massa/disparos/[id]/relatorio", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
    vi.mocked(getServerSession).mockResolvedValue(session as any)
  })

  it("retorna 401 sem sessão de admin", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await get("2")
    expect(res.status).toBe(401)
  })

  it("retorna 404 quando o disparo não existe", async () => {
    db.select = vi.fn(() => createQueryBuilder([]))
    const res = await get("99")
    expect(res.status).toBe(404)
  })

  it("retorna o relatório completo do disparo", async () => {
    db.select = vi.fn()
    db.select.mockImplementationOnce(() => createQueryBuilder([disparo]))
    db.select.mockImplementationOnce(() => createQueryBuilder([stats]))
    db.select.mockImplementationOnce(() => createQueryBuilder([envio]))
    db.select.mockImplementationOnce(() => createQueryBuilder([link]))

    const res = await get("2")
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.disparo.id).toBe(2)
    expect(data.stats).toEqual(stats)
    expect(data.envios).toHaveLength(1)
    expect(data.links).toHaveLength(1)
    expect(data.links[0].total).toBe(30)
  })
})
