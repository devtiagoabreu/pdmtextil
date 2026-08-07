// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import CampanhaDetailPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

const campanha = {
  id: 1,
  nome: "Lançamento Verão",
  tipo: "EMAIL",
  status: "ATIVA",
  descricao: "Promoção de verão",
  dataInicio: "2026-07-01",
  dataFim: null,
  orcamento: "5000",
  custoAquisicao: null,
  leadsGerados: 12,
}

describe("CampanhaDetailPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/crm/campanhas/1")
    navMock.setParams({ id: "1" })
  })

  it("carrega e exibe os detalhes da campanha", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/campanhas/1") return { json: campanha }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<CampanhaDetailPage />)

    expect(await screen.findByRole("heading", { name: "Lançamento Verão" })).toBeInTheDocument()
    expect(screen.getAllByText("E-mail").length).toBeGreaterThan(0)
    expect(screen.getByText("ATIVA")).toBeInTheDocument()
    expect(screen.getByText("12")).toBeInTheDocument()
    expect(screen.getByText("R$ 5.000,00")).toBeInTheDocument()
  })

  it("edita e salva via PUT", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/campanhas/1") return { json: campanha }
      if (method === "PUT" && url === "/api/crm/campanhas/1") return { json: { ...campanha, nome: "Lançamento Verão 2026" } }
      return { json: null }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<CampanhaDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: "Editar" }))
    const nomeInput = screen.getByDisplayValue("Lançamento Verão")
    fireEvent.change(nomeInput, { target: { value: "Lançamento Verão 2026" } })
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/campanhas/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body.nome).toBe("Lançamento Verão 2026")
      expect(call!.body.orcamento).toBe(5000)
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Campanha atualizada"))
  })

  it("mostra mensagem quando a campanha não é encontrada", async () => {
    const fetchMock = createFetchMock(() => ({ json: null }))
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<CampanhaDetailPage />)

    expect(await screen.findByText("Campanha não encontrada")).toBeInTheDocument()
  })
})
