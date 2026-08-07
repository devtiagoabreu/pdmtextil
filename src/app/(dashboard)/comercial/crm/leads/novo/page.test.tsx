// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import NovoLeadPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

describe("NovoLeadPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/crm/leads/novo")
  })

  it("renderiza o formulário de criação", () => {
    vi.stubGlobal("fetch", createFetchMock(() => ({ json: null })).fn)
    renderPage(<NovoLeadPage />)

    expect(screen.getByRole("heading", { name: "Novo Lead" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument()
  })

  it("valida o nome obrigatório antes de salvar", async () => {
    const fetchMock = createFetchMock(() => ({ json: null }))
    vi.stubGlobal("fetch", fetchMock.fn)
    const ui = renderPage(<NovoLeadPage />)

    fireEvent.submit(ui.container.querySelector("form")!)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome é obrigatório"))
    expect(findCall(fetchMock.calls, "/api/crm/leads", "POST")).toBeUndefined()
  })

  it("cria via POST e redireciona para a lista", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "POST" && url === "/api/crm/leads") return { status: 201, json: { id: 1 } }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<NovoLeadPage />)

    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "João Pereira" } })
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "WHATSAPP" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/leads", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toMatchObject({
        nome: "João Pereira",
        tipoPessoa: "",
        origem: "WHATSAPP",
        email: "",
        empresaNome: "",
        descricao: "",
      })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Lead criado com sucesso"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/leads")
  })
})
