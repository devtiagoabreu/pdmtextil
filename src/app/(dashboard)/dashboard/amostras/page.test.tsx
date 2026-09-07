// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
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

  it("abre o modal de filtro como dialog acessível ao clicar num card", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/dashboard/amostras-stats": {
        totalMes: 3,
        totalCru: 1,
        totalAcab: 2,
        statusConfigs: [],
        statusDistribution: [],
        tipoDistribution: [],
        monthlyTrend: [],
        recent: [],
      },
      "GET /api/admin/status?tipo=AMOSTRA": [],
      "GET /api/dashboard/amostras-lista?filtro=total-mes": [
        { id: 7, produtoId: 1, produtoCodigo: "P-001", descricao: "Chambray", produtoDescricao: "Tecido", tipoAmostra: "CRU", status: "CRIADO", createdAt: "2026-01-01" },
      ],
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<DashboardAmostras />)
    await screen.findByText("Nenhuma amostra recente")

    fireEvent.click(screen.getByRole("button", { name: /^Total Mês/ }))

    const dialog = await screen.findByRole("dialog", { name: "Total Mês" })
    expect(dialog).toBeInTheDocument()
    await waitFor(() => expect(within(dialog).getByText(/Chambray/)).toBeInTheDocument())
    fireEvent.click(within(dialog).getByRole("button", { name: "Fechar" }))
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Total Mês" })).not.toBeInTheDocument())
  })
})
