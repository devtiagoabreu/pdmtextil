// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import AtivosDashboardPage from "./page"
import { createFetchMock, renderPage, navMock } from "@/test/harness"

const DASHBOARD_DATA = {
  totais: {
    ativos: 42,
    categorias: 7,
    planos: 15,
    vistoriasMes: 8,
    pendentes: 5,
    atrasadas: 2,
  },
  proximas: [
    {
      id: 1,
      dataProgramada: "2026-09-20",
      status: "PENDENTE",
      ativoNome: "Gerador",
      ativoCodigo: "A-001",
      tipoVistoriaNome: "Grupo Gerador",
    },
    {
      id: 2,
      dataProgramada: "2026-09-25",
      status: "EM_ANDAMENTO",
      ativoNome: "Compressor",
      ativoCodigo: "A-002",
      tipoVistoriaNome: "Compressor Ar",
    },
  ],
  compliancePorArea: [
    { areaId: 26, areaNome: "Segurança", total: 10, conformes: 9, percentual: 90 },
    { areaId: 29, areaNome: "Mecânica", total: 8, conformes: 4, percentual: 50 },
  ],
}

describe("AtivosDashboardPage", () => {
  it("renderiza heading e cards com dados", async () => {
    navMock.setPathname("/ativos/dashboard")
    const fetchMock = createFetchMock(() => ({ json: DASHBOARD_DATA }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<AtivosDashboardPage />)

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeDefined()

    expect(screen.getByText("42")).toBeDefined()
    expect(screen.getByText("7")).toBeDefined()
    expect(screen.getByText("15")).toBeDefined()
    expect(screen.getByText("5")).toBeDefined()
    expect(screen.getByText("2")).toBeDefined()

    expect(screen.getByText("Gerador")).toBeDefined()
    expect(screen.getByText("A-001")).toBeDefined()
    expect(screen.getByText("Compressor")).toBeDefined()
    expect(screen.getByText("A-002")).toBeDefined()

    expect(screen.getByText("Segurança")).toBeDefined()
    expect(screen.getByText("90%")).toBeDefined()
    expect(screen.getByText("Mecânica")).toBeDefined()
    expect(screen.getByText("50%")).toBeDefined()
  })

  it("renderiza dados vazios sem crash", async () => {
    navMock.setPathname("/ativos/dashboard")
    const fetchMock = createFetchMock(() => ({
      json: {
        totais: {
          ativos: 0,
          categorias: 0,
          planos: 0,
          vistoriasMes: 0,
          pendentes: 0,
          atrasadas: 0,
        },
        proximas: [],
        compliancePorArea: [],
      },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<AtivosDashboardPage />)

    expect(await screen.findByRole("heading", { name: "Dashboard" })).toBeDefined()

    expect(screen.getAllByText("0")).toHaveLength(6)
    expect(screen.getByText("Nenhuma vistoria próxima")).toBeDefined()
    expect(screen.getByText("Nenhum dado de compliance")).toBeDefined()
  })
})
