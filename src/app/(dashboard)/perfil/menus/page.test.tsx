// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, within, waitFor } from "@testing-library/react"
import ConfigurarMenusPage from "./page"
import { createFetchMock, findCall, navMock, renderPage, toastMock } from "@/test/harness"

const menus = [
  {
    id: 1,
    titulo: "Comercial",
    icone: "briefcase",
    ordem: 0,
    itens: [
      { id: 10, titulo: "Clientes", url: "/comercial/clientes", ordem: 0 },
      { id: 11, titulo: "Representantes", url: "/comercial/representantes", ordem: 1 },
    ],
  },
]

const telas = [
  { id: "clientes", label: "Clientes", href: "/comercial/clientes", module: "comercial" },
]

function handler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/user/menus") return { json: menus }
    if (method === "GET" && url === "/api/user/menus/todas-telas") return { json: telas }
    if (method === "GET" && url === "/api/user/pagina-inicial") {
      return { json: { paginaInicial: "/dashboard" } }
    }
    if (method === "POST" && url === "/api/user/menus") {
      return { json: { id: 2, titulo: "Financeiro", icone: "wallet", ordem: 1 } }
    }
    return { json: null }
  }
}

describe("ConfigurarMenusPage", () => {
  beforeEach(() => {
    navMock.reset()
    navMock.setPathname("/perfil/menus")
  })

  it("renderiza o heading e os menus do usuário", async () => {
    vi.stubGlobal("fetch", createFetchMock(handler()).fn)
    renderPage(<ConfigurarMenusPage />)

    expect(await screen.findByRole("heading", { name: "Menu de Navegação" })).toBeInTheDocument()
    expect(await screen.findByText("Comercial")).toBeInTheDocument()
    expect(screen.getByText("2 item(ns)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Novo Menu" })).toBeInTheDocument()
  })

  it("mostra estado vazio quando não há menus", async () => {
    const empty = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/user/menus") return { json: [] }
      if (method === "GET" && url === "/api/user/menus/todas-telas") return { json: telas }
      if (method === "GET" && url === "/api/user/pagina-inicial") {
        return { json: { paginaInicial: "/dashboard" } }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", empty.fn)
    renderPage(<ConfigurarMenusPage />)

    expect(await screen.findByText(/Nenhum menu criado\./)).toBeInTheDocument()
  })

  it("cria um menu via dialog", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ConfigurarMenusPage />)

    await screen.findByText("Comercial")
    fireEvent.click(screen.getByRole("button", { name: "Novo Menu" }))

    const dialog = screen.getByRole("dialog", { name: "Novo Menu" })
    fireEvent.change(within(dialog).getByPlaceholderText("Ex: Comercial"), {
      target: { value: "Financeiro" },
    })
    fireEvent.click(within(dialog).getByRole("button", { name: "Criar" }))

    expect(await screen.findByText("Financeiro")).toBeInTheDocument()
    const call = findCall(fetchMock.calls, "/api/user/menus", "POST")
    expect(call?.body).toEqual({ titulo: "Financeiro", ordem: 1 })
    expect(toastMock.success).toHaveBeenCalledWith("Menu criado")
  })

  it("exclui um item via modal de confirmação", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ConfigurarMenusPage />)

    await screen.findByText("Comercial")
    fireEvent.click(screen.getByRole("button", { name: "Expandir Comercial" }))
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Excluir item Clientes" })).toBeInTheDocument()
    )

    fireEvent.click(screen.getByRole("button", { name: "Excluir item Clientes" }))

    const modal = screen.getByRole("dialog", { name: "Excluir item?" })
    expect(within(modal).getByText("Excluir este item?")).toBeInTheDocument()
    fireEvent.click(within(modal).getByRole("button", { name: "Excluir" }))

    await waitFor(() => {
      expect(findCall(fetchMock.calls, "/api/user/menus/1/itens/10", "DELETE")).toBeDefined()
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Item excluído"))
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Excluir item Clientes" })).not.toBeInTheDocument()
      expect(screen.getByRole("button", { name: "Excluir item Representantes" })).toBeInTheDocument()
    })
    expect(screen.getByText("1 item(ns)")).toBeInTheDocument()
  })

  it("exclui um menu via modal de confirmação", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ConfigurarMenusPage />)

    await screen.findByText("Comercial")
    fireEvent.click(screen.getByRole("button", { name: "Excluir menu Comercial" }))

    const modal = screen.getByRole("dialog", { name: "Excluir menu?" })
    expect(within(modal).getByText("Excluir este menu e todos os seus itens?")).toBeInTheDocument()
    fireEvent.click(within(modal).getByRole("button", { name: "Excluir" }))

    await waitFor(() => {
      expect(findCall(fetchMock.calls, "/api/user/menus/1", "DELETE")).toBeDefined()
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Menu excluído"))
  })
})
