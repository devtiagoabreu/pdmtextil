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
      if (method === "PUT" && url === `/api/clientes/${id}`) return { json: { ok: true } }
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
})
