// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import NovaVisitaPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

vi.mock("next-auth/react", () => ({
  useSession: () => ({ data: { user: { role: "ADMIN" } } }),
}))

describe("NovaVisitaPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/pessoas") {
        return { json: [{ id: 1, razaoSocial: "Tecelagem Alpha" }] }
      }
      if (method === "GET" && url === "/api/crm/oportunidades") {
        return { json: [{ id: 3, titulo: "Oportunidade Expansão", empresaId: 1 }] }
      }
      if (method === "GET" && url === "/api/clientes") {
        return { json: [{ id: 5, nome: "Confecções Lima" }] }
      }
      if (method === "GET" && url === "/api/crm/estados") {
        return { json: [{ id: 35, uf: "SP", nome: "São Paulo" }] }
      }
      if (method === "GET" && url === "/api/crm/viagens?all=true") {
        return { json: [] }
      }
      if (method === "GET" && url.startsWith("/api/crm/contatos?clienteId=")) {
        return { json: [{ id: 9, nome: "Ana Silva" }] }
      }
      if (method === "POST" && url === "/api/crm/contatos") {
        return { json: { id: 9, nome: "Ana Silva" } }
      }
      if (method === "POST" && url === "/api/crm/visitas") {
        return { json: { id: 1, total: 1 } }
      }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("renderiza o seletor de tipo de entidade", async () => {
    renderPage(<NovaVisitaPage />)

    expect(await screen.findByRole("heading", { name: "Nova Visita" })).toBeInTheDocument()
    expect(screen.getByText("Quem você vai visitar?")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Cliente/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Pessoa/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /^Avulsa/ })).toBeInTheDocument()
  })

  it("volta ao seletor ao clicar em Trocar", async () => {
    renderPage(<NovaVisitaPage />)
    await screen.findByRole("heading", { name: "Nova Visita" })

    fireEvent.click(screen.getByRole("button", { name: /^Pessoa/ }))
    expect(await screen.findByText("Visitando Pessoa (Negócio)")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Trocar" }))

    expect(screen.getByText("Quem você vai visitar?")).toBeInTheDocument()
    expect(screen.queryByText("Visitando Pessoa (Negócio)")).not.toBeInTheDocument()
  })

  it("valida nome obrigatório para visita avulsa", async () => {
    const { container } = renderPage(<NovaVisitaPage />)
    await screen.findByRole("heading", { name: "Nova Visita" })

    fireEvent.click(screen.getByRole("button", { name: /^Avulsa/ }))
    expect(await screen.findByText("Visita Avulsa")).toBeInTheDocument()

    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome é obrigatório para visita avulsa"))
  })

  it("valida pessoa obrigatória", async () => {
    const { container } = renderPage(<NovaVisitaPage />)
    await screen.findByRole("heading", { name: "Nova Visita" })

    fireEvent.click(screen.getByRole("button", { name: /^Pessoa/ }))
    expect(await screen.findByText("Visitando Pessoa (Negócio)")).toBeInTheDocument()

    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Pessoa é obrigatória"))
  })

  it("valida cliente obrigatório", async () => {
    const { container } = renderPage(<NovaVisitaPage />)
    await screen.findByRole("heading", { name: "Nova Visita" })

    fireEvent.click(screen.getByRole("button", { name: /^Cliente/ }))
    expect(await screen.findByText("Visitando Cliente")).toBeInTheDocument()

    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Cliente é obrigatório"))
  })

  it("cria visita avulsa via POST e navega para a lista", async () => {
    const { container } = renderPage(<NovaVisitaPage />)
    await screen.findByRole("heading", { name: "Nova Visita" })

    fireEvent.click(screen.getByRole("button", { name: /^Avulsa/ }))
    expect(await screen.findByText("Visita Avulsa")).toBeInTheDocument()

    fireEvent.change(screen.getByPlaceholderText("Ex: José da Silva ou Árbora Têxtil"), {
      target: { value: "José da Silva" },
    })
    fireEvent.change(screen.getAllByRole("combobox")[1], { target: { value: "30" } })

    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/visitas", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({
        empresaId: null,
        clienteId: null,
        nomeAvulso: "José da Silva",
        oportunidadeId: null,
        contatoId: null,
        representanteId: null,
        representanteNome: null,
        propostaId: null,
        dataVisita: expect.any(String),
        hora: null,
        tipo: "PRESENCIAL",
        endereco: null,
        numero: null,
        complemento: null,
        bairro: null,
        cidade: null,
        uf: null,
        cep: null,
        relato: null,
        duracaoEstimada: 30,
        viagemId: null,
        fotos: [],
      })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Visita criada com sucesso"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/visitas")
  })

  it("criar contato via quick create NAO salva a visita nem navega", async () => {
    renderPage(<NovaVisitaPage />)
    await screen.findByRole("heading", { name: "Nova Visita" })

    fireEvent.click(screen.getByRole("button", { name: /^Cliente/ }))
    await screen.findByText("Visitando Cliente")

    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "5" } })
    await waitFor(() =>
      expect(findCall(fetchMock.calls, "/api/crm/contatos?clienteId=5", "GET")).toBeDefined()
    )

    fireEvent.click(screen.getByTitle("Cadastrar novo contato"))
    const dialog = await screen.findByRole("dialog")
    expect(within(dialog).getByRole("heading", { name: "Novo Contato" })).toBeInTheDocument()

    fireEvent.change(within(dialog).getAllByRole("textbox")[0], { target: { value: "Ana Silva" } })
    fireEvent.click(within(dialog).getByRole("button", { name: /^Criar$/ }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/contatos", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({
        nome: "Ana Silva",
        cargo: null,
        email: null,
        celular: null,
        clienteId: 5,
      })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Contato criado com sucesso"))

    await waitFor(() =>
      expect(screen.getAllByRole("combobox").some(c => (c as HTMLSelectElement).value === "9")).toBe(true)
    )
    const visitaCall = findCall(fetchMock.calls, "/api/crm/visitas", "POST")
    expect(visitaCall).toBeUndefined()
    expect(navMock.router.push).not.toHaveBeenCalled()
  })

  function novoHandler(propostas: any[]) {
    return ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/pessoas") {
        return { json: [{ id: 1, razaoSocial: "Tecelagem Alpha" }] }
      }
      if (method === "GET" && url === "/api/clientes") {
        return { json: [{ id: 5, nome: "Confecções Lima" }] }
      }
      if (method === "GET" && url === "/api/crm/oportunidades") {
        return {
          json: [
            { id: 3, titulo: "Oportunidade Expansão", empresaId: 1, clienteId: null },
            { id: 7, titulo: "Oportunidade Confecções", empresaId: null, clienteId: 5 },
          ],
        }
      }
      if (method === "GET" && url === "/api/crm/viagens?all=true") {
        return { json: [] }
      }
      if (method === "GET" && url === "/api/crm/estados") {
        return { json: [{ id: 35, uf: "SP", nome: "São Paulo" }] }
      }
      if (method === "GET" && url === "/api/crm/cidades?estadoId=35") {
        return { json: [{ id: 1, nome: "São Paulo", estadoId: 35 }] }
      }
      if (method === "GET" && url.includes("/api/crm/propostas")) {
        return { json: propostas }
      }
      return { json: null }
    }
  }

  it("carrega as propostas pelo título no dropdown de proposta vinculada", async () => {
    const mock = createFetchMock(novoHandler([{ id: 10, titulo: "Orçamento Tecido", oportunidadeId: 3 }]))
    vi.stubGlobal("fetch", mock.fn)
    renderPage(<NovaVisitaPage />)

    await screen.findByRole("heading", { name: "Nova Visita" })
    fireEvent.click(screen.getByRole("button", { name: /^Pessoa/ }))
    await screen.findByText("Visitando Pessoa (Negócio)")

    fireEvent.change(screen.getByPlaceholderText("Buscar proposta..."), { target: { value: "orç" } })

    expect(await screen.findByRole("option", { name: "Orçamento Tecido" })).toBeInTheDocument()
  })

  it("ao selecionar uma proposta preenche a oportunidade da proposta na visita", async () => {
    const mock = createFetchMock(novoHandler([{ id: 10, titulo: "Orçamento Tecido", oportunidadeId: 3 }]))
    vi.stubGlobal("fetch", mock.fn)
    renderPage(<NovaVisitaPage />)

    await screen.findByRole("heading", { name: "Nova Visita" })
    fireEvent.click(screen.getByRole("button", { name: /^Pessoa/ }))
    await screen.findByText("Visitando Pessoa (Negócio)")

    fireEvent.change(screen.getByPlaceholderText("Buscar proposta..."), { target: { value: "orç" } })
    fireEvent.click(await screen.findByRole("option", { name: "Orçamento Tecido" }))

    await waitFor(() =>
      expect(
        screen.getAllByRole("combobox").some(c => c.tagName === "SELECT" && (c as HTMLSelectElement).value === "3")
      ).toBe(true)
    )
  })

  it("ao selecionar uma oportunidade filtra as propostas daquela oportunidade", async () => {
    const mock = createFetchMock(novoHandler([{ id: 10, titulo: "Orçamento Tecido", oportunidadeId: 3 }]))
    vi.stubGlobal("fetch", mock.fn)
    renderPage(<NovaVisitaPage />)

    await screen.findByRole("heading", { name: "Nova Visita" })
    fireEvent.click(screen.getByRole("button", { name: /^Pessoa/ }))
    await screen.findByText("Visitando Pessoa (Negócio)")

    const opSelect = screen.getAllByRole("combobox").find(
      (c) => c.tagName === "SELECT" && Array.from((c as HTMLSelectElement).options).some(o => o.textContent === "Oportunidade Expansão")
    ) as HTMLSelectElement
    fireEvent.change(opSelect, { target: { value: "3" } })

    fireEvent.change(screen.getByPlaceholderText("Buscar proposta..."), { target: { value: "orç" } })

    await waitFor(() => {
      const call = findCall(mock.calls, "/api/crm/propostas?oportunidadeId=3&q=or%C3%A7&limit=20", "GET")
      expect(call).toBeDefined()
    })
  })

  it("mostra o campo Oportunidade também para visitas a Cliente (filtrado pelo cliente)", async () => {
    const mock = createFetchMock(novoHandler([]))
    vi.stubGlobal("fetch", mock.fn)
    renderPage(<NovaVisitaPage />)

    await screen.findByRole("heading", { name: "Nova Visita" })
    fireEvent.click(screen.getByRole("button", { name: /^Cliente/ }))
    await screen.findByText("Visitando Cliente")

    fireEvent.change(screen.getAllByRole("combobox")[0], { target: { value: "5" } })

    expect(await screen.findByRole("option", { name: "Oportunidade Confecções" })).toBeInTheDocument()
    expect(screen.queryByRole("option", { name: "Oportunidade Expansão" })).not.toBeInTheDocument()
  })
})
