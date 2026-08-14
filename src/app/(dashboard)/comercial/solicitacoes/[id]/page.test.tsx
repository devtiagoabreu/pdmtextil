// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import { createFetchMock, renderPage, navMock, toastMock, findCall } from "@/test/harness"
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

const catalogos = [
  { id: 10, codigoPdm: "TEC-001", descricao: "Tecido Premium", status: "DESENVOLVIMENTO" },
  { id: 11, codigoPdm: "TEC-002", descricao: "Tecido Oxford", status: "DESENVOLVIMENTO" },
]

describe("DetalheSolicitacaoPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/solicitacoes/5")
    navMock.setParams({ id: "5" })
    toastMock.success.mockClear()
    toastMock.error.mockClear()
  })

  it("renderiza o detalhe com dados e ações", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/status?tipo=SOLICITACAO_DESENVOLVIMENTO") return { json: [] }
      if (method === "GET" && url === "/api/solicitacoes/5/produtos-cru") return { json: [] }
      if (method === "GET" && url === "/api/cadastros/produto-cru") return { json: [] }
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

  it("vincula produtos à solicitação", async () => {
    let vinculados: any[] = []
    const fetchMock = createFetchMock(({ method, url, body }) => {
      if (method === "GET" && url === "/api/admin/status?tipo=SOLICITACAO_DESENVOLVIMENTO") return { json: [] }
      if (method === "GET" && url === "/api/cadastros/produto-cru") return { json: catalogos }
      if (method === "GET" && url === "/api/solicitacoes/5/produtos-cru") return { json: vinculados }
      if (method === "POST" && url === "/api/solicitacoes/5/produtos-cru") {
        vinculados = catalogos.filter((c) => body.produtos.includes(c.id))
        return { json: { success: true } }
      }
      if (method === "GET" && url.startsWith("/api/solicitacoes/5?t=")) return { json: sol }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<DetalheSolicitacaoPage />)
    await screen.findByRole("heading", { name: /#5 - Cliente Detalhe/ })

    const busca = screen.getByPlaceholderText("Buscar por código PDM ou descrição...")
    fireEvent.change(busca, { target: { value: "TEC-001" } })
    const checkbox = await screen.findByRole("checkbox")
    fireEvent.click(checkbox)

    fireEvent.click(screen.getByRole("button", { name: "Vincular" }))

    await waitFor(() => {
      expect(findCall(fetchMock.calls, "/api/solicitacoes/5/produtos-cru", "POST")).toBeTruthy()
    })
    expect(toastMock.success).toHaveBeenCalledWith("1 produto(s) vinculado(s)")
    expect(await screen.findByText(/TEC-001 — Tecido Premium/)).toBeInTheDocument()
  })

  it("desvincula um produto da solicitação", async () => {
    let vinculados: any[] = [catalogos[0]]
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/status?tipo=SOLICITACAO_DESENVOLVIMENTO") return { json: [] }
      if (method === "GET" && url === "/api/cadastros/produto-cru") return { json: catalogos }
      if (method === "GET" && url === "/api/solicitacoes/5/produtos-cru") return { json: vinculados }
      if (method === "DELETE" && url === "/api/solicitacoes/5/produtos-cru") {
        vinculados = []
        return { json: { success: true } }
      }
      if (method === "GET" && url.startsWith("/api/solicitacoes/5?t=")) return { json: sol }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<DetalheSolicitacaoPage />)
    await screen.findByRole("heading", { name: /#5 - Cliente Detalhe/ })

    fireEvent.click(await screen.findByRole("button", { name: /Desvincular/ }))

    const dialog = await screen.findByRole("dialog", { name: "Desvincular produto?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Desvincular" }))

    await waitFor(() => {
      expect(findCall(fetchMock.calls, "/api/solicitacoes/5/produtos-cru", "DELETE")).toBeTruthy()
    })
    expect(toastMock.success).toHaveBeenCalledWith("Produto desvinculado da solicitação")
    expect(await screen.findByText("Nenhum produto cadastrado para esta solicitação.")).toBeInTheDocument()
  })
})
