// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
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

  it("abre o modal de filtro como dialog acessível ao clicar num card", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/dashboard/requisicoes-corte-stats": {
        totalGeral: 5,
        solicitados: 2,
        processando: 1,
        atendidos: 2,
        totalEsteMes: 0,
        totalCortes: 5,
        totalItens: 0,
        statusDistribution: [],
        monthlyTrend: [],
      },
      "GET /api/dashboard/requisicoes-corte-lista?filtro=solicitados": [
        { id: 10, requisitanteNome: "João", totalCortes: 3, quantidadeTotal: 9, status: "SOLICITADO", createdAt: "2026-01-01" },
      ],
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<DashboardRequisicoesCorte />)
    await screen.findByText("Total de Cortes")

    fireEvent.click(screen.getByRole("button", { name: /^Solicitados/ }))

    const dialog = await screen.findByRole("dialog", { name: "Solicitados" })
    expect(dialog).toBeInTheDocument()
    await waitFor(() => expect(within(dialog).getByText(/João/)).toBeInTheDocument())
    fireEvent.click(within(dialog).getByRole("button", { name: "Fechar" }))
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Solicitados" })).not.toBeInTheDocument())
  })
})
