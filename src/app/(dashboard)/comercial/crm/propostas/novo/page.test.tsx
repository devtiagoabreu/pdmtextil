// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import NovaPropostaPage from "./page"
import { createFetchMock, renderPage, findCall, navMock } from "@/test/harness"

describe("NovaPropostaPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/estados") {
        return { json: [{ id: 35, uf: "SP", nome: "São Paulo" }] }
      }
      if (method === "GET" && url === "/api/crm/pessoas") {
        return { json: [{ id: 1, razaoSocial: "Tecelagem Alpha" }] }
      }
      if (method === "GET" && url === "/api/crm/oportunidades") {
        return { json: [{ id: 3, titulo: "Oportunidade Expansão" }] }
      }
      if (method === "POST" && url === "/api/crm/propostas") {
        return { json: { id: 7 } }
      }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("renderiza o formulário com Criar Proposta desabilitado", async () => {
    renderPage(<NovaPropostaPage />)

    expect(await screen.findByRole("heading", { name: "Nova Proposta" })).toBeInTheDocument()
    expect(screen.getByText(/Título/)).toBeInTheDocument()
    expect(screen.getByText(/Pessoa \(Negócio\)/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Criar Proposta" })).toBeDisabled()
  })

  it("cria proposta via POST e navega para o detalhe", async () => {
    renderPage(<NovaPropostaPage />)
    await screen.findByRole("heading", { name: "Nova Proposta" })

    fireEvent.change(screen.getByPlaceholderText("Ex: Proposta Comercial - Tecido X"), {
      target: { value: "Proposta Comercial - Tecido X" },
    })

    await waitFor(() => expect(screen.getByRole("option", { name: "Tecelagem Alpha" })).toBeInTheDocument())
    const selects = screen.getAllByRole("combobox")
    fireEvent.change(selects[0], { target: { value: "1" } })

    await waitFor(() => expect(screen.getByRole("option", { name: "Oportunidade Expansão" })).toBeInTheDocument())
    const selectsApos = screen.getAllByRole("combobox")
    fireEvent.change(selectsApos[1], { target: { value: "3" } })

    fireEvent.change(screen.getByPlaceholderText("0,00"), { target: { value: "5000" } })
    fireEvent.change(screen.getByPlaceholderText("Ex: 30 dias"), { target: { value: "30 dias" } })
    fireEvent.change(screen.getByPlaceholderText("Ex: 30/60/90 dias"), { target: { value: "30/60/90 dias" } })
    fireEvent.change(screen.getByPlaceholderText("Detalhes da proposta..."), { target: { value: "Tecido com elastano" } })
    fireEvent.change(screen.getByPlaceholderText("https://..."), { target: { value: "https://exemplo.com/proposta.pdf" } })

    expect(screen.getByRole("button", { name: "Criar Proposta" })).toBeEnabled()
    fireEvent.click(screen.getByRole("button", { name: "Criar Proposta" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/propostas", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({
        titulo: "Proposta Comercial - Tecido X",
        empresaId: 1,
        oportunidadeId: 3,
        valor: 5000,
        descricao: "Tecido com elastano",
        condicoesPagamento: "30/60/90 dias",
        prazoEntrega: "30 dias",
        arquivoUrl: "https://exemplo.com/proposta.pdf",
      })
    })
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/propostas/7")
  })
})
