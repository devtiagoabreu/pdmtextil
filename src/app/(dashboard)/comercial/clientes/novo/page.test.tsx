// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"
import NovoClientePage from "./page"

describe("NovoClientePage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/estados") return { json: [] }
      if (method === "POST" && url === "/api/clientes") return { status: 201, json: { id: 99 } }
      return { status: 404, json: { error: "Rota não mockada" } }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
    navMock.setPathname("/comercial/clientes/novo")
    navMock.setParams({ id: "novo" })
  })

  it("renderiza o formulário de criação", () => {
    renderPage(<NovoClientePage />)
    expect(screen.getByRole("heading", { name: "Novo Cliente" })).toBeInTheDocument()
  })

  it("valida os campos obrigatórios antes de salvar", async () => {
    const ui = renderPage(<NovoClientePage />)
    fireEvent.submit(ui.container.querySelector("form")!)
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome fantasia é obrigatório"))
    expect(findCall(fetchMock.calls, "/api/clientes", "POST")).toBeUndefined()
  })

  it("cria via POST e redireciona", async () => {
    const ui = renderPage(<NovoClientePage />)
    const textboxes = within(ui.container).getAllByRole("textbox")
    fireEvent.change(textboxes[0], { target: { value: "Nova Firma" } })
    fireEvent.change(textboxes[1], { target: { value: "00.111.222/0001-33" } })
    fireEvent.submit(ui.container.querySelector("form")!)

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/clientes", "POST")
      expect(call).toBeDefined()
      expect(call!.body.nome).toBe("Nova Firma")
      expect(call!.body.cnpj).toBe("00.111.222/0001-33")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Cliente cadastrado com sucesso!"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/clientes/99")
  })
})
