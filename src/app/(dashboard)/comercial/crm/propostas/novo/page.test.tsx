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
      if (method === "GET" && url === "/api/clientes") {
        return { json: [{ id: 9, nome: "Confeitaria Beta" }] }
      }
      if (method === "POST" && url === "/api/crm/propostas") {
        return { json: { id: 7 } }
      }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("renderiza o seletor de tipo de vínculo (Cliente/Pessoa/Avulso)", async () => {
    renderPage(<NovaPropostaPage />)

    expect(await screen.findByRole("heading", { name: "Nova Proposta" })).toBeInTheDocument()
    expect(screen.getByText("Para quem é esta proposta?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Cliente/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Pessoa/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Avulso/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Criar Proposta" })).not.toBeInTheDocument()
  })

  it("cria proposta via POST e navega para o detalhe", async () => {
    renderPage(<NovaPropostaPage />)
    await screen.findByRole("heading", { name: "Nova Proposta" })

    fireEvent.click(screen.getByRole("button", { name: /Pessoa/i }))
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
        clienteId: null,
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

  it("pré-seleciona a oportunidade e a pessoa quando vem com ?oportunidadeId", async () => {
    navMock.setSearchParams({ oportunidadeId: "3" })
    const preFillMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/oportunidades") {
        return { json: [{ id: 3, titulo: "Oportunidade Expansão", empresaId: 1 }] }
      }
      if (method === "GET" && url === "/api/crm/pessoas") {
        return { json: [{ id: 1, razaoSocial: "Tecelagem Alpha" }] }
      }
      return { json: null }
    })
    vi.stubGlobal("fetch", preFillMock.fn)
    renderPage(<NovaPropostaPage />)

    expect(await screen.findByRole("heading", { name: "Nova Proposta" })).toBeInTheDocument()
    expect(await screen.findByText("Proposta para Pessoa (Negócio)")).toBeInTheDocument()

    await waitFor(() => expect(screen.getByDisplayValue("Oportunidade Expansão")).toBeInTheDocument())
  })

  it("cria proposta vinculada a Cliente", async () => {
    renderPage(<NovaPropostaPage />)
    await screen.findByRole("heading", { name: "Nova Proposta" })

    fireEvent.click(screen.getByRole("button", { name: /Cliente/i }))
    await waitFor(() => expect(screen.getByRole("option", { name: "Confeitaria Beta" })).toBeInTheDocument())

    fireEvent.change(screen.getByPlaceholderText("Ex: Proposta Comercial - Tecido X"), {
      target: { value: "Proposta Cliente Beta" },
    })
    const selects = screen.getAllByRole("combobox")
    fireEvent.change(selects[0], { target: { value: "9" } })

    expect(screen.getByRole("button", { name: "Criar Proposta" })).toBeEnabled()
    fireEvent.click(screen.getByRole("button", { name: "Criar Proposta" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/propostas", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({
        titulo: "Proposta Cliente Beta",
        empresaId: null,
        clienteId: 9,
        oportunidadeId: null,
        valor: null,
        descricao: "",
        condicoesPagamento: "",
        prazoEntrega: "",
        arquivoUrl: null,
      })
    })
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/propostas/7")
  })

  it("cria proposta avulsa (sem vínculo) via POST", async () => {
    renderPage(<NovaPropostaPage />)
    await screen.findByRole("heading", { name: "Nova Proposta" })

    fireEvent.click(screen.getByRole("button", { name: /Avulso/i }))
    fireEvent.change(screen.getByPlaceholderText("Ex: Proposta Comercial - Tecido X"), {
      target: { value: "Proposta Avulsa Teste" },
    })

    expect(screen.getByRole("button", { name: "Criar Proposta" })).toBeEnabled()
    fireEvent.click(screen.getByRole("button", { name: "Criar Proposta" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/propostas", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({
        titulo: "Proposta Avulsa Teste",
        empresaId: null,
        clienteId: null,
        oportunidadeId: null,
        valor: null,
        descricao: "",
        condicoesPagamento: "",
        prazoEntrega: "",
        arquivoUrl: null,
      })
    })
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/propostas/7")
  })
})
