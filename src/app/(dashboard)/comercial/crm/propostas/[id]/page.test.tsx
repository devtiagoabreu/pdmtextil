// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import PropostaDetailPage from "./page"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"

const { sessionMock } = vi.hoisted(() => ({
  sessionMock: { data: { user: { id: "1", role: "ADMIN" as string } } },
}))
vi.mock("next-auth/react", () => ({
  useSession: () => sessionMock,
}))

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
  criadoPor: 1,
  dataEnvio: "2026-07-01T10:00:00Z",
  createdAt: "2026-06-25T10:00:00Z",
}

describe("PropostaDetailPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    sessionMock.data.user.id = "1"
    sessionMock.data.user.role = "ADMIN"
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/propostas/1") return { json: proposta }
      if (method === "PUT" && url === "/api/crm/propostas/1") return { json: proposta }
      if (method === "DELETE" && url === "/api/crm/propostas/1") return { json: { success: true } }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
    navMock.setParams({ id: "1" })
    navMock.setPathname("/comercial/crm/propostas/1")
  })

  it("exibe os dados da proposta com status e link do arquivo", async () => {
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
    renderPage(<PropostaDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: "Aceita" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/propostas/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ status: "ACEITA" })
    })
  })

  it("confirma alteração para Recusada no modal", async () => {
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

  it("edita e salva os campos da proposta via PUT", async () => {
    renderPage(<PropostaDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: /Editar/ }))

    const titulo = screen.getByDisplayValue("Proposta Comercial - Tecido X")
    fireEvent.change(titulo, { target: { value: "Proposta Comercial - Tecido Y" } })
    fireEvent.change(screen.getByDisplayValue("5000"), { target: { value: "7500" } })
    fireEvent.change(screen.getByDisplayValue("30/60/90 dias"), { target: { value: "30/60 dias" } })

    fireEvent.click(screen.getByRole("button", { name: "Salvar Alterações" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/propostas/1", "PUT")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({
        titulo: "Proposta Comercial - Tecido Y",
        valor: 7500,
        prazoEntrega: "30 dias",
        condicoesPagamento: "30/60 dias",
        descricao: "Tecido com elastano",
        arquivoUrl: "https://exemplo.com/proposta.pdf",
      })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Proposta atualizada com sucesso!"))
  })

  it("não mostra editar/excluir para usuário que não é admin nem criador", async () => {
    sessionMock.data.user.id = "2"
    sessionMock.data.user.role = "VENDEDOR"
    renderPage(<PropostaDetailPage />)

    await screen.findByRole("heading", { name: /Proposta Comercial - Tecido X/ })
    expect(screen.queryByRole("button", { name: /Editar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Excluir/ })).not.toBeInTheDocument()
  })

  it("inclui a proposta via DELETE (admin) com confirmação", async () => {
    renderPage(<PropostaDetailPage />)

    fireEvent.click(await screen.findByRole("button", { name: /Excluir/ }))

    const dialog = screen.getByRole("dialog", { name: "Excluir proposta?" })
    fireEvent.click(within(dialog).getByRole("button", { name: "Excluir" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/propostas/1", "DELETE")
      expect(call).toBeDefined()
    })
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/propostas")
  })

  it("mostra proposta não encontrada", async () => {
    const emptyMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/propostas/999") return { json: null }
      return { json: null }
    })
    vi.stubGlobal("fetch", emptyMock.fn)
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
