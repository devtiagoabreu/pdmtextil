// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import RelatorioTempoStatusAmostras from "./page"

describe("RelatorioTempoStatusAmostras", () => {
  it("renderiza o heading e o estado vazio", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/relatorios/tempo-status-amostras": {
        stats: { total: 0, totalTecidoCru: 0, totalAcabamento: 0, pendentes: 0, aprovadas: 0 },
        tecidoCru: [],
        acabamento: [],
      },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<RelatorioTempoStatusAmostras />)
    expect(screen.getByRole("heading", { name: /Tempo em cada Status/ })).toBeInTheDocument()
    expect(await screen.findByText("Nenhuma amostra encontrada")).toBeInTheDocument()
  })
})
