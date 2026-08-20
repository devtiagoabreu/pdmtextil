// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"
import DetalheRequisicaoCortePage from "./page"

const dados = {
  id: 40,
  requisitanteNome: "Tiago",
  status: "SOLICITADO",
  observacoes: "Observação inicial",
  entreguePor: "Vilma",
  itens: [{ id: 1, codigoProduto: "2.K2620.001", ordem: "10", artigo: "ART-1", cor: "Preto", desenho: "500101", quantidade: "3 M" }],
}

describe("DetalheRequisicaoCortePage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/requisicoes-corte/40")
    navMock.setParams({ id: "40" })
  })

  it("renderiza o detalhe com os itens carregados e botões de ação", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/status?tipo=REQUISICAO_CORTE") return { json: [] }
      if (method === "GET" && url.startsWith("/api/comercial/requisicoes-corte/40?t=")) return { json: dados }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<DetalheRequisicaoCortePage />)

    await screen.findByRole("heading", { name: /Requisição #40/ })
    expect(screen.getByText("Solicitado")).toBeInTheDocument()
    expect(await screen.findByDisplayValue("2.K2620.001")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Observação inicial")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "PDF" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Adicionar Item/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Copiar Item/ })).toBeInTheDocument()
  })

  it("salva as alterações via PUT", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/status?tipo=REQUISICAO_CORTE") return { json: [] }
      if (method === "GET" && url.startsWith("/api/comercial/requisicoes-corte/40?t=")) return { json: dados }
      if (method === "PUT" && url === "/api/comercial/requisicoes-corte/40") return { json: dados }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<DetalheRequisicaoCortePage />)
    await screen.findByDisplayValue("2.K2620.001")

    fireEvent.change(screen.getByDisplayValue("Observação inicial"), { target: { value: "Observação atualizada" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/comercial/requisicoes-corte/40", "PUT")
      expect(call).toBeDefined()
      expect(call!.body.observacoes).toBe("Observação atualizada")
      expect(call!.body.status).toBe("SOLICITADO")
      expect(call!.body.itens).toHaveLength(1)
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Requisição atualizada com sucesso"))
  })

  it("copia o último item ao usar Copiar Item", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/status?tipo=REQUISICAO_CORTE") return { json: [] }
      if (method === "GET" && url.startsWith("/api/comercial/requisicoes-corte/40?t=")) return { json: dados }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<DetalheRequisicaoCortePage />)
    await screen.findByDisplayValue("2.K2620.001")

    fireEvent.click(screen.getByRole("button", { name: /Copiar Item/ }))

    const dialog = screen.getByText("Copiar último item").closest("div[class*='fixed']")!
    expect(dialog).toBeInTheDocument()

    const inputNumero = dialog.querySelector("input[type='number']") as HTMLInputElement
    fireEvent.change(inputNumero, { target: { value: "3" } })
    fireEvent.click(screen.getByRole("button", { name: "Copiar" }))

    await waitFor(() => {
      expect(toastMock.success).toHaveBeenCalledWith("3 cópia(s) adicionada(s)")
    })

    const inputsCodigo = screen.getAllByDisplayValue("2.K2620.001")
    expect(inputsCodigo).toHaveLength(4)
  })
})
