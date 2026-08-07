// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import EquipesPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { role: "ADMIN" } } }),
}))

const equipes = [
  {
    id: 1,
    nome: "Equipe Premium",
    regiaoId: 1,
    regiaoNome: "São Paulo",
    responsavelId: 2,
    responsavelNome: "Tiago",
    ativo: true,
    membrosCount: 2,
  },
  {
    id: 2,
    nome: "Equipe Interior",
    regiaoId: null,
    regiaoNome: null,
    responsavelId: null,
    responsavelNome: null,
    ativo: false,
    membrosCount: 0,
  },
]

const membros = [
  {
    id: 5,
    equipeId: 1,
    representanteId: 3,
    nome: "Tecidos Silva",
    cnpj: "12.345.678/0001-99",
    cidade: "São Paulo",
    uf: "SP",
    email: "contato@tecidos.com.br",
    telefone: "(11) 99999-0000",
  },
]

function buildHandler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/crm/equipes") return { json: equipes }
    if (method === "GET" && url === "/api/crm/regioes") return { json: [{ id: 1, nome: "São Paulo", uf: "SP", ativo: true }] }
    if (method === "GET" && url === "/api/usuarios/ativos") return { json: [{ id: 2, name: "Tiago" }] }
    if (method === "GET" && url === "/api/crm/equipes/1/membros") return { json: membros }
    if (method === "GET" && url.startsWith("/api/representantes?q=")) {
      return { json: [{ id: 9, nome: "Malharia Tupiniquim", cnpj: "98.765.432/0001-10", cidade: "São Paulo", uf: "SP" }] }
    }
    if (method === "POST" && url === "/api/crm/equipes") return { json: { id: 3 }, status: 201 }
    if (method === "POST" && url === "/api/crm/equipes/1/membros") return { json: { id: 99 }, status: 201 }
    if (method === "PUT" && url === "/api/crm/equipes/1") return { json: {} }
    if (method === "DELETE" && url === "/api/crm/equipes/1") return { json: { success: true } }
    if (method === "DELETE" && url === "/api/crm/equipes/1/membros?membroId=5") return { json: { success: true } }
    return { json: null }
  }
}

describe("EquipesPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>
  let container: HTMLElement

  beforeEach(() => {
    fetchMock = createFetchMock(buildHandler())
    vi.stubGlobal("fetch", fetchMock.fn)
    navMock.setPathname("/comercial/crm/equipes")
    container = renderPage(<EquipesPage />).container
  })

  it("renderiza a lista de equipes com dados", async () => {
    expect(await screen.findByRole("heading", { name: "Equipes" })).toBeInTheDocument()
    expect(screen.getByText("Equipe Premium")).toBeInTheDocument()
    expect(screen.getByText("São Paulo — Tiago")).toBeInTheDocument()
    expect(screen.getByText("Equipe Interior")).toBeInTheDocument()
    expect(screen.getByText("Sem responsável")).toBeInTheDocument()
    expect(screen.getByText("Inativo")).toBeInTheDocument()
    expect(screen.getByText("2 equipe(s)")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Nova Equipe" })).toBeInTheDocument()
  })

  it("filtra equipes pela busca", async () => {
    await screen.findByText("Equipe Premium")

    fireEvent.change(screen.getByPlaceholderText("Buscar equipe..."), { target: { value: "Interior" } })

    expect(screen.getByText("Equipe Interior")).toBeInTheDocument()
    expect(screen.queryByText("Equipe Premium")).not.toBeInTheDocument()
    expect(screen.getByText("1 equipe(s)")).toBeInTheDocument()
  })

  it("cria uma nova equipe via POST", async () => {
    await screen.findByText("Equipe Premium")

    fireEvent.click(screen.getByRole("button", { name: "Nova Equipe" }))
    await screen.findByRole("heading", { name: "Nova Equipe" })

    fireEvent.change(screen.getByPlaceholderText("Ex: Equipe Premium"), { target: { value: "Equipe Norte" } })
    await screen.findByRole("option", { name: "São Paulo (SP)" })
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "1" } })
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "2" } })

    fireEvent.click(screen.getByRole("button", { name: "Criar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/equipes", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ nome: "Equipe Norte", regiaoId: 1, responsavelId: 2 })
    })
    await waitFor(() => expect(screen.queryByRole("heading", { name: "Nova Equipe" })).not.toBeInTheDocument())
  })

  it("edita uma equipe via PUT", async () => {
    await screen.findByText("Equipe Premium")

    fireEvent.click(container.querySelector("svg.lucide-pencil")!.closest("button")!)
    await screen.findByRole("heading", { name: "Editar Equipe" })

    const nameInput = screen.getByPlaceholderText("Ex: Equipe Premium")
    expect((nameInput as HTMLInputElement).value).toBe("Equipe Premium")
    fireEvent.change(nameInput, { target: { value: "Equipe Premium Plus" } })

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/equipes/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ nome: "Equipe Premium Plus", regiaoId: 1, responsavelId: 2 })
    })
  })

  it("exclui uma equipe via DELETE", async () => {
    await screen.findByText("Equipe Premium")

    fireEvent.click(container.querySelectorAll("svg.lucide-trash-2")[0].closest("button")!)
    const dialog = await screen.findByRole("dialog", { name: "Excluir equipe?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/crm/equipes/1", "DELETE")).toBeDefined())
  })

  it("abre o detalhe da equipe e adiciona um representante", async () => {
    await screen.findByText("Equipe Premium")

    fireEvent.click(screen.getByText("Equipe Premium"))
    expect(await screen.findByRole("heading", { name: "Equipe Premium" })).toBeInTheDocument()
    expect(screen.getByText("Membros da Equipe (1)")).toBeInTheDocument()
    expect(screen.getByText("Tecidos Silva")).toBeInTheDocument()
    expect(screen.getByText("12.345.678/0001-99")).toBeInTheDocument()
    expect(screen.getByText("São Paulo/SP")).toBeInTheDocument()
    expect(screen.getByText("contato@tecidos.com.br")).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("Buscar representante por nome ou CNPJ..."), {
      target: { value: "Malharia" },
    })

    const result = await screen.findByRole("button", { name: /Malharia Tupiniquim/ })
    fireEvent.click(result)

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/equipes/1/membros", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ representanteId: 9 })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Representante adicionado à equipe"))
  })

  it("remove um representante da equipe", async () => {
    await screen.findByText("Equipe Premium")

    fireEvent.click(screen.getByText("Equipe Premium"))
    await screen.findByText("Tecidos Silva")

    const xBtn = screen.getAllByRole("button").at(-1)!
    fireEvent.click(xBtn)
    const dialog = await screen.findByRole("dialog", { name: "Remover membro da equipe" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Remover" }))

    await waitFor(() => expect(findCall(fetchMock.calls, "/api/crm/equipes/1/membros?membroId=5", "DELETE")).toBeDefined())
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Representante removido da equipe"))
  })

  it("volta para a lista de equipes a partir do detalhe", async () => {
    await screen.findByText("Equipe Premium")

    fireEvent.click(screen.getByText("Equipe Premium"))
    await screen.findByRole("heading", { name: "Equipe Premium" })

    fireEvent.click(screen.getByRole("button", { name: "Voltar para Equipes" }))

    expect(await screen.findByRole("heading", { name: "Equipes" })).toBeInTheDocument()
    expect(screen.getByText("Equipe Interior")).toBeInTheDocument()
  })
})











