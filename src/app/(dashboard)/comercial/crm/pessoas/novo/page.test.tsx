// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import NovaPessoaPage from "./page"
import { createFetchMock, renderPage, findCall, toastMock, navMock } from "@/test/harness"

describe("NovaPessoaPage", () => {
  let fetchMock: ReturnType<typeof createFetchMock>

  beforeEach(() => {
    const handler = ({ method, url }: { method: string; url: string }) => {
      if (method === "GET" && url === "/api/crm/estados") {
        return { json: [{ id: 35, uf: "SP", nome: "São Paulo" }] }
      }
      if (method === "GET" && url === "/api/crm/cidades?estadoId=35") {
        return { json: [{ id: 1, nome: "São Paulo", estadoId: 35 }] }
      }
      if (method === "POST" && url === "/api/crm/pessoas") {
        return { json: { id: 5 } }
      }
      if (method === "GET" && url.startsWith("/api/representantes?q=")) {
        return { json: [{ id: 1, nome: "Carlos Representante" }] }
      }
      if (method === "POST" && url === "/api/crm/pessoas/5/representantes") {
        return { json: { id: 9 } }
      }
      return { json: null }
    }
    fetchMock = createFetchMock(handler)
    vi.stubGlobal("fetch", fetchMock.fn)
  })

  it("renderiza o formulário com Pessoa Jurídica padrão", async () => {
    renderPage(<NovaPessoaPage />)

    expect(await screen.findByRole("heading", { name: "Nova Pessoa (Negócio)" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Pessoa Jurídica" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Pessoa Física" })).toBeInTheDocument()
    expect(screen.getByText(/Razão Social/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText("00.000.000/0000-00")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument()
  })

  it("valida Razão Social (PJ) e Nome (PF) obrigatórios", async () => {
    const { container } = renderPage(<NovaPessoaPage />)
    await screen.findByRole("heading", { name: "Nova Pessoa (Negócio)" })

    const form = container.querySelector("form")!
    fireEvent.submit(form)
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Razão Social é obrigatória"))

    fireEvent.click(screen.getByRole("button", { name: "Pessoa Física" }))
    fireEvent.submit(form)
    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome é obrigatório"))
  })

  it("cria pessoa jurídica via POST com UF e cidade", async () => {
    const { container } = renderPage(<NovaPessoaPage />)
    await screen.findByRole("heading", { name: "Nova Pessoa (Negócio)" })

    const textboxes = screen.getAllByRole("textbox")
    fireEvent.change(textboxes[0], { target: { value: "Tecelagem Beta Ltda" } })
    fireEvent.change(textboxes[1], { target: { value: "Beta Confecções" } })
    fireEvent.change(textboxes[2], { target: { value: "12.345.678/0001-90" } })
    fireEvent.change(textboxes[3], { target: { value: "Têxtil" } })
    fireEvent.change(textboxes[7], { target: { value: "contato@beta.com" } })

    const comboboxes = screen.getAllByRole("combobox")
    fireEvent.change(comboboxes[0], { target: { value: "ME" } })
    fireEvent.change(comboboxes[1], { target: { value: "SP" } })

    await waitFor(() => expect(screen.getByRole("option", { name: "São Paulo" })).toBeInTheDocument())
    const comboboxesApos = screen.getAllByRole("combobox")
    fireEvent.change(comboboxesApos[2], { target: { value: "São Paulo" } })

    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/pessoas", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({
        tipoPessoa: "PJ",
        nome: "",
        cpf: "",
        razaoSocial: "Tecelagem Beta Ltda",
        nomeFantasia: "Beta Confecções",
        cnpj: "12.345.678/0001-90",
        segmento: "Têxtil",
        porte: "ME",
        site: "",
        telefone: "",
        celular: "",
        email: "contato@beta.com",
        emailNf: "",
        endereco: "",
        numero: "",
        complemento: "",
        bairro: "",
        cidade: "São Paulo",
        uf: "SP",
        cep: "",
        observacoes: "",
      })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Pessoa cadastrada com sucesso"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/pessoas/5")
  })

  it("vincula representante e envia vínculo na criação", async () => {
    const { container } = renderPage(<NovaPessoaPage />)
    await screen.findByRole("heading", { name: "Nova Pessoa (Negócio)" })

    const search = screen.getByPlaceholderText("Buscar representante pelo nome...")
    fireEvent.change(search, { target: { value: "Carlos" } })

    fireEvent.click(await screen.findByText("Carlos Representante"))
    expect(screen.getByText("Carlos Representante")).toBeInTheDocument()

    const textboxes = screen.getAllByRole("textbox")
    fireEvent.change(textboxes[0], { target: { value: "Tecelagem Beta Ltda" } })
    fireEvent.submit(container.querySelector("form")!)

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/pessoas", "POST")
      expect(call).toBeDefined()
    })
    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/crm/pessoas/5/representantes", "POST")
      expect(call).toBeDefined()
      expect(call!.body).toEqual({ representanteId: 1 })
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Pessoa cadastrada com sucesso"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/crm/pessoas/5")
  })
})
