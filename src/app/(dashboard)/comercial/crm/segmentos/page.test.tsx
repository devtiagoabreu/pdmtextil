// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import SegmentosPage from "./page"
import { createFetchMock, renderPage, findCall, navMock } from "@/test/harness"

const segmentos = [
  { id: 1, nome: "Tecelagem", ativo: true },
  { id: 2, nome: "Confecção", ativo: false },
]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/crm/segmentos") return { json: segmentos }
    if (method === "POST" && url === "/api/crm/segmentos") return { json: { id: 3 }, status: 201 }
    if (method === "PUT" && url === "/api/crm/segmentos/1") return { json: {} }
    if (method === "DELETE" && url === "/api/crm/segmentos/1") return { json: { success: true } }
    return { json: null }
  }
}

function render() {
  navMock.setPathname("/comercial/crm/segmentos")
  const mock = createFetchMock(buildHandler())
  vi.stubGlobal("fetch", mock.fn)
  return { ...renderPage(<SegmentosPage />), mock }
}

describe("SegmentosPage", () => {
  it("renderiza a lista de segmentos", async () => {
    const { container, mock } = render()

    expect(await screen.findByRole("heading", { name: "Segmentos" })).toBeInTheDocument()
    await screen.findByText("Tecelagem")
    expect(screen.getByText("Confecção")).toBeInTheDocument()
    expect(screen.getByText("Ativo")).toBeInTheDocument()
    expect(screen.getByText("Inativo")).toBeInTheDocument()
    expect(screen.getByText("2 segmento(s)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Novo Segmento" })).toBeInTheDocument()
    expect(container.querySelectorAll("svg.lucide-trash-2").length).toBe(2)
    expect(findCall(mock.calls, "/api/crm/segmentos", "GET")).toBeDefined()
  })

  it("filtra segmentos pela busca", async () => {
    render()
    await screen.findByText("Tecelagem")

    fireEvent.change(screen.getByPlaceholderText("Buscar segmento..."), { target: { value: "Confecção" } })

    expect(screen.getByText("Confecção")).toBeInTheDocument()
    expect(screen.queryByText("Tecelagem")).not.toBeInTheDocument()
    expect(screen.getByText("1 segmento(s)")).toBeInTheDocument()
  })

  it("cria um novo segmento via POST", async () => {
    const { mock } = render()
    await screen.findByText("Tecelagem")

    fireEvent.click(screen.getByRole("button", { name: "Novo Segmento" }))
    await screen.findByRole("heading", { name: "Novo Segmento" })

    fireEvent.change(screen.getByPlaceholderText("Ex: Tecelagem"), { target: { value: "Estamparia" } })

    fireEvent.click(screen.getByRole("button", { name: "Criar" }))

    await waitFor(() => {
      const call = findCall(mock.calls, "/api/crm/segmentos", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ nome: "Estamparia" })
    })
    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Novo Segmento" })).not.toBeInTheDocument()
    )
  })

  it("edita um segmento via PUT", async () => {
    const { container, mock } = render()
    await screen.findByText("Tecelagem")

    fireEvent.click(container.querySelector("svg.lucide-pencil")!.closest("button")!)
    await screen.findByRole("heading", { name: "Editar Segmento" })

    const nomeInput = screen.getByPlaceholderText("Ex: Tecelagem")
    expect((nomeInput as HTMLInputElement).value).toBe("Tecelagem")
    fireEvent.change(nomeInput, { target: { value: "Tecelagem Premium" } })

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(mock.calls, "/api/crm/segmentos/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ nome: "Tecelagem Premium" })
    })
  })

  it("exclui um segmento via DELETE", async () => {
    const { container, mock } = render()
    await screen.findByText("Tecelagem")

    fireEvent.click(container.querySelectorAll("svg.lucide-trash-2")[0].closest("button")!)

    await waitFor(() => expect(findCall(mock.calls, "/api/crm/segmentos/1", "DELETE")).toBeDefined())
  })

  it("mostra estado vazio quando não há segmentos", async () => {
    navMock.setPathname("/comercial/crm/segmentos")
    const mock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/segmentos") return { json: [] }
      return { json: null }
    })
    vi.stubGlobal("fetch", mock.fn)
    renderPage(<SegmentosPage />)

    expect(await screen.findByText("Nenhum segmento cadastrado")).toBeInTheDocument()
  })
})
