// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import ChamadosCategoriasPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

const CATEGORIAS_MOCK = [
  {
    id: 1,
    codigo: "INCIDENTE",
    nome: "Incidente",
    cor: "red",
    ativo: true,
    ordem: 10,
  },
  {
    id: 2,
    codigo: "MANUTENCAO_CORRETIVA",
    nome: "Manutenção corretiva",
    cor: "amber",
    ativo: false,
    ordem: 20,
  },
]

function mountPage(data: unknown[] = CATEGORIAS_MOCK) {
  navMock.setPathname("/chamados/categorias")
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/chamados/categorias") return { json: data }
    if (method === "DELETE" && url === "/api/chamados/categorias/1") {
      return { status: 400, json: { error: "fk", fkError: true } }
    }
    if (method === "DELETE") return { json: { success: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("ChamadosCategoriasPage", () => {
  beforeEach(() => {
    navMock.reset()
    toastMock.success.mockClear()
    toastMock.error.mockClear()
  })

  it("renderiza a lista com nome, código e situação", async () => {
    mountPage()
    renderPage(<ChamadosCategoriasPage />)

    expect(screen.getByRole("heading", { name: "Categorias de Chamado" })).toBeInTheDocument()
    expect(await screen.findByText("Incidente")).toBeInTheDocument()
    expect(screen.getByText("INCIDENTE")).toBeInTheDocument()
    expect(screen.getByText("Manutenção corretiva")).toBeInTheDocument()
    expect(screen.getByText("Ativa")).toBeInTheDocument()
    expect(screen.getByText("Inativa")).toBeInTheDocument()
  })

  it("filtra pela busca por nome ou código", async () => {
    mountPage()
    renderPage(<ChamadosCategoriasPage />)
    await screen.findByText("Incidente")

    const search = screen.getByPlaceholderText("Buscar por nome ou código...")
    fireEvent.change(search, { target: { value: "corretiva" } })
    expect(screen.getByText("Manutenção corretiva")).toBeInTheDocument()
    expect(screen.queryByText("Incidente")).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: "zzz-inexistente" } })
    expect(screen.getByText("Nenhuma categoria encontrada")).toBeInTheDocument()
  })

  it("mostra estado vazio quando a API retorna vazio", async () => {
    mountPage([])
    renderPage(<ChamadosCategoriasPage />)

    expect(await screen.findByText("Nenhuma categoria encontrada")).toBeInTheDocument()
  })

  it("exclui um registro após confirmar no modal", async () => {
    const fetchMock = mountPage()
    renderPage(<ChamadosCategoriasPage />)
    await screen.findByText("Manutenção corretiva")

    const row = screen.getByText("Manutenção corretiva").closest("tr")!
    const trash = within(row)
      .getAllByRole("button")
      .find((b) => !b.closest("a"))!
    fireEvent.click(trash)

    const dialog = screen.getByRole("dialog", { name: "Excluir categoria?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() =>
      expect(findCall(fetchMock.calls, "/api/chamados/categorias/2", "DELETE")).toBeDefined()
    )
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Categoria excluída com sucesso")
    )
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("bloqueia exclusão quando há chamados vinculados (fkError)", async () => {
    const fetchMock = mountPage()
    renderPage(<ChamadosCategoriasPage />)
    await screen.findByText("Incidente")

    const row = screen.getByText("Incidente").closest("tr")!
    const trash = within(row)
      .getAllByRole("button")
      .find((b) => !b.closest("a"))!
    fireEvent.click(trash)

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }))
    await waitFor(() =>
      expect(findCall(fetchMock.calls, "/api/chamados/categorias/1", "DELETE")).toBeDefined()
    )
    const blockedDialog = await screen.findByRole("dialog", { name: "Exclusão não permitida" })

    fireEvent.click(within(blockedDialog).getByRole("button", { name: "OK" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("contém links de novo e edição", async () => {
    mountPage()
    renderPage(<ChamadosCategoriasPage />)
    await screen.findByText("Incidente")

    expect(screen.getByRole("link", { name: "Nova Categoria" })).toHaveAttribute(
      "href",
      "/chamados/categorias/novo"
    )
    expect(screen.getByText("Incidente").closest("a")).toHaveAttribute(
      "href",
      "/chamados/categorias/1"
    )
  })
})
