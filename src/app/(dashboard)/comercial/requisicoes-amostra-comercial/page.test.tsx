// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"
import ListaRequisicoesAmostraComercialPage from "./page"

const dados = [
  { id: 10, titulo: "Amostra Tecido A", cliente: "Cliente A", status: "SOLICITADO", createdAt: "2026-01-01", produtoCodigo: "TEC-01", produtoDescricao: "Tecido poliéster" },
  { id: 11, titulo: "Amostra Tecido B", cliente: "Cliente B", status: "APROVADO", createdAt: "2026-01-02", produtoCodigo: "TEC-02", produtoDescricao: "" },
]

function makeMock() {
  return createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/requisicoes-amostra-comercial") return { json: dados }
    if (method === "GET" && url === "/api/admin/status?tipo=AMOSTRA_COMERCIAL") return { json: [] }
    if (method === "DELETE" && url === "/api/requisicoes-amostra-comercial/10") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
}

describe("ListaRequisicoesAmostraComercialPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/requisicoes-amostra-comercial")
  })

  it("renderiza a lista com os dados carregados", async () => {
    const fetchMock = makeMock()
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ListaRequisicoesAmostraComercialPage />)

    expect(await screen.findByRole("heading", { name: /Requisições de Amostra Comercial/ })).toBeInTheDocument()
    expect(screen.getByText("Amostra Tecido A")).toBeInTheDocument()
    expect(screen.getByText("Amostra Tecido B")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Nova Requisição" })).toHaveAttribute("href", "/comercial/requisicoes-amostra-comercial/novo")
  })

  it("mostra o estado vazio quando não há requisições", async () => {
    const fetchMock = createFetchMock(({ url }) => {
      if (url === "/api/admin/status?tipo=AMOSTRA_COMERCIAL") return { json: [] }
      return { json: [] }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ListaRequisicoesAmostraComercialPage />)

    expect(await screen.findByText("Nenhuma requisição encontrada")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Criar primeira requisição" })).toHaveAttribute("href", "/comercial/requisicoes-amostra-comercial/novo")
  })

  it("filtra a lista pela busca", async () => {
    const fetchMock = makeMock()
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ListaRequisicoesAmostraComercialPage />)
    await screen.findByText("Amostra Tecido A")

    fireEvent.change(screen.getByPlaceholderText("Buscar por ID, título, cliente ou produto..."), {
      target: { value: "cliente a" },
    })

    expect(screen.getByText("Amostra Tecido A")).toBeInTheDocument()
    expect(screen.queryByText("Amostra Tecido B")).not.toBeInTheDocument()
  })

  it("exclui uma requisição através do modal de confirmação", async () => {
    const fetchMock = makeMock()
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ListaRequisicoesAmostraComercialPage />)
    await screen.findByText("Amostra Tecido A")

    const row = screen.getByText("Amostra Tecido A").closest("tr")!
    fireEvent.click(within(row).getByRole("button", { name: "Excluir" }))

    const dialog = screen.getByRole("dialog", { name: "Excluir requisição?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/requisicoes-amostra-comercial/10", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Requisição excluída com sucesso"))
    await waitFor(() => expect(screen.queryByText("Amostra Tecido A")).not.toBeInTheDocument())
  })
})
