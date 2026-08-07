// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"
import EditarRepresentantePage from "./page"

const dados = {
  id: 5,
  nome: "Rep ABC",
  cnpj: "11.222.333/0001-44",
  razaoSocial: "ABC Reps Ltda",
  email: "abc@reps.com",
  telefone: "(11) 3000-0000",
  contato: "Maria",
  endereco: "Rua A, 10",
  cidade: "São Paulo",
  uf: "SP",
  gerenteId: 2,
  idIntegracao: "ERP-1",
}

describe("EditarRepresentantePage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/representantes/5")
  })

  it("carrega os dados e salva as alterações via PUT", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/representantes/5") return { json: dados }
      if (method === "PUT" && url === "/api/representantes/5") return { json: dados }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<EditarRepresentantePage params={Promise.resolve({ id: "5" })} />)

    await screen.findByRole("heading", { name: /Editar Representante/ })
    await screen.findByDisplayValue("Rep ABC")
    expect(screen.getByDisplayValue("11.222.333/0001-44")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/representantes/5", "PUT")
      expect(call).toBeDefined()
      expect(call!.body.id).toBe(5)
      expect(call!.body.nome).toBe("Rep ABC")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Representante atualizado com sucesso!"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/representantes")
  })

  it("mostra erro e redireciona quando o representante não é encontrado", async () => {
    const fetchMock = createFetchMock(() => ({ status: 404, json: { error: "não encontrado" } }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<EditarRepresentantePage params={Promise.resolve({ id: "5" })} />)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Representante não encontrado"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/representantes")
  })
})
