// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import NovaViagemPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

describe("NovaViagemPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/crm/viagens/novo")
  })

  it("renderiza o formulário de criação", () => {
    vi.stubGlobal("fetch", createFetchMock(() => ({ json: [] })).fn)
    renderPage(<NovaViagemPage />)

    expect(screen.getByRole("heading", { name: "Nova Viagem" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Criar Viagem" })).toBeInTheDocument()
  })

  it("valida o título obrigatório antes de salvar", async () => {
    const fetchMock = createFetchMock(() => ({ json: [] }))
    vi.stubGlobal("fetch", fetchMock.fn)
    const ui = renderPage(<NovaViagemPage />)

    fireEvent.submit(ui.container.querySelector("form")!)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("O título da viagem é obrigatório"))
    expect(findCall(fetchMock.calls, "/api/crm/viagens", "POST")).toBeUndefined()
  })

  it("cria via POST com investimentos e redireciona para o detalhe", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "POST" && url === "/api/crm/viagens") return { status: 201, json: { id: 7 } }
      if (method === "GET" && url === "/api/crm/estados") return { json: [] }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<NovaViagemPage />)

    fireEvent.change(screen.getByPlaceholderText("Ex: Feira Agritech - São Paulo"), {
      target: { value: "Feira Agritech" },
    })
    fireEvent.change(screen.getByPlaceholderText("Cidade"), {
      target: { value: "São Paulo" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }))
    fireEvent.change(screen.getByPlaceholderText("0,00"), { target: { value: "500" } })
    fireEvent.click(screen.getByRole("button", { name: "Criar Viagem" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/viagens", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toMatchObject({
        titulo: "Feira Agritech",
        destinoCidade: "São Paulo",
        status: "PLANEJADA",
        investimentos: [{ tipo: "PASSAGEM", valor: 500, observacao: "" }],
      })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Viagem criada"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/viagens/7")
  })
})
