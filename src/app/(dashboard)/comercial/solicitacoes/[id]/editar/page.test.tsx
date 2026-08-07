// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, navMock } from "@/test/harness"
import EditarSolicitacaoPage from "./page"

const sol = {
  id: 5,
  tipo: "DESENVOLVIMENTO_TECELAGEM",
  cliente: "Cliente Detalhe",
  cnpj: "11.222.333/0001-44",
  projeto: "Coleção Verão",
  prazoDesejado: "2026-12-01T00:00:00.000Z",
  briefing: {},
  anexos: [],
}

describe("EditarSolicitacaoPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/solicitacoes/5/editar")
    navMock.setParams({ id: "5" })
  })

  it("renderiza o wizard de edição com os dados carregados", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/solicitacoes/5") return { json: sol }
      if (method === "GET" && url.startsWith("/api/clientes?")) return { json: [] }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<EditarSolicitacaoPage />)

    await screen.findByRole("heading", { name: /Editar Solicitação #5/ })
    expect(screen.getByText("Dados Comerciais")).toBeInTheDocument()
    expect(screen.getByText("Briefing Técnico")).toBeInTheDocument()
    expect(screen.getByText("Salvar")).toBeInTheDocument()
    await screen.findByDisplayValue("Cliente Detalhe")
    expect(screen.getByRole("button", { name: /Continuar para Briefing/ })).toBeInTheDocument()
  })
})
