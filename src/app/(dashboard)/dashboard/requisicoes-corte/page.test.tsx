// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import DashboardRequisicoesCorte from "./page"

describe("DashboardRequisicoesCorte", () => {
  it("renderiza o heading e os cards de resumo", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/dashboard/requisicoes-corte-stats": {
        totalGeral: 0,
        solicitados: 0,
        processando: 0,
        atendidos: 0,
        totalEsteMes: 0,
        totalCortes: 0,
        totalItens: 0,
        statusDistribution: [],
        monthlyTrend: [],
      },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<DashboardRequisicoesCorte />)
    expect(screen.getByRole("heading", { name: /Dashboard Requisições de Corte/ })).toBeInTheDocument()
    expect(await screen.findByText("Total de Cortes")).toBeInTheDocument()
  })
})
