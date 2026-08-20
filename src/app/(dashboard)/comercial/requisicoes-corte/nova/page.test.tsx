// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"
import NovaRequisicaoCortePage from "./page"

describe("NovaRequisicaoCortePage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/requisicoes-corte/nova")
  })

  it("renderiza o formulário com a linha de item inicial e botões de ação", () => {
    const fetchMock = createFetchMock(() => ({ json: {} }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<NovaRequisicaoCortePage />)

    expect(screen.getByRole("heading", { name: /Nova Requisição de Corte/ })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("2.K2620...")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("2 M")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Adicionar Item/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Copiar Item/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Inserir por OCR/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Salvar Requisição" })).toBeInTheDocument()
  })

  it("bloqueia o envio sem item com quantidade", async () => {
    const fetchMock = createFetchMock(() => ({ json: {} }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<NovaRequisicaoCortePage />)
    fireEvent.click(screen.getByRole("button", { name: "Salvar Requisição" }))

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Adicione pelo menos um item com quantidade"))
    expect(findCall(fetchMock.calls, "/api/comercial/requisicoes-corte", "POST")).toBeUndefined()
  })

  it("cria a requisição via POST com itens válidos", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "POST" && url === "/api/comercial/requisicoes-corte") return { status: 201, json: { id: 40 } }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<NovaRequisicaoCortePage />)

    fireEvent.change(screen.getByPlaceholderText("2.K2620..."), { target: { value: "2.K2620.001" } })
    fireEvent.change(screen.getByPlaceholderText("Palha"), { target: { value: "Preto" } })
    fireEvent.change(screen.getByPlaceholderText("2 M"), { target: { value: "3 M" } })
    fireEvent.change(screen.getByPlaceholderText("Digite aqui mais informações"), { target: { value: "Urgente" } })
    fireEvent.change(screen.getByPlaceholderText("Vilma"), { target: { value: "Tiago" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar Requisição" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/comercial/requisicoes-corte", "POST")
      expect(call).toBeDefined()
      expect(call!.body.itens).toHaveLength(1)
      expect(call!.body.itens[0].codigoProduto).toBe("2.K2620.001")
      expect(call!.body.itens[0].quantidade).toBe("3 M")
      expect(call!.body.observacoes).toBe("Urgente")
      expect(call!.body.entreguePor).toBe("Tiago")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Requisição criada com sucesso"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/requisicoes-corte")
  })

  it("copia o último item ao usar Copiar Item", async () => {
    const fetchMock = createFetchMock(() => ({ json: {} }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<NovaRequisicaoCortePage />)

    fireEvent.change(screen.getByPlaceholderText("2.K2620..."), { target: { value: "2.K2620.001" } })
    fireEvent.change(screen.getByPlaceholderText("2 M"), { target: { value: "5 M" } })

    fireEvent.click(screen.getByRole("button", { name: /Copiar Item/ }))

    const dialog = screen.getByText("Copiar último item").closest("div[class*='fixed']")!
    expect(dialog).toBeInTheDocument()

    const inputNumero = dialog.querySelector("input[type='number']") as HTMLInputElement
    expect(inputNumero).toHaveValue(1)

    fireEvent.change(inputNumero, { target: { value: "2" } })
    fireEvent.click(screen.getByRole("button", { name: "Copiar" }))

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith("2 cópia(s) adicionada(s)")
    })

    const inputsCodigo = screen.getAllByPlaceholderText("2.K2620...")
    expect(inputsCodigo).toHaveLength(3)
  })
})
