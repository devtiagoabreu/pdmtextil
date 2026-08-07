// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import EstadosPage from "./page"
import { createFetchMock, renderPage, findCall } from "@/test/harness"
import { listSmokeSpec } from "@/test/list-smoke-spec"

const estados = [
  { id: 1, nome: "São Paulo", uf: "SP", regiao: "SE", gerenteId: 2, gerenteNome: null, paisId: 1, paisNome: "Brasil" },
  { id: 2, nome: "Paraná", uf: "PR", regiao: "S", gerenteId: null, gerenteNome: null, paisId: null, paisNome: null },
]

const usuarios = [{ id: 2, name: "Tiago" }]

const paises = [{ id: 1, nome: "Brasil", codigo: "55" }]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/crm/estados") return { json: estados }
    if (method === "GET" && url === "/api/usuarios/ativos") return { json: usuarios }
    if (method === "GET" && url === "/api/crm/paises") return { json: paises }
    if (method === "PUT" && url === "/api/crm/estados/1") return { json: { ok: true } }
    return { status: 404, json: { error: "Rota não mockada" } }
  }
}

listSmokeSpec({
  title: "EstadosConfigPage",
  component: <EstadosPage />,
  apiUrl: "/api/crm/estados",
  heading: "Estados (UF)",
  emptyText: "Nenhum estado cadastrado",
  searchPlaceholder: "Buscar estado...",
  primaryField: "nome",
  data: estados,
  firstItemText: "São Paulo",
  secondItemText: "Paraná",
  handler: buildHandler(),
})

describe("EstadosConfigPage busca e edição inline", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    fetchMock = createFetchMock(buildHandler())
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("filtra estados pela busca", async () => {
    renderPage(<EstadosPage />)
    await screen.findByText("São Paulo")

    fireEvent.change(screen.getByPlaceholderText("Buscar estado..."), { target: { value: "Paraná" } })

    expect(screen.getByText("Paraná")).toBeInTheDocument()
    expect(screen.queryByText("São Paulo")).not.toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("Buscar estado..."), { target: { value: "zzz" } })

    expect(screen.getByText("Nenhum estado encontrado")).toBeInTheDocument()
  })

  it("edita um estado inline via PUT", async () => {
    const { container } = renderPage(<EstadosPage />)
    await screen.findByText("São Paulo")

    fireEvent.click(container.querySelector("svg.lucide-pencil")!.closest("button")!)

    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "S" } })

    fireEvent.click(container.querySelector("svg.lucide-check")!.closest("button")!)

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/estados/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ regiao: "S", gerenteId: 2, paisId: 1 })
    })
  })
})
