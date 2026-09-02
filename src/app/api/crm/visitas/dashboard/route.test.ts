// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from "vitest"
import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth"
import { db } from "@/lib/db"
import { createQueryBuilder, resetDb } from "@/test/route-db-mock"
import { GET } from "./route"

vi.mock("@/lib/auth", () => ({ requireAuth: vi.fn() }))
vi.mock("@/lib/db", () => ({
  db: { select: vi.fn() },
}))

const sessionAdmin = { session: { user: { id: "1", role: "ADMIN", name: "Tiago" } }, userId: 1 }

function mockSelects(results: unknown[]) {
  for (const r of results) {
    ;(db.select as ReturnType<typeof vi.fn>).mockReturnValueOnce(createQueryBuilder(r as any))
  }
}

describe("GET /api/crm/visitas/dashboard", () => {
  beforeEach(() => {
    vi.mocked(requireAuth).mockReset()
    resetDb(db)
    vi.mocked(requireAuth).mockResolvedValue(sessionAdmin as any)
  })

  it("retorna 401 sem autenticação", async () => {
    vi.mocked(requireAuth).mockResolvedValue(new NextResponse(JSON.stringify({ error: "Não autorizado" }), { status: 401 }) as any)
    const res = await GET(new NextRequest("http://localhost/api/crm/visitas/dashboard"))
    expect(res.status).toBe(401)
  })

  it("agrega KPIs: porDia, porGerente (média/melhor/pior dia) e viagens", async () => {
    mockSelects([
      [{ total: 37 }], // totalVisitas
      [{ total: 37 }], // realizadas
      [{ total: 0 }], // canceladas
      [{ total: 0 }], // agendadas
      [{ total: 5 }], // visitasHoje
      [{ total: 37 }], // visitasMes
      [{ tipo: "PRESENCIAL", total: 30 }, { tipo: "VIDEO", total: 7 }], // byTipo
      [{ status: "REALIZADA", total: 37 }], // byStatus
      [{ dia: "2026-08-10", total: 5 }, { dia: "2026-08-20", total: 7 }], // porDia
      [
        { gerenteId: 8, gerenteNome: "Ernandes", dataVisita: "2026-08-20", total: 7 },
        { gerenteId: 8, gerenteNome: "Ernandes", dataVisita: "2026-08-11", total: 1 },
        { gerenteId: 8, gerenteNome: "Ernandes", dataVisita: "2026-08-12", total: 3 },
      ], // porGerenteRaw
      [{ viagemId: 1, viagemTitulo: "Viagem Goiania - Ernandes", total: 37 }], // viagens
      [], // ultimasVisitas
      [{ total: 0 }], // pesquisasEnviadas
      [{ total: 0 }], // pesquisasAbertas
      [{ total: 0 }], // pesquisasRespondidas
    ])

    const res = await GET(new NextRequest("http://localhost/api/crm/visitas/dashboard"))
    expect(res.status).toBe(200)
    const body = await res.json()

    expect(body.total).toBe(37)
    expect(body.porDia).toEqual([
      { dia: "2026-08-10", total: 5 },
      { dia: "2026-08-20", total: 7 },
    ])
    expect(body.porGerente).toHaveLength(1)
    const g = body.porGerente[0]
    expect(g.gerenteNome).toBe("Ernandes")
    expect(g.visitas).toBe(11)
    expect(g.diasAtivos).toBe(3)
    expect(g.mediaPorDia).toBe(3.7)
    expect(g.melhorDia).toEqual({ dia: "2026-08-20", total: 7 })
    expect(g.piorDia).toEqual({ dia: "2026-08-11", total: 1 })
    expect(body.viagens).toContainEqual({
      viagemId: 1,
      viagemTitulo: "Viagem Goiania - Ernandes",
      total: 37,
    })
  })

  it("mapeia viagem sem id para 'Sem viagem'", async () => {
    mockSelects([
      [{ total: 0 }], [{ total: 0 }], [{ total: 0 }], [{ total: 0 }],
      [{ total: 0 }], [{ total: 0 }], [], [], [], [], 
      [{ viagemId: null, viagemTitulo: null, total: 3 }],
      [], [{ total: 0 }], [{ total: 0 }], [{ total: 0 }],
    ])
    const res = await GET(new NextRequest("http://localhost/api/crm/visitas/dashboard"))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.viagens[0]).toEqual({ viagemId: null, viagemTitulo: "Sem viagem", total: 3 })
  })
})
