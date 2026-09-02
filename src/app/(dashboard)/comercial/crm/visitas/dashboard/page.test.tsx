// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import VisitasDashboardPage from "./page"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { name: "Admin", role: "ADMIN" } }, status: "authenticated" }),
}))

describe("VisitasDashboardPage", () => {
  it("renderiza o heading e as seções", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/crm/visitas/dashboard?mine=true": {
        total: 0,
        realizadas: 0,
        canceladas: 0,
        agendadas: 0,
        hoje: 0,
        esteMes: 0,
        byTipo: [],
        byStatus: [],
        porDia: [],
        porGerente: [],
        viagens: [],
        ultimasVisitas: [],
        pesquisas: { enviadas: 0, abertas: 0, respondidas: 0 },
      },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<VisitasDashboardPage />)
    expect(screen.getByRole("heading", { name: "Dashboard de Visitas" })).toBeInTheDocument()
    expect(await screen.findByText("Ações Rápidas")).toBeInTheDocument()
    expect(screen.getByText("Performance por Gerente Comercial")).toBeInTheDocument()
    expect(screen.getByText("Viagens")).toBeInTheDocument()
  })

  it("renderiza viagens e performance por gerente comercial com KPIs", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/crm/visitas/dashboard?mine=true": {
        total: 37,
        realizadas: 37,
        canceladas: 0,
        agendadas: 0,
        hoje: 5,
        esteMes: 37,
        byTipo: [],
        byStatus: [],
        porDia: [{ dia: "2026-08-10", total: 5 }],
        porGerente: [
          {
            gerenteId: 8,
            gerenteNome: "Ernandes Rodrigues",
            visitas: 37,
            diasAtivos: 12,
            mediaPorDia: 3.1,
            melhorDia: { dia: "2026-08-20", total: 7 },
            piorDia: { dia: "2026-08-11", total: 1 },
          },
        ],
        viagens: [
          { viagemId: 1, viagemTitulo: "Viagem Goiania - Ernandes", total: 37 },
          { viagemId: null, viagemTitulo: "Sem viagem", total: 0 },
        ],
        ultimasVisitas: [],
        pesquisas: { enviadas: 0, abertas: 0, respondidas: 0 },
      },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<VisitasDashboardPage />)

    expect(await screen.findByText("Ernandes Rodrigues")).toBeInTheDocument()
    expect(screen.getByText("Média/dia")).toBeInTheDocument()
    expect(screen.getByText("3.1")).toBeInTheDocument()
    expect(screen.getByText("Melhor dia")).toBeInTheDocument()
    expect(screen.getByText(/Pior dia/)).toBeInTheDocument()
    expect(screen.getByText("Viagem Goiania - Ernandes")).toBeInTheDocument()
    expect(screen.getAllByText("37 visitas").length).toBeGreaterThan(0)
  })
})

