import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
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

const stats = [{ total: 4, tecido_cru: 3, acabamento: 1 }]
const porMes = [{ mes: "2026-07", total: 4 }]
const lista = [
  {
    id: 1,
    tipo_amostra: "TECIDO_CRU",
    descricao: "Amostra A",
    status: "PENDENTE",
    produto_codigo: "C001",
    produto_descricao: "Tecido Cru",
    data: "2026-07-01T00:00:00Z",
    created_at: "2026-07-01T00:00:00Z",
  },
]

describe("GET /api/relatorios/amostras-por-status", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
  })

  it("retorna 401 quando não está autenticado", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await GET(new NextRequest("http://localhost/api/relatorios/amostras-por-status"))
    expect(res.status).toBe(401)
  })

  it("retorna 400 quando o status não é informado", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1" } } as any)
    const res = await GET(new NextRequest("http://localhost/api/relatorios/amostras-por-status"))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "Parâmetro 'status' é obrigatório" })
  })

  it("retorna as estatísticas com o shape esperado", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1" } } as any)
    db.execute = vi.fn().mockResolvedValueOnce(stats).mockResolvedValueOnce(porMes).mockResolvedValueOnce(lista)
    const res = await GET(new NextRequest("http://localhost/api/relatorios/amostras-por-status?status=PENDENTE"))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.stats).toEqual({ total: 4, tecidoCru: 3, acabamento: 1 })
    expect(data.porMes).toEqual([{ mes: "2026-07", total: 4 }])
    expect(data.lista[0]).toMatchObject({
      id: 1,
      tipoAmostra: "TECIDO_CRU",
      descricao: "Amostra A",
      produtoCodigo: "C001",
      status: "PENDENTE",
    })
  })
})
