// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import HistoricoAmostraPage from "./page"

describe("HistoricoAmostraPage", () => {
  it("renderiza o heading e o estado de seleção", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/amostras": { tecidoCru: [], acabamento: [] },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<HistoricoAmostraPage />)
    expect(screen.getByRole("heading", { name: /Histórico de Amostra/ })).toBeInTheDocument()
    expect(await screen.findByText("Selecione uma amostra para ver o histórico completo")).toBeInTheDocument()
  })
})
