// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import RelatorioAmostrasPorStatus from "./page"

describe("RelatorioAmostrasPorStatus", () => {
  it("renderiza o heading e o estado vazio da lista", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/admin/status?tipo=AMOSTRA": [
        { id: 1, nome: "APROVADO", rotulo: "Aprovado", tipo: "AMOSTRA", cor: "#22c55e", ordem: 1, ativo: true },
      ],
      "GET /api/relatorios/amostras-por-status?status=APROVADO": {
        stats: { total: 0, tecidoCru: 0, acabamento: 0 },
        porMes: [],
        lista: [],
      },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<RelatorioAmostrasPorStatus />)
    expect(screen.getByRole("heading", { name: /Amostras de Desenvolvimento por Status/ })).toBeInTheDocument()
    expect(await screen.findByText("Nenhuma amostra encontrada")).toBeInTheDocument()
  })
})
