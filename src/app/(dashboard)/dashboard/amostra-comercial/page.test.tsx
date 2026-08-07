// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import DashboardAmostraComercial from "./page"

describe("DashboardAmostraComercial", () => {
  it("renderiza o heading e o estado vazio de requisições recentes", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/dashboard/amostra-comercial-stats": {
        total: 0,
        pendentes: 0,
        emProducao: 0,
        concluidos: 0,
        statusConfigs: [],
        statusDistribution: [],
        monthlyTrend: [],
        recent: [],
      },
      "GET /api/admin/status?tipo=AMOSTRA_COMERCIAL": [],
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<DashboardAmostraComercial />)
    expect(screen.getByRole("heading", { name: /Dashboard — Amostras Comerciais/ })).toBeInTheDocument()
    expect(await screen.findByText("Nenhuma requisição recente")).toBeInTheDocument()
  })
})
