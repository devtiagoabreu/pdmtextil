// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import NovoContatoPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

describe("NovoContatoPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/crm/contatos/novo")
  })

  it("renderiza o formulário de criação", () => {
    vi.stubGlobal("fetch", createFetchMock(() => ({ json: null })).fn)
    renderPage(<NovoContatoPage />)

    expect(screen.getByRole("heading", { name: "Novo Contato" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Criar Contato" })).toBeInTheDocument()
  })

  it("valida nome e pessoa antes de salvar", async () => {
    const fetchMock = createFetchMock(() => ({ json: null }))
    vi.stubGlobal("fetch", fetchMock.fn)
    const ui = renderPage(<NovoContatoPage />)

    fireEvent.submit(ui.container.querySelector("form")!)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome e Pessoa (Negócio) são obrigatórios"))
    expect(findCall(fetchMock.calls, "/api/crm/contatos", "POST")).toBeUndefined()
  })

  it("carrega as empresas e cria o contato via POST", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/pessoas") return { json: [{ id: 1, razaoSocial: "Tecelagem Alpha" }] }
      if (method === "POST" && url === "/api/crm/contatos") return { status: 201, json: { id: 5 } }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<NovoContatoPage />)

    await screen.findByRole("option", { name: "Tecelagem Alpha" })
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "1" } })
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "Carlos Silva" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar Contato" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/contatos", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toMatchObject({
        nome: "Carlos Silva",
        cargo: "",
        email: "",
        empresaId: 1,
        principal: false,
      })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Contato criado com sucesso"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/contatos/5")
  })
})
