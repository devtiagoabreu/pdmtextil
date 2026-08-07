// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen } from "@testing-library/react"
import { createFetchMock, renderPage, navMock } from "@/test/harness"
import DetalheSolicitacaoPage from "./page"

const sol = {
  id: 5,
  tipo: "DESENVOLVIMENTO_TECELAGEM",
  cliente: "Cliente Detalhe",
  cnpj: "11.222.333/0001-44",
  projeto: "Coleção Verão",
  prazoDesejado: "2026-12-01T00:00:00.000Z",
  status: "EM_ANDAMENTO",
  createdAt: "2026-01-01T00:00:00.000Z",
  briefing: {},
  anexos: [],
  historicoComunicacao: [],
}

describe("DetalheSolicitacaoPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/solicitacoes/5")
    navMock.setParams({ id: "5" })
  })

  it("renderiza o detalhe com dados e ações", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/status?tipo=SOLICITACAO_DESENVOLVIMENTO") return { json: [] }
      if (method === "GET" && url === "/api/solicitacoes/5/produtos-cru") return { json: [] }
      if (method === "GET" && url.startsWith("/api/solicitacoes/5?t=")) return { json: sol }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<DetalheSolicitacaoPage />)

    await screen.findByRole("heading", { name: /#5 - Cliente Detalhe/ })
    expect(screen.getAllByText("Coleção Verão").length).toBeGreaterThan(0)
    expect(screen.getByRole("link", { name: /Editar/ })).toHaveAttribute("href", "/comercial/solicitacoes/5/editar")
    expect(screen.getByRole("button", { name: "Atualizar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Excluir" })).toBeInTheDocument()
  })
})
