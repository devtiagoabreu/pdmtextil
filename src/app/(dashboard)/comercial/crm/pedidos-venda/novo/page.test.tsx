// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import NovoPedidoVendaPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

describe("NovoPedidoVendaPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/crm/pedidos-venda/novo")
  })

  it("renderiza o formulário de criação", () => {
    vi.stubGlobal("fetch", createFetchMock(() => ({ json: [] })).fn)
    renderPage(<NovoPedidoVendaPage />)

    expect(screen.getByRole("heading", { name: "Novo Pedido de Venda" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Criar Pedido de Venda" })).toBeInTheDocument()
  })

  it("valida a oportunidade obrigatória antes de salvar", async () => {
    const fetchMock = createFetchMock(() => ({ json: [] }))
    vi.stubGlobal("fetch", fetchMock.fn)
    const ui = renderPage(<NovoPedidoVendaPage />)

    fireEvent.submit(ui.container.querySelector("form")!)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Selecione a oportunidade"))
    expect(findCall(fetchMock.calls, "/api/crm/pedidos-venda", "POST")).toBeUndefined()
  })

  it("cria via POST e redireciona para o detalhe", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/oportunidades") return { json: [{ id: 1, titulo: "Malha penteada" }] }
      if (method === "POST" && url === "/api/crm/pedidos-venda") return { status: 201, json: { id: 6 } }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<NovoPedidoVendaPage />)

    await screen.findByText("Malha penteada")
    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "1" } })
    fireEvent.change(screen.getByPlaceholderText("Ex: Tecido 100% algodão"), { target: { value: "Malha penteada azul" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar Pedido de Venda" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/pedidos-venda", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toMatchObject({
        oportunidadeId: "1",
        status: "ABERTO",
        origem: "MANUAL",
        itens: [{ produto: "Malha penteada azul", unidade: "METROS" }],
      })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Pedido de venda criado"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/pedidos-venda/6")
  })
})