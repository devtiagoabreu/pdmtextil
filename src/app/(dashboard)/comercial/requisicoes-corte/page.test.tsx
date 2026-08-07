// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"
import ListaRequisicoesCortePage from "./page"

const dados = [
  { id: 30, requisitanteNome: "Tiago", totalCortes: 4, quantidadeTotal: 120, status: "SOLICITADO", createdAt: "2026-01-01T00:00:00.000Z" },
  { id: 31, requisitanteNome: "Ana", totalCortes: 2, quantidadeTotal: 50, status: "ATENDIDO", createdAt: "2026-01-02T00:00:00.000Z" },
]

function makeMock() {
  return createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/comercial/requisicoes-corte") return { json: dados }
    if (method === "DELETE" && url === "/api/comercial/requisicoes-corte/30") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
}

describe("ListaRequisicoesCortePage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/requisicoes-corte")
  })

  it("renderiza a lista com os dados carregados", async () => {
    const fetchMock = makeMock()
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ListaRequisicoesCortePage />)

    expect(await screen.findByRole("heading", { name: /Requisições de Corte/ })).toBeInTheDocument()
    expect(screen.getByText("Tiago")).toBeInTheDocument()
    expect(screen.getByText("Ana")).toBeInTheDocument()
    expect(screen.getByText("Solicitado")).toBeInTheDocument()
    expect(screen.getByText("Atendido")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Nova Requisição" })).toHaveAttribute("href", "/comercial/requisicoes-corte/nova")
    expect(screen.getByRole("link", { name: /Requisição por Romaneio/ })).toHaveAttribute("href", "/comercial/requisicoes-corte/por-romaneio")
  })

  it("mostra o estado vazio quando não há requisições", async () => {
    const fetchMock = createFetchMock(() => ({ json: [] }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ListaRequisicoesCortePage />)

    expect(await screen.findByText("Nenhuma requisição encontrada")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Criar primeira requisição" })).toHaveAttribute("href", "/comercial/requisicoes-corte/nova")
  })

  it("filtra a lista pela busca", async () => {
    const fetchMock = makeMock()
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ListaRequisicoesCortePage />)
    await screen.findByText("Tiago")

    fireEvent.change(screen.getByPlaceholderText("Buscar por requitante..."), {
      target: { value: "tiago" },
    })

    expect(screen.getByText("Tiago")).toBeInTheDocument()
    expect(screen.queryByText("Ana")).not.toBeInTheDocument()
  })

  it("exclui uma requisição através do modal de confirmação", async () => {
    const fetchMock = makeMock()
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ListaRequisicoesCortePage />)
    await screen.findByText("Tiago")

    const row = screen.getByText("Tiago").closest("tr")!
    fireEvent.click(within(row).getByRole("button", { name: "Excluir" }))

    const dialog = screen.getByRole("dialog", { name: "Excluir requisição?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/comercial/requisicoes-corte/30", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Requisição excluída com sucesso"))
    expect(screen.queryByText("Tiago")).not.toBeInTheDocument()
  })
})
