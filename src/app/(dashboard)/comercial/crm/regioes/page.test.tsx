// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import RegioesPage from "./page"
import { createFetchMock, renderPage, findCall, navMock } from "@/test/harness"

const regioes = [
  { id: 1, nome: "Sudeste", uf: "SE", gerenteId: 2, gerenteNome: "Maria", ativo: true },
  { id: 2, nome: "Nordeste", uf: null, gerenteId: null, gerenteNome: null, ativo: false },
]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/crm/regioes") return { json: regioes }
    if (method === "GET" && url === "/api/usuarios/ativos") return { json: [{ id: 2, name: "Maria" }] }
    if (method === "POST" && url === "/api/crm/regioes") return { json: { id: 3 }, status: 201 }
    if (method === "PUT" && url === "/api/crm/regioes/1") return { json: {} }
    if (method === "DELETE" && url === "/api/crm/regioes/1") return { json: { success: true } }
    return { json: null }
  }
}

function render() {
  navMock.setPathname("/comercial/crm/regioes")
  const mock = createFetchMock(buildHandler())
  vi.stubGlobal("fetch", mock.fn)
  return { ...renderPage(<RegioesPage />), mock }
}

describe("RegioesPage", () => {
  it("renderiza a lista de regiões", async () => {
    const { container, mock } = render()

    expect(await screen.findByRole("heading", { name: "Regiões" })).toBeInTheDocument()
    await screen.findByText("Sudeste")
    expect(screen.getByText("Sudeste — Maria")).toBeInTheDocument()
    expect(screen.getByText("Nordeste")).toBeInTheDocument()
    expect(screen.getByText("Sem gerente")).toBeInTheDocument()
    expect(screen.getByText("Inativo")).toBeInTheDocument()
    expect(screen.getByText("2 região(ões)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Nova Região" })).toBeInTheDocument()
    expect(container.querySelectorAll("svg.lucide-trash-2").length).toBe(2)
    expect(findCall(mock.calls, "/api/crm/regioes", "GET")).toBeDefined()
    expect(findCall(mock.calls, "/api/usuarios/ativos", "GET")).toBeDefined()
  })

  it("filtra regiões pela busca", async () => {
    const { mock } = render()
    await screen.findByText("Sudeste")

    fireEvent.change(screen.getByPlaceholderText("Buscar região..."), { target: { value: "Nordeste" } })

    expect(screen.getByText("Nordeste")).toBeInTheDocument()
    expect(screen.queryByText("Sudeste")).not.toBeInTheDocument()
    expect(screen.getByText("1 região(ões)")).toBeInTheDocument()
    expect(mock).toBeDefined()
  })

  it("cria uma nova região via POST", async () => {
    const { mock } = render()
    await screen.findByText("Sudeste")

    fireEvent.click(screen.getByRole("button", { name: "Nova Região" }))
    await screen.findByRole("heading", { name: "Nova Região" })

    fireEvent.change(screen.getByPlaceholderText("Ex: Sudeste"), { target: { value: "Centro-Oeste" } })
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "CO" } })
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "2" } })

    fireEvent.click(screen.getByRole("button", { name: "Criar" }))

    await waitFor(() => {
      const call = findCall(mock.calls, "/api/crm/regioes", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ nome: "Centro-Oeste", uf: "CO", gerenteId: 2 })
    })
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Nova Região" })).not.toBeInTheDocument()
    )
  })

  it("edita uma região via PUT", async () => {
    const { container, mock } = render()
    await screen.findByText("Sudeste")

    fireEvent.click(container.querySelector("svg.lucide-pencil")!.closest("button")!)
    await screen.findByRole("heading", { name: "Editar Região" })

    const nomeInput = screen.getByPlaceholderText("Ex: Sudeste")
    expect((nomeInput as HTMLInputElement).value).toBe("Sudeste")
    fireEvent.change(nomeInput, { target: { value: "Sudeste Ampliada" } })

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(mock.calls, "/api/crm/regioes/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ nome: "Sudeste Ampliada", uf: "SE", gerenteId: 2 })
    })
  })

  it("exclui uma região via DELETE", async () => {
    const { container, mock } = render()
    await screen.findByText("Sudeste")

    fireEvent.click(container.querySelectorAll("svg.lucide-trash-2")[0].closest("button")!)

    await waitFor(() => expect(findCall(mock.calls, "/api/crm/regioes/1", "DELETE")).toBeDefined())
  })

  it("mostra estado vazio quando não há regiões", async () => {
    navMock.setPathname("/comercial/crm/regioes")
    const mock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/regioes") return { json: [] }
      return { json: null }
    })
    vi.stubGlobal("fetch", mock.fn)
    renderPage(<RegioesPage />)

    expect(await screen.findByText("Nenhuma região cadastrada")).toBeInTheDocument()
  })
})
