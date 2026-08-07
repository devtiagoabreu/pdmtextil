// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, routeJson } from "@/test/harness"
import RelatorioAtividadeUsuario from "./page"

describe("RelatorioAtividadeUsuario", () => {
  it("renderiza o heading e o estado vazio", async () => {
    const fetchMock = createFetchMock(routeJson({
      "GET /api/relatorios/atividade-usuario": {
        stats: { total: 0, totalUsuarios: 0, primeiraAtividade: null, ultimaAtividade: null },
        porUsuario: [],
        porTipo: [],
        recentes: [],
        filtros: { tipos: [], usuarios: [] },
      },
    }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<RelatorioAtividadeUsuario />)
    expect(screen.getByRole("heading", { name: /Atividade por Usuário/ })).toBeInTheDocument()
    expect(await screen.findByText("Nenhuma atividade encontrada")).toBeInTheDocument()
  })
})
