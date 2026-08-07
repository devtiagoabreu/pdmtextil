// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import RelatorioSolicitacoesConcluidas from "./page"

describe("RelatorioSolicitacoesConcluidas", () => {
  it("renderiza o heading e o estado vazio da lista", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/admin/status?tipo=SOLICITACAO_DESENVOLVIMENTO": [],
      "GET /api/relatorios/solicitacoes-concluidas": {
        stats: { total: 0, tecelagem: 0, beneficiamento: 0 },
        porMes: [],
        lista: [],
      },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<RelatorioSolicitacoesConcluidas />)
    expect(screen.getByRole("heading", { name: /Concluídas Desenvolvimento/ })).toBeInTheDocument()
    expect(await screen.findByText("Nenhuma solicitação concluída encontrada")).toBeInTheDocument()
  })
})
