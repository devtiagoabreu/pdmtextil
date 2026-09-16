// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import AtivosAtivosPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

const ATIVOS_MOCK = [
  {
    id: 1,
    codigo: "EXT-001",
    nome: "Extintor Galpão A",
    categoriaNome: "Segurança Contra Incêndio",
    localizacao: "Galpão A",
    status: "ATIVO",
    maquinaNome: null,
    responsavelNome: "João",
    ativo: true,
  },
  {
    id: 2,
    codigo: "EXT-002",
    nome: "Extintor Galpão B",
    categoriaNome: null,
    localizacao: null,
    status: "MANUTENCAO",
    maquinaNome: null,
    responsavelNome: null,
    ativo: true,
  },
]

function mountPage(data: unknown[] = ATIVOS_MOCK) {
  navMock.setPathname("/ativos/ativos")
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/ativos/ativos") return { json: data }
    if (method === "DELETE" && url === "/api/ativos/ativos/2") {
      return { status: 400, json: { error: "fk", fkError: true } }
    }
    if (method === "DELETE") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("AtivosAtivosPage", () => {
  beforeEach(() => {
    navMock.reset()
    toastMock.success.mockClear()
  })

  it("renderiza a lista com ativos e status", async () => {
    mountPage()
    renderPage(<AtivosAtivosPage />)

    expect(screen.getByRole("heading", { name: "Ativos" })).toBeInTheDocument()
    expect(await screen.findByText("EXT-001")).toBeInTheDocument()
    expect(screen.getByText("Extintor Galpão A")).toBeInTheDocument()
    expect(screen.getByText("Ativo")).toBeInTheDocument()
    expect(screen.getByText("Manutenção")).toBeInTheDocument()
    expect(screen.getByText("João")).toBeInTheDocument()
  })

  it("filtra pela busca", async () => {
    mountPage()
    renderPage(<AtivosAtivosPage />)
    await screen.findByText("EXT-001")

    const search = screen.getByPlaceholderText(
      "Buscar por código, nome, categoria ou localização..."
    )
    fireEvent.change(search, { target: { value: "EXT-001" } })
    expect(screen.getByText("EXT-001")).toBeInTheDocument()
    expect(screen.queryByText("EXT-002")).not.toBeInTheDocument()

    fireEvent.change(search, { target: { value: "zzz-inexistente" } })
    expect(screen.getByText("Nenhum ativo encontrado")).toBeInTheDocument()
  })

  it("mostra estado vazio quando a API retorna vazio", async () => {
    mountPage([])
    renderPage(<AtivosAtivosPage />)

    expect(await screen.findByText("Nenhum ativo encontrado")).toBeInTheDocument()
  })

  it("exclui um registro após confirmar no modal", async () => {
    const fetchMock = mountPage()
    renderPage(<AtivosAtivosPage />)
    await screen.findByText("EXT-001")

    const row = screen.getByText("EXT-001").closest("tr")!
    const trash = within(row)
      .getAllByRole("button")
      .find((b) => !b.closest("a"))!
    fireEvent.click(trash)

    const dialog = screen.getByRole("dialog", { name: "Excluir ativo?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() =>
      expect(findCall(fetchMock.calls, "/api/ativos/ativos/1", "DELETE")).toBeDefined()
    )
    await waitFor(() =>
      expect(toastMock.success).toHaveBeenCalledWith("Ativo excluído com sucesso")
    )
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("bloqueia exclusão quando há vínculos (fkError)", async () => {
    const fetchMock = mountPage()
    renderPage(<AtivosAtivosPage />)
    await screen.findByText("EXT-002")

    const row = screen.getByText("EXT-002").closest("tr")!
    const trash = within(row)
      .getAllByRole("button")
      .find((b) => !b.closest("a"))!
    fireEvent.click(trash)

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }))
    await waitFor(() =>
      expect(findCall(fetchMock.calls, "/api/ativos/ativos/2", "DELETE")).toBeDefined()
    )
    const blockedDialog = await screen.findByRole("dialog", { name: "Exclusão não permitida" })
    expect(blockedDialog).toHaveTextContent(/não pode ser exclu/)

    fireEvent.click(within(blockedDialog).getByRole("button", { name: "OK" }))
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("contém links de novo e edição", async () => {
    mountPage()
    renderPage(<AtivosAtivosPage />)
    await screen.findByText("EXT-001")

    expect(screen.getByRole("link", { name: "Novo Ativo" })).toHaveAttribute(
      "href",
      "/ativos/ativos/novo"
    )
    expect(screen.getByText("Extintor Galpão A").closest("a")).toHaveAttribute(
      "href",
      "/ativos/ativos/1"
    )
  })
})
