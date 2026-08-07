// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import HistoricoSolicitacaoPage from "./page"

describe("HistoricoSolicitacaoPage", () => {
  it("renderiza o heading e o estado de seleção", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/solicitacoes?limit=200": [],
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<HistoricoSolicitacaoPage />)
    expect(screen.getByRole("heading", { name: /Histórico de Solicitação/ })).toBeInTheDocument()
    expect(await screen.findByText("Selecione uma solicitação para ver o histórico completo")).toBeInTheDocument()
  })
})
