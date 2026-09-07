// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import NovaFaturamentoPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

describe("NovaFaturamentoPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/crm/faturamentos/novo")
  })

  it("renderiza o formulário de criação", () => {
    vi.stubGlobal("fetch", createFetchMock(() => ({ json: [] })).fn)
    renderPage(<NovaFaturamentoPage />)

    expect(screen.getByRole("heading", { name: "Novo Faturamento" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Criar Faturamento" })).toBeInTheDocument()
  })

  it("valida a oportunidade obrigatória antes de salvar", async () => {
    const fetchMock = createFetchMock(() => ({ json: [] }))
    vi.stubGlobal("fetch", fetchMock.fn)
    const ui = renderPage(<NovaFaturamentoPage />)

    fireEvent.submit(ui.container.querySelector("form")!)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Selecione a oportunidade"))
    expect(findCall(fetchMock.calls, "/api/crm/faturamentos", "POST")).toBeUndefined()
  })

  it("cria via POST e redireciona para o detalhe", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/oportunidades") return { json: [{ id: 1, titulo: "Malha penteada" }] }
      if (method === "POST" && url === "/api/crm/faturamentos") return { status: 201, json: { id: 5 } }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<NovaFaturamentoPage />)

    await screen.findByText("Malha penteada")
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "1" } })
    fireEvent.change(screen.getByPlaceholderText("Ex: Tecido 100% algodão"), { target: { value: "Malha penteada azul" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar Faturamento" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/faturamentos", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toMatchObject({
        oportunidadeId: "1",
        status: "EMITIDO",
        origem: "MANUAL",
        itens: [{ produto: "Malha penteada azul", unidade: "METROS" }],
      })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Faturamento criado"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/faturamentos/5")
  })
})