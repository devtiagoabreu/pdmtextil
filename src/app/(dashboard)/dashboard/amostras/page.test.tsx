// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import DashboardAmostras from "./page"

describe("DashboardAmostras", () => {
  it("renderiza o heading e o estado vazio de amostras recentes", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/dashboard/amostras-stats": {
        totalMes: 0,
        totalCru: 0,
        totalAcab: 0,
        statusConfigs: [],
        statusDistribution: [],
        tipoDistribution: [],
        monthlyTrend: [],
        recent: [],
      },
      "GET /api/admin/status?tipo=AMOSTRA": [],
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<DashboardAmostras />)
    expect(screen.getByRole("heading", { name: /Dashboard de Amostras de Desenvolvimento/ })).toBeInTheDocument()
    expect(await screen.findByText("Nenhuma amostra recente")).toBeInTheDocument()
  })
})
