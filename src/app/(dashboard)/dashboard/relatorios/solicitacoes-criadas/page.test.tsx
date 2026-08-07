// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import RelatorioSolicitacoesCriadas from "./page"

describe("RelatorioSolicitacoesCriadas", () => {
  it("renderiza o heading e o estado vazio da lista", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/admin/status?tipo=SOLICITACAO_DESENVOLVIMENTO": [],
      "GET /api/relatorios/solicitacoes-criadas": {
        stats: { totalCriadas: 0, totalDeletadas: 0, concluidas: 0, emAndamento: 0, taxaSucesso: 0 },
        porMes: [],
        recentes: [],
      },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<RelatorioSolicitacoesCriadas />)
    expect(screen.getByRole("heading", { name: /Solicitações de Desenvolvimento Criadas/ })).toBeInTheDocument()
    expect(await screen.findByText("Nenhuma solicitação encontrada")).toBeInTheDocument()
  })
})
