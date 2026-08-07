// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import RelatorioSolicitacoesPorStatus from "./page"

describe("RelatorioSolicitacoesPorStatus", () => {
  it("renderiza o heading e o estado vazio da lista", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/admin/status?tipo=SOLICITACAO_DESENVOLVIMENTO": [
        { id: 1, nome: "EM_DESENVOLVIMENTO", rotulo: "Em Desenvolvimento", tipo: "SOLICITACAO_DESENVOLVIMENTO", cor: "#6366f1", ordem: 1, ativo: true },
      ],
      "GET /api/relatorios/solicitacoes-por-status?status=EM_DESENVOLVIMENTO": {
        stats: { total: 0, tecelagem: 0, beneficiamento: 0 },
        porMes: [],
        lista: [],
      },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<RelatorioSolicitacoesPorStatus />)
    expect(screen.getByRole("heading", { name: /Solicitações de Desenvolvimento por Status/ })).toBeInTheDocument()
    expect(await screen.findByText("Nenhuma solicitação encontrada")).toBeInTheDocument()
  })
})
