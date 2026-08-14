// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"
import EditarClientePage from "./page"

describe("EditarClientePage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>
  const id = "5"

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === `/api/clientes/${id}`) {
        return {
          json: {
            id: 5,
            nome: "Tecidos Silva",
            cnpj: "11.222.333/0001-44",
            razaoSocial: "Tecidos Silva Ltda",
            email: "contato@tecidos.com",
            cidade: "São Paulo",
            uf: "SP",
            endereco: "Rua A, 100",
          },
        }
      }
      if (method === "GET" && url === `/api/clientes/${id}/representantes`) return { json: [] }
      if (method === "GET" && url === `/api/crm/contatos?clienteId=${id}`) {
        return { json: [{ id: 100, nome: "Ana Souza", email: "ana@tecidos.com", telefone: "(11) 99999-0001" }] }
      }
      if (method === "GET" && url === "/api/crm/contatos?orfao=true") {
        return { json: [{ id: 101, nome: "Carlos Lima", email: "carlos@exemplo.com" }] }
      }
      if (method === "POST" && url === "/api/crm/contatos") return { json: { id: 102, nome: "Novo Contato" } }
      if (method === "PUT" && url === "/api/crm/contatos/101") {
        return { json: { id: 101, nome: "Carlos Lima", email: "carlos@exemplo.com", clienteId: 5 } }
      }
      if (method === "PUT" && url === "/api/crm/contatos/100") {
        return { json: { id: 100, nome: "Ana Souza", email: "ana@tecidos.com", telefone: "(11) 99999-0001", clienteId: null } }
      }
      if (method === "PUT" && url === `/api/clientes/${id}`) return { json: { ok: true } }
      if (method === "DELETE" && url === `/api/clientes/${id}`) return { json: { success: true } }
      return { status: 404, json: { error: "Rota não mockada" } }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
    navMock.setPathname(`/comercial/clientes/${id}`)
    navMock.setParams({ id })
  })

  it("carrega os dados e salva via PUT", async () => {
    renderPage(<EditarClientePage params={Promise.resolve({ id })} />)

    await screen.findByRole("heading", { name: "Editar Cliente" })
    await screen.findByDisplayValue("Tecidos Silva")
    expect(screen.getByDisplayValue("11.222.333/0001-44")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, `/api/clientes/${id}`, "PUT")
      expect(call).toBeDefined()
      expect(call!.body.id).toBe(5)
      expect(call!.body.nome).toBe("Tecidos Silva")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Cliente atualizado com sucesso!"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/clientes")
  })

  it("exclui o cliente via modal de confirmação e redireciona", async () => {
    renderPage(<EditarClientePage params={Promise.resolve({ id })} />)

    await screen.findByDisplayValue("Tecidos Silva")

    fireEvent.click(screen.getByRole("button", { name: "Excluir Cliente" }))
    await screen.findByRole("dialog")
    expect(screen.getByText(/Tem certeza que deseja excluir/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Excluir" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, `/api/clientes/${id}`, "DELETE")
      expect(call).toBeDefined()
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Cliente excluído com sucesso!"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/clientes")
  })

  it("desvincula, vincula e adiciona contatos", async () => {
    renderPage(<EditarClientePage params={Promise.resolve({ id })} />)

    await screen.findByDisplayValue("Tecidos Silva")
    await screen.findByText("Ana Souza")
    await screen.findByRole("option", { name: /Carlos Lima/ })

    fireEvent.click(screen.getByTitle("Desvincular contato"))
    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/contatos/100", "PUT")
      expect(call).toBeDefined()
      expect(call!.body.clienteId).toBeNull()
      expect(call!.body.empresaId).toBeNull()
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Contato desvinculado do cliente"))

    fireEvent.change(screen.getByLabelText("Contatos sem vínculo"), { target: { value: "101" } })
    fireEvent.click(screen.getByRole("button", { name: "Vincular" }))
    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/contatos/101", "PUT")
      expect(call).toBeDefined()
      expect(call!.body.clienteId).toBe("5")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Contato vinculado ao cliente"))

    vi.spyOn(window, "prompt").mockReturnValue("Novo Contato")
    fireEvent.click(screen.getByRole("button", { name: "Adicionar contato" }))
    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/contatos", "POST")
      expect(call).toBeDefined()
      expect(call!.body.nome).toBe("Novo Contato")
      expect(call!.body.clienteId).toBe("5")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Contato adicionado e vinculado ao cliente"))
  })
})
