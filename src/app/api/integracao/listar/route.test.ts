import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
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

const integracoes = [
  { id: 1, nome: "ERP TOTVS", baseUrl: "https://erp.exemplo.com", tipoAuth: "bearer", telas: ["clientes", "fios"] },
  { id: 2, nome: "WMS", baseUrl: "https://wms.exemplo.com", tipoAuth: "basic", telas: ["produtos"] },
]

describe("GET /api/integracao/listar", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
  })

  it("retorna 401 quando não está autenticado", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await GET(new NextRequest("http://localhost/api/integracao/listar"))
    expect(res.status).toBe(401)
  })

  it("retorna todas as integrações ativas sem filtro", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1" } } as any)
    db.select = vi.fn(() => createQueryBuilder(integracoes))
    const res = await GET(new NextRequest("http://localhost/api/integracao/listar"))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(2)
    expect(data[0].nome).toBe("ERP TOTVS")
  })

  it("filtra integrações pela tela informada", async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { id: "1" } } as any)
    db.select = vi.fn(() => createQueryBuilder(integracoes))
    const res = await GET(new NextRequest("http://localhost/api/integracao/listar?tela=clientes"))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe(1)
  })
})
