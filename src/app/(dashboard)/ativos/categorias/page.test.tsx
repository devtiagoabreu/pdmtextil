// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import AtivosCategoriasPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

const CATEGORIAS_MOCK = [
  {
    id: 1,
    nome: "Segurança Contra Incêndio",
    setor: "SEGURANCA",
    descricao: "Extintores, mangueiras e sistemas de combate a incêndio",
    cor: "#dc2626",
    icone: null,
    ativo: true,
  },
  {
    id: 2,
    nome: "Compressores",
    setor: "MECANICA",
    descricao: null,
    cor: "#2563eb",
    icone: null,
    ativo: false,
  },
]

function mountPage(data: unknown[] = CATEGORIAS_MOCK) {
  navMock.setPathname("/ativos/categorias")
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/ativos/categorias") return { json: data }
    if (method === "DELETE" && url === "/api/ativos/categorias/2") {
      return { status: 400, json: { error: "fk", fkError: true } }
    }
    if (method === "DELETE") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("AtivosCategoriasPage", () => {
  beforeEach(() => {
    navMock.reset()
    toastMock.success.mockClear()
  })

  it("renderiza a lista com categorias e setores", async () => {
    mountPage()
    renderPage(<AtivosCategoriasPage />)

    expect(screen.getByRole("heading", { name: "Categorias de Ativos" })).toBeInTheDocument()
    expect(await screen.findByText("Segurança Contra Incêndio")).toBeInTheDocument()
    expect(screen.getByText("Compressores")).toBeInTheDocument()
    expect(screen.getByText("SEGURANCA")).toBeInTheDocument()
    expect(screen.getByText("MECANICA")).toBeInTheDocument()
  })

  it("filtra pela busca", async () => {
    mountPage()
    renderPage(<AtivosCategoriasPage />)
    await screen.findByText("Segurança Contra Incêndio")

    const search = screen.getByPlaceholderText("Buscar por nome ou setor...")
    fireEvent.change(search, { target: { value: "incêndio" } })
    expect(screen.getByText("Segurança Contra Incêndio")).toBeInTheDocument()
    expect(screen.queryByText("Compressores")).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: "zzz-inexistente" } })
    expect(screen.getByText("Nenhuma categoria encontrada")).toBeInTheDocument()
  })

  it("mostra estado vazio quando a API retorna vazio", async () => {
    mountPage([])
    renderPage(<AtivosCategoriasPage />)

    expect(await screen.findByText("Nenhuma categoria encontrada")).toBeInTheDocument()
  })

  it("exclui um registro após confirmar no modal", async () => {
    const fetchMock = mountPage()
    renderPage(<AtivosCategoriasPage />)
    await screen.findByText("Segurança Contra Incêndio")

    const row = screen.getByText("Segurança Contra Incêndio").closest("tr")!
    const trash = within(row).getAllByRole("button").find((b) => !b.closest("a"))!
    fireEvent.click(trash)

    const dialog = screen.getByRole("dialog", { name: "Excluir categoria?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() =>
      expect(findCall(fetchMock.calls, "/api/ativos/categorias/1", "DELETE")).toBeDefined(),
    )
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Categoria excluída com sucesso"))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("bloqueia exclusão quando há vínculos (fkError)", async () => {
    const fetchMock = mountPage()
    renderPage(<AtivosCategoriasPage />)
    await screen.findByText("Compressores")

    const row = screen.getByText("Compressores").closest("tr")!
    const trash = within(row).getAllByRole("button").find((b) => !b.closest("a"))!
    fireEvent.click(trash)

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }))
    await waitFor(() =>
      expect(findCall(fetchMock.calls, "/api/ativos/categorias/2", "DELETE")).toBeDefined(),
    )
    const blockedDialog = await screen.findByRole("dialog", { name: "Exclusão não permitida" })
    expect(blockedDialog).toHaveTextContent(/não pode ser exclu/)

    fireEvent.click(within(blockedDialog).getByRole("button", { name: "OK" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("contém links de novo e edição", async () => {
    mountPage()
    renderPage(<AtivosCategoriasPage />)
    await screen.findByText("Segurança Contra Incêndio")

    expect(screen.getByRole("link", { name: "Nova Categoria" })).toHaveAttribute("href", "/ativos/categorias/novo")
    expect(screen.getByText("Segurança Contra Incêndio").closest("a")).toHaveAttribute("href", "/ativos/categorias/1")
  })
})