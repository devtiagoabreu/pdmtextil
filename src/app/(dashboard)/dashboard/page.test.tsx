// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import DashboardPage from "./page"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { name: "Admin" } }, status: "authenticated" }),
}))

describe("DashboardPage", () => {
  it("renderiza o heading e o estado final das atividades", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/dashboard/stats": {
        totalGeral: 17,
        totalEsteMes: 5,
        pendentes: 0,
        emDesenvolvimento: 0,
        pilotagem: 0,
        concluidoDev: 0,
        aprovadoCliente: 0,
        totalProdutosCru: 0,
        monthlyTrend: [],
        statusDistribution: [],
        tipoDistribution: [],
      },
      "GET /api/dashboard/atividades": [],
      "GET /api/admin/status?tipo=SOLICITACAO_DESENVOLVIMENTO": [],
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<DashboardPage />)
    expect(screen.getByRole("heading", { name: /Dashboard Solicitações de Desenvolvimento/ })).toBeInTheDocument()
    expect(await screen.findByText("Total geral")).toBeInTheDocument()
    expect(await screen.findByText(/este mês/)).toBeInTheDocument()
    expect(await screen.findByText("Nenhuma atividade recente")).toBeInTheDocument()
  })
})
