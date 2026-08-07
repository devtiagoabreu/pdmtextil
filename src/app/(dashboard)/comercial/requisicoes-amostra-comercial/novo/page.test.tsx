// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"
import NovaRequisicaoAmostraComercialPage from "./page"

describe("NovaRequisicaoAmostraComercialPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/requisicoes-amostra-comercial/novo")
  })

  it("renderiza o formulário de criação", () => {
    const fetchMock = createFetchMock(() => ({ json: [] }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<NovaRequisicaoAmostraComercialPage />)

    expect(screen.getByRole("heading", { name: /Nova Requisição de Amostra Comercial/ })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Buscar produto por código ou descrição...")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Ex: Amostra para aprovação do cliente")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Salvar Requisição" })).toBeInTheDocument()
  })

  it("valida os campos obrigatórios antes de salvar", async () => {
    const fetchMock = createFetchMock(() => ({ json: {} }))
    vi.stubGlobal("fetch", fetchMock.fn)

    const ui = renderPage(<NovaRequisicaoAmostraComercialPage />)
    fireEvent.submit(ui.container.querySelector("form")!)

    expect(await screen.findByText("Selecione um produto")).toBeInTheDocument()
    expect(screen.getByText("Título é obrigatório")).toBeInTheDocument()
    expect(findCall(fetchMock.calls, "/api/requisicoes-amostra-comercial", "POST")).toBeUndefined()
  })

  it("cria a requisição via POST com produto selecionado", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url.startsWith("/api/cadastros/produtos-cru")) {
        return { json: [{ id: 7, codigoPdm: "TEC-01", descricao: "Tecido poliéster" }] }
      }
      if (method === "POST" && url === "/api/requisicoes-amostra-comercial") return { status: 201, json: { id: 20 } }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<NovaRequisicaoAmostraComercialPage />)

    fireEvent.change(screen.getByPlaceholderText("Buscar produto por código ou descrição..."), {
      target: { value: "tec" },
    })
    fireEvent.click(await screen.findByRole("button", { name: /TEC-01/ }))

    fireEvent.change(screen.getByPlaceholderText("Ex: Amostra para aprovação do cliente"), {
      target: { value: "Amostra para cliente" },
    })
    fireEvent.click(screen.getByRole("button", { name: "Salvar Requisição" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/requisicoes-amostra-comercial", "POST")
      expect(call).toBeDefined()
      expect(call!.body.produtoCruId).toBe(7)
      expect(call!.body.titulo).toBe("Amostra para cliente")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Requisição criada com sucesso"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/requisicoes-amostra-comercial")
  })
})
