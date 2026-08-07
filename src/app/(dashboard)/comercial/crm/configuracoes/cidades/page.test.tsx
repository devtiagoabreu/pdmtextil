// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import CidadesPage from "./page"
import { createFetchMock, renderPage } from "@/test/harness"
import { listSmokeSpec } from "@/test/list-smoke-spec"

const cidades = [
  { id: 1, nome: "Campinas", estadoId: 1, uf: "SP", estadoNome: "São Paulo" },
  { id: 2, nome: "Uberlândia", estadoId: 2, uf: "MG", estadoNome: "Minas Gerais" },
]

const estados = [
  { id: 1, nome: "São Paulo", uf: "SP", regiao: "SE" },
  { id: 2, nome: "Minas Gerais", uf: "MG", regiao: "SE" },
]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/crm/cidades") return { json: cidades }
    if (method === "GET" && url === "/api/crm/estados") return { json: estados }
    return { status: 404, json: { error: "Rota não mockada" } }
  }
}

listSmokeSpec({
  title: "CidadesConfigPage",
  component: <CidadesPage />,
  apiUrl: "/api/crm/cidades",
  heading: "Cidades",
  emptyText: "Nenhuma cidade cadastrada",
  searchPlaceholder: "Buscar cidade ou estado...",
  primaryField: "nome",
  data: cidades,
  firstItemText: "Campinas",
  secondItemText: "Uberlândia",
  handler: buildHandler(),
})

describe("CidadesConfigPage busca e filtro", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", createFetchMock(buildHandler()).fn)
  })

  it("filtra cidades pela busca", async () => {
    renderPage(<CidadesPage />)
    await screen.findByText("Campinas")

    fireEvent.change(screen.getByPlaceholderText("Buscar cidade ou estado..."), { target: { value: "Uberlândia" } })

    expect(screen.getByText("Uberlândia")).toBeInTheDocument()
    expect(screen.queryByText("Campinas")).not.toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("Buscar cidade ou estado..."), { target: { value: "zzz" } })

    expect(screen.getByText("Nenhuma cidade encontrada")).toBeInTheDocument()
  })

  it("filtra cidades pela UF", async () => {
    renderPage(<CidadesPage />)
    await screen.findByText("Campinas")

    fireEvent.change(screen.getByRole("combobox"), { target: { value: "MG" } })

    expect(screen.getByText("Uberlândia")).toBeInTheDocument()
    expect(screen.queryByText("Campinas")).not.toBeInTheDocument()
    expect(screen.getByText("1 cidade(s)")).toBeInTheDocument()
  })
})
