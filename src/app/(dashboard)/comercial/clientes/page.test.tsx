// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import ClientesPage from "./page"
import { listSmokeSpec } from "@/test/list-smoke-spec"
import { createFetchMock, renderPage, findCall, toastMock } from "@/test/harness"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { role: "ADMIN" } } }),
}))

const dados = [
  {
    id: 1,
    nome: "Tecidos Silva",
    cnpj: "11.222.333/0001-44",
    razaoSocial: "Tecidos Silva Ltda",
    email: "contato@tecidos.com",
    telefone: "(11) 4000-0000",
    cidade: "São Paulo",
    uf: "SP",
  },
  {
    id: 2,
    nome: "Química Alfa",
    cnpj: "55.666.777/0001-88",
    razaoSocial: "Química Alfa S/A",
    email: "vendas@quimicaalfa.com",
    telefone: "(11) 5555-9999",
    cidade: "Campinas",
    uf: "SP",
  },
]

listSmokeSpec({
  title: "ClientesComercialPage",
  component: <ClientesPage />,
  apiUrl: "/api/clientes",
  heading: "Clientes",
  emptyText: "Nenhum cliente encontrado",
  searchPlaceholder: "Buscar por nome, CNPJ, razão social, contato, email, telefone ou cidade...",
  newLinkText: "Novo Cliente",
  newHref: "/comercial/clientes/novo",
  editHref: (item) => `/comercial/clientes/${item.id}`,
  editLinkText: "Editar",
  primaryField: "nome",
  data: dados,
  firstItemText: "Tecidos Silva",
  secondItemText: "Química Alfa",
  matchQuery: "silva",
})

describe("ClientesComercialPage - excluir", () => {
  beforeEach(() => {
    toastMock.success.mockClear()
    toastMock.error.mockClear()
  })

  it("exclui um cliente via modal de confirmação", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/clientes") return { json: dados }
      if (method === "DELETE" && url === "/api/clientes/1") return { json: { success: true } }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ClientesPage />)
    await screen.findByText("Tecidos Silva")

    const excluir = screen.getAllByRole("button").find((b) => b.textContent?.includes("Excluir"))
    expect(excluir).toBeTruthy()
    fireEvent.click(excluir!)

    const dialog = await screen.findByRole("dialog", { name: "Excluir cliente?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => {
      expect(findCall(fetchMock.calls, "/api/clientes/1", "DELETE")).toBeTruthy()
    })
    expect(toastMock.success).toHaveBeenCalledWith("Cliente excluído com sucesso")
    await waitFor(() => {
      expect(screen.queryByText("Tecidos Silva")).not.toBeInTheDocument()
    })
    expect(screen.getByText("Química Alfa")).toBeInTheDocument()
  })

  it("mostra toast de erro quando a exclusão falha", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/clientes") return { json: dados }
      if (method === "DELETE" && url === "/api/clientes/1") return { status: 500, json: { error: "Erro interno do servidor" } }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<ClientesPage />)
    await screen.findByText("Tecidos Silva")

    const excluir = screen.getAllByRole("button").find((b) => b.textContent?.includes("Excluir"))
    fireEvent.click(excluir!)

    const dialog = await screen.findByRole("dialog", { name: "Excluir cliente?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => {
      expect(toastMock.error).toHaveBeenCalledWith("Erro interno do servidor")
    })
    expect(screen.getByText("Tecidos Silva")).toBeInTheDocument()
  })
})
