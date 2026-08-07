// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, waitFor } from "@testing-library/react"
import { createFetchMock, renderPage, navMock, toastMock } from "@/test/harness"
import DetalheRequisicaoAmostraComercialPage from "./page"

const dados = {
  id: 10,
  titulo: "Amostra Tecido A",
  cliente: "Cliente A",
  status: "SOLICITADO",
  quantidade: "5 metros",
  motivo: "Aprovação do cliente",
  produto: { id: 7, codigoPdm: "TEC-01", descricao: "Tecido poliéster" },
}

describe("DetalheRequisicaoAmostraComercialPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/requisicoes-amostra-comercial/10")
    navMock.setParams({ id: "10" })
  })

  it("renderiza o detalhe da requisição", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/admin/status?tipo=AMOSTRA_COMERCIAL") return { json: [] }
      if (method === "GET" && url.startsWith("/api/requisicoes-amostra-comercial/10?t=")) return { json: dados }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<DetalheRequisicaoAmostraComercialPage />)

    await screen.findByRole("heading", { name: /Amostra Tecido A/ })
    expect(screen.getByText("#10")).toBeInTheDocument()
    expect(screen.getByText(/TEC-01/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "PDF" })).toBeInTheDocument()
  })

  it("mostra erro quando a requisição não é encontrada", async () => {
    const fetchMock = createFetchMock(() => ({ status: 404, json: { error: "não encontrada" } }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<DetalheRequisicaoAmostraComercialPage />)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Erro ao carregar requisição"))
    expect(await screen.findByText("Erro ao carregar requisição")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Voltar à lista/ })).toHaveAttribute("href", "/comercial/requisicoes-amostra-comercial")
  })
})
