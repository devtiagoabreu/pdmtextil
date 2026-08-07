// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen } from "@testing-library/react"
import ConfigurarMenusPage from "./page"
import { createFetchMock, navMock, renderPage } from "@/test/harness"

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
})
