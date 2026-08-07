// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import NovaCampanhaPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

describe("NovaCampanhaPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/crm/campanhas/nova")
  })

  it("renderiza o formulário de criação", () => {
    vi.stubGlobal("fetch", createFetchMock(() => ({ json: null })).fn)
    renderPage(<NovaCampanhaPage />)

    expect(screen.getByRole("heading", { name: "Nova Campanha" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Criar Campanha" })).toBeInTheDocument()
  })

  it("valida o nome obrigatório antes de salvar", async () => {
    const fetchMock = createFetchMock(() => ({ json: null }))
    vi.stubGlobal("fetch", fetchMock.fn)
    const ui = renderPage(<NovaCampanhaPage />)

    fireEvent.submit(ui.container.querySelector("form")!)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("O nome da campanha é obrigatório"))
    expect(findCall(fetchMock.calls, "/api/crm/campanhas", "POST")).toBeUndefined()
  })

  it("cria via POST e redireciona para a lista", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "POST" && url === "/api/crm/campanhas") return { status: 201, json: { id: 1 } }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<NovaCampanhaPage />)

    fireEvent.change(screen.getByPlaceholderText("Nome da campanha"), {
      target: { value: "Lançamento Verão" },
    })
    fireEvent.change(screen.getByPlaceholderText("Descrição da campanha"), {
      target: { value: "Promoção de verão" },
    })
    fireEvent.change(screen.getAllByPlaceholderText("0,00")[0], {
      target: { value: "1000" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Criar Campanha" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/campanhas", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toMatchObject({
        nome: "Lançamento Verão",
        descricao: "Promoção de verão",
        tipo: "WHATSAPP",
        orcamento: 1000,
        custoAquisicao: null,
        dataInicio: null,
        dataFim: null,
        leadsGerados: 0,
      })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Campanha criada"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/campanhas")
  })
})
