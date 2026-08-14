// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import NovoContatoPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

describe("NovoContatoPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/crm/contatos/novo")
  })

  it("renderiza o seletor de tipo de vínculo (Cliente/Pessoa/Avulso)", () => {
    vi.stubGlobal("fetch", createFetchMock(() => ({ json: null })).fn)
    renderPage(<NovoContatoPage />)

    expect(screen.getByRole("heading", { name: "Novo Contato" })).toBeInTheDocument()
    expect(screen.getByText("A quem este contato pertence?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Cliente/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Pessoa/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Avulso/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Criar Contato" })).not.toBeInTheDocument()
  })

  it("valida o nome antes de salvar", async () => {
    const fetchMock = createFetchMock(() => ({ json: null }))
    vi.stubGlobal("fetch", fetchMock.fn)
    const ui = renderPage(<NovoContatoPage />)

    fireEvent.click(screen.getByRole("button", { name: /Avulso/i }))
    fireEvent.submit(ui.container.querySelector("form")!)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome é obrigatório"))
    expect(findCall(fetchMock.calls, "/api/crm/contatos", "POST")).toBeUndefined()
  })

  it("cria contato avulso (sem vínculo) via POST", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/pessoas") return { json: [] }
      if (method === "GET" && url === "/api/clientes") return { json: [] }
      if (method === "POST" && url === "/api/crm/contatos") return { status: 201, json: { id: 5 } }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<NovoContatoPage />)

    fireEvent.click(screen.getByRole("button", { name: /Avulso/i }))
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "Carlos Silva" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar Contato" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/contatos", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toMatchObject({
        nome: "Carlos Silva",
        cargo: "",
        email: "",
        principal: false,
      })
      expect(call!.body.empresaId).toBeUndefined()
      expect(call!.body.clienteId).toBeUndefined()
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Contato criado com sucesso"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/contatos/5")
  })

  it("cria contato vinculado a uma pessoa", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/pessoas") return { json: [{ id: 1, razaoSocial: "Tecelagem Alpha" }] }
      if (method === "GET" && url === "/api/clientes") return { json: [] }
      if (method === "POST" && url === "/api/crm/contatos") return { status: 201, json: { id: 5 } }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<NovoContatoPage />)

    fireEvent.click(screen.getByRole("button", { name: /Pessoa/i }))
    await screen.findByRole("option", { name: "Tecelagem Alpha" })
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "1" } })
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "Carlos Silva" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar Contato" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/contatos", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toMatchObject({ nome: "Carlos Silva", empresaId: "1" })
      expect(call!.body.clienteId).toBeUndefined()
    })
  })

  it("cria contato vinculado a um cliente", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/pessoas") return { json: [] }
      if (method === "GET" && url === "/api/clientes") return { json: [{ id: 9, nome: "Cliente SP" }] }
      if (method === "POST" && url === "/api/crm/contatos") return { status: 201, json: { id: 5 } }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<NovoContatoPage />)

    fireEvent.click(screen.getByRole("button", { name: /Cliente/i }))
    await screen.findByRole("option", { name: "Cliente SP" })
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "9" } })
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "Carlos Silva" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar Contato" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/contatos", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toMatchObject({ nome: "Carlos Silva", clienteId: "9" })
      expect(call!.body.empresaId).toBeUndefined()
    })
  })
})
