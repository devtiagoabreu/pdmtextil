// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import PropostaDetailPage from "./page"
import { createFetchMock, renderPage, findCall, navMock } from "@/test/harness"

const proposta = {
  id: 1,
  titulo: "Proposta Comercial - Tecido X",
  empresaId: 1,
  oportunidadeId: 3,
  valor: "5000",
  prazoEntrega: "30 dias",
  condicoesPagamento: "30/60/90 dias",
  descricao: "Tecido com elastano",
  arquivoUrl: "https://exemplo.com/proposta.pdf",
  status: "ENVIADA",
  dataEnvio: "2026-07-01T10:00:00Z",
  createdAt: "2026-06-25T10:00:00Z",
}

describe("PropostaDetailPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/propostas/1") return { json: proposta }
      if (method === "PUT" && url === "/api/crm/propostas/1") return { json: proposta }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("exibe os dados da proposta com status e link do arquivo", async () => {
    navMock.setParams({ id: "1" })
    navMock.setPathname("/comercial/crm/propostas/1")
    renderPage(<PropostaDetailPage />)

    expect(await screen.findByRole("heading", { name: /Proposta Comercial - Tecido X/ })).toBeInTheDocument()
    expect(screen.getByText("Proposta #1")).toBeInTheDocument()
    expect(screen.getByText("R$ 5.000,00")).toBeInTheDocument()
    expect(screen.getByText("30/60/90 dias")).toBeInTheDocument()
    expect(screen.getAllByText("Enviada").length).toBeGreaterThan(0)
    expect(screen.getByRole("link", { name: "Ver PDF da Proposta" })).toHaveAttribute(
      "href",
      "https://exemplo.com/proposta.pdf"
    )
  })

  it("altera o status via PUT", async () => {
    navMock.setParams({ id: "1" })
    navMock.setPathname("/comercial/crm/propostas/1")
    renderPage(<PropostaDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: "Aceita" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/propostas/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ status: "ACEITA" })
    })
  })

  it("confirma alteração para Recusada no modal", async () => {
    navMock.setParams({ id: "1" })
    navMock.setPathname("/comercial/crm/propostas/1")
    renderPage(<PropostaDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: "Recusada" }))

    const dialog = screen.getByRole("dialog", { name: "Alterar status para Recusada?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Confirmar" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/propostas/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ status: "RECUSADA" })
    })
  })

  it("mostra proposta não encontrada", async () => {
    navMock.setParams({ id: "999" })
    navMock.setPathname("/comercial/crm/propostas/999")
    renderPage(<PropostaDetailPage />)

    expect(await screen.findByText("Proposta não encontrada")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Voltar para propostas" })).toHaveAttribute(
      "href",
      "/comercial/crm/propostas"
    )
  })
})
