// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import BancoDadosPage from "./page"
import { createFetchMock, findCall, renderPage, toastMock } from "@/test/harness"

const bancos = [
  { id: 1, nome: "Produção Neon", connectionString: "postgresql://user:pass@host:5432/pdm", ativo: true },
]

function setup() {
  const fetchMock = createFetchMock(({ method, url }) => {
    if (method === "GET" && url === "/api/admin/config/banco-dados") return { json: bancos }
    if (method === "POST" && url === "/api/admin/config/banco-dados") return { status: 201, json: { id: 2, nome: "Backup", connectionString: "postgresql://..." } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
  vi.stubGlobal("fetch", fetchMock.fn)
  return fetchMock
}

describe("BancoDadosPage", () => {
  it("renderiza heading, conexões e card de backup", async () => {
    setup()
    renderPage(<BancoDadosPage />)

    expect(await screen.findByRole("heading", { name: "Banco de Dados" })).toBeInTheDocument()
    expect(screen.getByText("Produção Neon")).toBeInTheDocument()
    expect(screen.getByText("postgresql://user:pass@host:5432/pdm")).toBeInTheDocument()
    expect(screen.getByText("Backup do Banco de Dados")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Download Backup/ })).toBeInTheDocument()
  })

  it("mostra estado vazio quando não há conexões", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/config/banco-dados") return { json: [] }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<BancoDadosPage />)

    expect(await screen.findByText("Nenhuma conexão cadastrada")).toBeInTheDocument()
  })

  it("adiciona conexão via POST", async () => {
    const fetchMock = setup()
    renderPage(<BancoDadosPage />)
    await screen.findByText("Produção Neon")

    fireEvent.click(screen.getByRole("button", { name: "Nova Conexão" }))
    fireEvent.change(screen.getByPlaceholderText("Ex: Produção Neon"), { target: { value: "Ibirapuera" } })
    fireEvent.change(screen.getByPlaceholderText("postgresql://user:pass@host:5432/postgres"), { target: { value: "postgresql://outro" } })
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/admin/config/banco-dados", "POST")
      expect(call).toBeDefined()
      expect(call?.body?.nome).toBe("Ibirapuera")
      expect(call?.body?.connectionString).toBe("postgresql://outro")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Conexão adicionada!"))
  })
})
