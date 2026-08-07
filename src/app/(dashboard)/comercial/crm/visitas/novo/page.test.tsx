// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
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
        fotos: [],
      })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Visita criada com sucesso"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/visitas")
  })
})
