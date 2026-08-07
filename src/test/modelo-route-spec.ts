import { beforeEach, describe, expect, it, vi } from "vitest"
import { getServerSession } from "next-auth"

export interface ModeloRouteSpecConfig {
  title: string
  GET: (req: Request) => Promise<Response>
  csvHeader: string[]
  filename: string
  modelo: string
  roles?: string[]
}

function mockSession(role?: string) {
  return { user: { id: "1", role: role ?? "CLIENTE" } }
}

export function modeloRouteSpec(cfg: ModeloRouteSpecConfig) {
  const { title, GET, csvHeader, filename, modelo, roles } = cfg

  describe(title, () => {
    beforeEach(() => {
      vi.mocked(getServerSession).mockReset()
    })

    it("retorna 401 quando não há sessão", async () => {
      vi.mocked(getServerSession).mockResolvedValue(null as any)
      const res = await GET(new Request("http://localhost/api/modelo"))
      expect(res.status).toBe(401)
      expect(await res.json()).toEqual({ error: "Não autorizado" })
    })

    it("retorna CSV por padrão", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession(roles?.[0]) as any)
      const res = await GET(new Request("http://localhost/api/modelo"))
      expect(res.status).toBe(200)
      expect(res.headers.get("Content-Type")).toContain("text/csv")
      expect(res.headers.get("Content-Disposition")).toContain(filename)
      const text = await res.text()
      csvHeader.forEach((campo) => expect(text).toContain(campo))
    })

    it("retorna CSV quando formato=csv", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession(roles?.[0]) as any)
      const res = await GET(new Request("http://localhost/api/modelo?formato=csv"))
      expect(res.status).toBe(200)
      expect((await res.text()).split("\n")[0]).toBe(csvHeader.join(";"))
    })

    it("retorna JSON quando formato=json", async () => {
      vi.mocked(getServerSession).mockResolvedValue(mockSession(roles?.[0]) as any)
      const res = await GET(new Request("http://localhost/api/modelo?formato=json"))
      expect(res.status).toBe(200)
      const data = await res.json()
      expect(data.modelo).toBe(modelo)
      expect(data.versao).toBe("1.0")
      expect(Array.isArray(data.campos)).toBe(true)
      expect(Array.isArray(data.exemplo)).toBe(true)
    })

    if (roles && roles.length > 0) {
      it("retorna 401 quando a role não é permitida", async () => {
        vi.mocked(getServerSession).mockResolvedValue(mockSession("CLIENTE") as any)
        const res = await GET(new Request("http://localhost/api/modelo"))
        expect(res.status).toBe(401)
      })
    }
  })
}
