// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
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

  it("abre o modal de filtro como dialog acessível ao clicar num card", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/dashboard/amostra-comercial-stats": {
        total: 2,
        pendentes: 1,
        emProducao: 0,
        concluidos: 1,
        statusConfigs: [],
        statusDistribution: [],
        monthlyTrend: [],
        recent: [],
      },
      "GET /api/admin/status?tipo=AMOSTRA_COMERCIAL": [],
      "GET /api/dashboard/amostra-comercial-lista?filtro=pendentes": [
        { id: 5, titulo: "Amostra Verão", cliente: "Malharia Tupiniquim", status: "PENDENTE", createdAt: "2026-01-01" },
      ],
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<DashboardAmostraComercial />)
    await screen.findByText("Nenhuma requisição recente")

    fireEvent.click(screen.getByRole("button", { name: /^Pendentes/ }))

    const dialog = await screen.findByRole("dialog", { name: "Pendentes" })
    expect(dialog).toBeInTheDocument()
    await waitFor(() => expect(within(dialog).getByText(/Amostra Verão/)).toBeInTheDocument())
    fireEvent.click(within(dialog).getByRole("button", { name: "Fechar" }))
    await waitFor(() => expect(screen.queryByRole("dialog", { name: "Pendentes" })).not.toBeInTheDocument())
  })
})
