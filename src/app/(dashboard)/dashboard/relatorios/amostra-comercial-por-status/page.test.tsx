// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import RelatorioAmostraComercialPorStatus from "./page"

describe("RelatorioAmostraComercialPorStatus", () => {
  it("renderiza o heading e o estado vazio da lista", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/admin/status?tipo=AMOSTRA_COMERCIAL": [
        { id: 1, nome: "PENDENTE", rotulo: "Pendente", tipo: "AMOSTRA_COMERCIAL", cor: "#eab308", ordem: 1, ativo: true },
      ],
      "GET /api/relatorios/amostra-comercial-por-status?status=PENDENTE": {
        stats: { total: 0 },
        porMes: [],
        lista: [],
      },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<RelatorioAmostraComercialPorStatus />)
    expect(screen.getByRole("heading", { name: /Amostras Comerciais por Status/ })).toBeInTheDocument()
    expect(await screen.findByText("Nenhuma requisição encontrada")).toBeInTheDocument()
  })
})
