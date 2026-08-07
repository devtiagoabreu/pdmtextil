// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import EmpresaPage from "./page"
import { createFetchMock, findCall, renderPage, toastMock } from "@/test/harness"

const empresas = [
  { id: 1, nome: "PDM Têxtil Ltda", documento: "12.345.678/0001-90", endereco: "Rua A", cidade: "São Paulo", uf: "SP", telefone: "", email: "", logoUrl: "", isDefault: true },
]

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/config/empresa") return { json: empresas }
    if (method === "GET" && url === "/api/crm/estados") return { json: [] }
    if (method === "POST" && url === "/api/admin/config/empresa") return { status: 201, json: { id: 2, nome: "Nova Empresa SA" } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("EmpresaPage", () => {
  it("renderiza heading e lista de empresas", async () => {
    setup()
    renderPage(<EmpresaPage />)

    expect(await screen.findByRole("heading", { name: "Empresas" })).toBeInTheDocument()
    expect(screen.getByText("PDM Têxtil Ltda")).toBeInTheDocument()
    expect(screen.getByText("CNPJ: 12.345.678/0001-90")).toBeInTheDocument()
    expect(screen.getByText("Padrão")).toBeInTheDocument()
  })

  it("mostra estado vazio quando não há empresas", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/config/empresa") return { json: [] }
      if (method === "GET" && url === "/api/crm/estados") return { json: [] }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<EmpresaPage />)

    expect(await screen.findByText("Nenhuma empresa cadastrada")).toBeInTheDocument()
  })

  it("adiciona empresa via POST", async () => {
    const fetchMock = setup()
    renderPage(<EmpresaPage />)
    await screen.findByText("PDM Têxtil Ltda")

    fireEvent.click(screen.getByRole("button", { name: "Nova Empresa" }))
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "Nova Empresa SA" } })
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/config/empresa", "POST")
      expect(call).toBeDefined()
      expect(call?.body?.nome).toBe("Nova Empresa SA")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Empresa adicionada!"))
  })
})
