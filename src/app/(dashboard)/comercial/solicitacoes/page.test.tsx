// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"
import ListaSolicitacoesPage from "./page"

const dados = [
  { id: 1, tipo: "DESENVOLVIMENTO_TECELAGEM", cliente: "Cliente A", solicitanteNome: "Ana", status: "EM_ANDAMENTO", createdAt: "2026-01-01", observacoes: "", anexosCount: 0 },
  { id: 2, tipo: "DESENVOLVIMENTO_BENEFICIAMENTO", cliente: "Cliente B", solicitanteNome: "Bia", status: "SOLICITADO", createdAt: "2026-01-02", observacoes: "", anexosCount: 0 },
]

function makeMock() {
  return createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/solicitacoes") return { json: dados }
    if (method === "GET" && url === "/api/admin/status?tipo=SOLICITACAO_DESENVOLVIMENTO") return { json: [] }
    if (method === "DELETE" && url === "/api/solicitacoes/1") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
}

describe("ListaSolicitacoesPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/solicitacoes")
  })

  it("renderiza a lista com os dados carregados", async () => {
    const fetchMock = makeMock()
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ListaSolicitacoesPage />)

    expect(await screen.findByRole("heading", { name: /Minhas Solicitações de Desenvolvimento/ })).toBeInTheDocument()
    expect(screen.getByText("Cliente A")).toBeInTheDocument()
    expect(screen.getByText("Cliente B")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Nova Solicitação" })).toHaveAttribute("href", "/comercial/solicitacoes/nova")
  })

  it("mostra o estado vazio quando não há solicitações", async () => {
    const fetchMock = createFetchMock(() => ({ json: [] }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ListaSolicitacoesPage />)

    expect(await screen.findByText("Nenhuma solicitacao encontrada")).toBeInTheDocument()
  })

  it("filtra a lista pela busca", async () => {
    const fetchMock = makeMock()
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ListaSolicitacoesPage />)
    await screen.findByText("Cliente A")

    fireEvent.change(screen.getByPlaceholderText("Buscar por cliente, produto, tipo, criado por..."), {
      target: { value: "cliente a" },
    })

    expect(screen.getByText("Cliente A")).toBeInTheDocument()
    expect(screen.queryByText("Cliente B")).not.toBeInTheDocument()
  })

  it("exclui uma solicitação através do modal de confirmação", async () => {
    const fetchMock = makeMock()
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ListaSolicitacoesPage />)
    await screen.findByText("Cliente A")

    const row = screen.getByText("Cliente A").closest("tr")!
    fireEvent.click(within(row).getByRole("button", { name: "Excluir" }))

    const dialog = screen.getByRole("dialog", { name: "Excluir solicitação?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/solicitacoes/1", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Solicitação excluída com sucesso"))
  })
})
