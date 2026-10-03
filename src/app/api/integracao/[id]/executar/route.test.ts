import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
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

const session = { user: { id: "1" } }
const fetchMock = vi.fn()

function get(id: string, query = "") {
  const url = `http://localhost/api/integracao/${id}/executar${query}`
  return GET(new NextRequest(url), { params: Promise.resolve({ id }) })
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
    expect(await res.json()).toEqual({ error: "id inválido", success: false })
  })

  it("retorna 404 quando a integração não existe", async () => {
    db.select = vi.fn(() => createQueryBuilder([]))
    const res = await get("99")
    expect(res.status).toBe(404)
    expect(await res.json()).toEqual({ error: "Integração não encontrada", success: false })
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
      ])
    )
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
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
      ])
    )
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
    const res = await get("2")
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.request.url).toContain("api_key=chave123")
    expect(data.requestHeaders.Authorization).toBeUndefined()
  })

  it("não deixa o cliente forjar a api key que a integração usa", async () => {
    db.select = vi.fn(() =>
      createQueryBuilder([
        {
          id: 2,
          nome: "WMS",
          baseUrl: "https://wms.exemplo.com",
          tipoAuth: "api_key",
          authConfig: { key: "chave123", key_name: "api_key", in: "query" },
        },
      ])
    )
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    )
    const res = await get("2", "?api_key=chaveDoMalicioso")
    const data = await res.json()
    expect(data.request.url).toContain("api_key=chave123")
    expect(data.request.url).not.toContain("chaveDoMalicioso")
  })

  describe("escopo da integração", () => {
    function integracao(over: Record<string, unknown> = {}) {
      db.select = vi.fn(() =>
        createQueryBuilder([
          {
            id: 3,
            nome: "ERP",
            baseUrl: "https://api.exemplo.com/v1",
            tipoAuth: "bearer",
            authConfig: { token: "tok1234567890" },
            ativo: true,
            telas: ["clientes", "faturamento"],
            ...over,
          },
        ])
      )
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    }

    it("bloqueia a integração inativa antes de chamar o ERP", async () => {
      integracao({ ativo: false })
      const res = await get("3", "?tela=clientes")
      expect(res.status).toBe(403)
      expect(await res.json()).toEqual({ error: "Integração inativa", success: false })
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("bloqueia tela que a integração não atende", async () => {
      integracao()
      const res = await get("3", "?tela=romaneio")
      expect(res.status).toBe(403)
      expect(await res.json()).toEqual({
        error: "Integração não serve esta tela",
        success: false,
      })
      expect(fetchMock).not.toHaveBeenCalled()
    })

    it("libera a tela declarada na integração", async () => {
      integracao()
      const res = await get("3", "?tela=faturamento&page=1")
      expect(res.status).toBe(200)
      expect((await res.json()).request.url).toContain("page=1")
    })

    it("não aplica escopo quando a integração é legada (telas vazio)", async () => {
      integracao({ telas: [] })
      const res = await get("3", "?tela=qualquer-coisa")
      expect(res.status).toBe(200)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    it("não aplica escopo quando a requisição não diz de qual tela vem", async () => {
      integracao()
      const res = await get("3", "?page=1")
      expect(res.status).toBe(200)
      expect(fetchMock).toHaveBeenCalledTimes(1)
    })
  })

  describe("higiene dos parâmetros repassados", () => {
    beforeEach(() => {
      db.select = vi.fn(() =>
        createQueryBuilder([
          {
            id: 4,
            nome: "ERP",
            baseUrl: "https://api.exemplo.com/v1",
            tipoAuth: "bearer",
            authConfig: { token: "tok1234567890" },
            ativo: true,
            telas: [],
          },
        ])
      )
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    })

    async function urlEnviada(query: string): Promise<string> {
      const res = await get("4", query)
      expect(res.status).toBe(200)
      const data = await res.json()
      return data.request.url as string
    }

    it("tira caractere de controle do valor (injeção de cabeçalho/quebra de log)", async () => {
      const url = await urlEnviada("?search=abc%0d%0aX-Evil:%201")
      expect(url).toContain("search=abcX-Evil")
      expect(url).not.toContain("%0d")
      expect(url).not.toContain("\n")
    })

    it("descarta parâmetro com nome malformado", async () => {
      const url = await urlEnviada("?page=1&%3Cscript%3E=1")
      expect(url).not.toContain("script")
      expect(url).toContain("page=1")
    })

    it("limita o tamanho do valor", async () => {
      const url = await urlEnviada(`?search=${"a".repeat(900)}`)
      const valor = new URL(url).searchParams.get("search") ?? ""
      expect(valor).toHaveLength(500)
    })

    it("ignora limit/offset negativo ou não numérico", async () => {
      const url = await urlEnviada("?limit=-10&offset=abc&page=3")
      expect(url).not.toContain("limit=")
      expect(url).not.toContain("offset=")
      expect(url).toContain("page=3")
    })

    it("limita o limit ao teto e normaliza decimal", async () => {
      const url = await urlEnviada("?limit=99999&offset=10.9")
      expect(new URL(url).searchParams.get("limit")).toBe("5000")
      expect(new URL(url).searchParams.get("offset")).toBe("10")
    })

    it("não deixa passar uma enxurrada de parâmetros", async () => {
      const muitos = Array.from({ length: 40 }, (_, i) => `p${i}=${i}`).join("&")
      const url = await urlEnviada(`?${muitos}`)
      const params = [...new URL(url).searchParams.keys()]
      expect(params.length).toBeLessThanOrEqual(20)
      expect(params).toContain("p0")
    })
  })
})
