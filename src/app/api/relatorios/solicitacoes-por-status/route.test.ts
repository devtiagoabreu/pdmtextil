import { beforeEach, describe, expect, it, vi } from "vitest"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { resetDb } from "@/test/route-db-mock"
import { GET } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/db", () => ({
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    execute: vi.fn(),
  },
}))

const stats = [{ total: 5, tecelagem: 3, beneficiamento: 2 }]
const porMes = [{ mes: "2026-07", total: 5 }]
const lista = [
  {
    id: 1,
    tipo: "DESENVOLVIMENTO_TECELAGEM",
    cliente: "Cliente A",
    projeto: "Projeto 1",
    status: "PENDENTE",
    created_at: "2026-07-01T00:00:00Z",
    data_conclusao: null,
    prazo_desejado: "2026-07-10T00:00:00Z",
  },
]

describe("GET /api/relatorios/solicitacoes-por-status", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
  })

  it("retorna 401 quando não está autenticado", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await GET(new Request("http://localhost/api/relatorios/solicitacoes-por-status"))
    expect(res.status).toBe(401)
  })

  it("retorna 400 quando o status não é informado", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1" } } as any)
    const res = await GET(new Request("http://localhost/api/relatorios/solicitacoes-por-status"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Parâmetro 'status' é obrigatório" })
  })

  it("retorna as estatísticas com o shape esperado", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1" } } as any)
    db.execute = vi.fn().mockResolvedValueOnce(stats).mockResolvedValueOnce(porMes).mockResolvedValueOnce(lista)
    const res = await GET(new Request("http://localhost/api/relatorios/solicitacoes-por-status?status=PENDENTE"))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.stats).toEqual({ total: 5, tecelagem: 3, beneficiamento: 2 })
    expect(data.porMes).toEqual([{ mes: "2026-07", total: 5 }])
    expect(data.lista[0]).toMatchObject({
      id: 1,
      tipo: "DESENVOLVIMENTO_TECELAGEM",
      cliente: "Cliente A",
      status: "PENDENTE",
    })
  })
})
