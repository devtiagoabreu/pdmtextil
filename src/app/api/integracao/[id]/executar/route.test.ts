import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
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

const session = { user: { id: "1" } }
const fetchMock = vi.fn()

function get(id: string, query = "") {
  const url = `http://localhost/api/integracao/${id}/executar${query}`
  return GET(new Request(url), { params: Promise.resolve({ id }) })
}

describe("GET /api/integracao/[id]/executar", () => {
  beforeEach(() => {
    vi.mocked(getServerSession).mockReset()
    resetDb(db)
    fetchMock.mockReset()
    vi.stubGlobal("fetch", fetchMock)
    vi.mocked(getServerSession).mockResolvedValue(session as any)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("retorna 401 quando não está autenticado", async () => {
    vi.mocked(getServerSession).mockResolvedValue(null as any)
    const res = await get("1")
    expect(res.status).toBe(401)
  })

  it("retorna 400 quando o id é inválido", async () => {
    const res = await get("abc")
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: "id inválido" })
  })

  it("retorna 404 quando a integração não existe", async () => {
    db.select = vi.fn(() => createQueryBuilder([]))
    const res = await get("99")
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Integração não encontrada" })
  })

  it("executa com autenticação bearer e mascara o token", async () => {
    db.select = vi.fn(() =>
      createQueryBuilder([
        {
          id: 1,
          nome: "ERP",
          baseUrl: "https://api.exemplo.com/v1",
          tipoAuth: "bearer",
          authConfig: { token: "tok1234567890" },
        },
      ]),
    )
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const res = await get("1", "?tela=clientes&page=2")
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.success).toBe(true)
    expect(data.status).toBe(200)
    expect(data.responseBody).toEqual({ ok: true })
    expect(data.request.url).toContain("page=2")
    expect(data.request.url).not.toContain("tela=")
    expect(data.requestHeaders.Authorization).toBe("Bearer tok1****7890")
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("envia a api key na query quando configurado", async () => {
    db.select = vi.fn(() =>
      createQueryBuilder([
        {
          id: 2,
          nome: "WMS",
          baseUrl: "https://wms.exemplo.com",
          tipoAuth: "api_key",
          authConfig: { key: "chave123", key_name: "api_key", in: "query" },
        },
      ]),
    )
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    )
    const res = await get("2")
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.request.url).toContain("api_key=chave123")
    expect(data.requestHeaders.Authorization).toBeUndefined()
  })
})
