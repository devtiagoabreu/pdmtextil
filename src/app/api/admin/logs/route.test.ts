import { describe, it, expect, vi, beforeEach } from "vitest"
import { getServerSession } from "next-auth"
import { NextRequest } from "next/server"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET } from "./route"

vi.mock("next-auth", () => ({ getServerSession: vi.fn() }))
vi.mock("@/lib/auth", () => ({ authOptions: {} }))
vi.mock("@/lib/db", () => ({ db: { select: vi.fn() } }))

const session = { user: { id: "28", role: "ADMIN" } }

const log = {
  id: 81,
  tipo: "ERRO",
  acao: "alterar_usuario",
  descricao: "Tentativa de alterar um usuário sem permissão",
  entidade: "usuarios",
  entidadeId: "12",
  usuarioNome: "Admin",
  usuarioNomeOutros: null,
  dados: null,
  erro: null,
  createdAt: new Date(),
}

function mockSelectSequence(...results: any[]) {
  db.select = vi.fn()
  for (const r of results) {
    vi.mocked(db.select).mockImplementationOnce(() => createQueryBuilder(r))
  }
}

function makeRequest(query = "") {
  return new NextRequest(`http://localhost/api/admin/logs${query}`)
}

describe("GET /api/admin/logs", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
    vi.mocked(getServerSession).mockResolvedValue(null as any)
  })

  it("retorna 401 sem sessão", async () => {
    const res = await GET(makeRequest())
    expect(res.status).toBe(401)
  })

  it("lista logs paginados com filtro de tipo", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    mockSelectSequence([{ total: 1 }], [log])

    const res = await GET(makeRequest("?tipo=ERRO"))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.itens).toHaveLength(1)
    expect(data.total).toBe(1)
    expect(data.itens[0].acao).toBe("alterar_usuario")
    expect(data.pagina).toBe(1)
  })

  it("aplica busca ao filtro", async () => {
    vi.mocked(getServerSession).mockResolvedValue(session as any)
    mockSelectSequence([{ total: 0 }], [])

    const res = await GET(makeRequest("?tipo=ERRO&busca=usu&pagina=1&limite=20"))
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.itens).toHaveLength(0)
    expect(data.total).toBe(0)
  })
})
