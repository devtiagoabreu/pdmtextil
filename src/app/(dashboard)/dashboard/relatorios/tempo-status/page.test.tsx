// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import RelatorioTempoStatus from "./page"

describe("RelatorioTempoStatus", () => {
  it("renderiza o heading e o estado vazio", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/admin/status?tipo=SOLICITACAO_DESENVOLVIMENTO": [],
      "GET /api/relatorios/tempo-status": {
        stats: { totalSolicitacoes: 0, concluidas: 0, tempoMedioHoras: 0, mediaTrocasStatus: 0 },
        resultados: [],
      },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<RelatorioTempoStatus />)
    expect(screen.getByRole("heading", { name: /Tempo em cada Status/ })).toBeInTheDocument()
    expect(await screen.findByText("Nenhum resultado")).toBeInTheDocument()
  })
})
