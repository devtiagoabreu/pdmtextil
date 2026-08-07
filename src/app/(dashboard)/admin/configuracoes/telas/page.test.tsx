// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import AdminTelasPage from "./page"
import { createFetchMock, renderPage } from "@/test/harness"

const menus = [
  { id: 1, titulo: "Cadastros", icone: null, ordem: 1, itens: [{ id: 11, titulo: "Clientes", url: "/cadastros/clientes", ordem: 1 }] },
]

const telas = [{ id: "clientes", label: "Clientes", href: "/cadastros/clientes", module: "cadastros" }]

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/roles") return { json: [] }
    if (method === "GET" && url === "/api/admin/menus?role=DEFAULT") return { json: menus }
    if (method === "GET" && url === "/api/admin/pagina-inicial?role=DEFAULT") return { json: { paginaInicial: "" } }
    if (method === "GET" && url === "/api/user/menus/todas-telas") return { json: telas }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("AdminTelasPage", () => {
  it("renderiza o heading e os menus do perfil", async () => {
    setup()
    renderPage(<AdminTelasPage />)

    expect(await screen.findByRole("heading", { name: "Configuração de Telas" }, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText("Cadastros")).toBeInTheDocument()

    const card = screen.getByText("Cadastros").closest(".overflow-hidden")!
    fireEvent.click(card.querySelector("button")!)

    expect(await screen.findByText("Clientes", {}, { timeout: 5000 })).toBeInTheDocument()
    expect(screen.getByText("/cadastros/clientes")).toBeInTheDocument()
  })

  it("mostra estado vazio de menus", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/roles") return { json: [] }
      if (method === "GET" && url === "/api/admin/menus?role=DEFAULT") return { json: [] }
      if (method === "GET" && url === "/api/admin/pagina-inicial?role=DEFAULT") return { json: { paginaInicial: "" } }
      if (method === "GET" && url === "/api/user/menus/todas-telas") return { json: [] }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<AdminTelasPage />)

    expect(await screen.findByText(/Nenhum menu configurado/, {}, { timeout: 5000 })).toBeInTheDocument()
  })
})
