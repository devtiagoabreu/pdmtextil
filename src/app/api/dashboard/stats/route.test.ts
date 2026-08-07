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

const mensal = [
  { mes: "2026-07", status: "PENDENTE", total: 3 },
  { mes: "2026-07", status: "CONCLUIDO", total: 2 },
]

const agrupado = [
  {
    status_rows: '[{"status":"PENDENTE","total":3},{"status":"CONCLUIDO","total":2}]',
    tipo_rows: '[{"tipo":"DESENVOLVIMENTO_TECELAGEM","total":5}]',
    pc_total: 10,
  },
]

describe("GET /api/dashboard/stats", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
  })

  it("retorna 401 quando não está autenticado", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it("retorna as estatísticas com o shape esperado", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1" } } as any)
    db.execute = vi.fn().mockResolvedValueOnce(mensal).mockResolvedValueOnce(agrupado)
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.totalEsteMes).toBe(5)
    expect(data.pendentes).toBe(3)
    expect(data.concluidas).toBe(2)
    expect(data.monthlyTrend).toEqual([{ mes: expect.any(String), total: 5 }])
    expect(data.statusDistribution).toEqual([
      { status: "PENDENTE", total: 3 },
      { status: "CONCLUIDO", total: 2 },
    ])
    expect(data.tipoDistribution).toEqual([{ tipo: "DESENVOLVIMENTO_TECELAGEM", total: 5 }])
    expect(data.totalProdutosCru).toBe(10)
  })

  it("retorna valores zerados quando o banco falha", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1" } } as any)
    db.execute = vi.fn().mockRejectedValue(new Error("falha no banco"))
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.totalEsteMes).toBe(0)
    expect(data.monthlyTrend).toEqual([])
    expect(data.statusDistribution).toEqual([])
    expect(data.totalProdutosCru).toBe(0)
  })
})
