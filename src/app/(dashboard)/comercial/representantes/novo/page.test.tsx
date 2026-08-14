// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent, waitFor } from "@testing-library/react"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"
import NovoRepresentantePage from "./page"

describe("NovoRepresentantePage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/representantes/novo")
  })

  it("renderiza o formulário de criação", () => {
    const fetchMock = createFetchMock(() => ({ json: {} }))
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<NovoRepresentantePage />)

    expect(screen.getByRole("heading", { name: /Novo Representante/ })).toBeInTheDocument()
    expect(screen.getByPlaceholderText("Ex: Representações ABC")).toBeInTheDocument()
    expect(screen.getByPlaceholderText("00.000.000/0001-00")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Salvar Representante" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Consultar/ })).toBeInTheDocument()
    expect(screen.getByText(/Clientes Vinculados/)).toBeInTheDocument()
    expect(screen.getByText(/Gerente Responsável/)).toBeInTheDocument()
  })

  it("valida os campos obrigatórios antes de salvar", async () => {
    const fetchMock = createFetchMock(() => ({ json: {} }))
    vi.stubGlobal("fetch", fetchMock.fn)

    const ui = renderPage(<NovoRepresentantePage />)
    fireEvent.submit(ui.container.querySelector("form")!)

    await waitFor(() => expect(toastMock.error).toHaveBeenCalledWith("Nome fantasia é obrigatório"))
    expect(findCall(fetchMock.calls, "/api/representantes", "POST")).toBeUndefined()
  })

  it("consulta CNPJ e preenche os dados automaticamente", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/crm/consulta-cnpj?cnpj=11222333000144") {
        return {
          json: {
            apiData: {
              razao_social: "Tecelagem LTDA",
              nome_fantasia: "Tecelagem",
              logradouro: "Rua das Malhas, 100",
              municipio: "Americana",
              uf: "SP",
              situacao_cadastral: "ATIVA",
            },
            crmPessoas: [],
            clientes: [],
            representantes: [],
          },
        }
      }
      return { json: {} }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<NovoRepresentantePage />)
    fireEvent.change(screen.getByPlaceholderText("00.000.000/0001-00"), { target: { value: "11222333000144" } })
    fireEvent.click(screen.getByRole("button", { name: /Consultar/ }))

    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Dados preenchidos automaticamente"))
    expect(screen.getByDisplayValue("11.222.333/0001-44")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Tecelagem LTDA")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Rua das Malhas, 100")).toBeInTheDocument()
    expect(screen.getByDisplayValue("Americana")).toBeInTheDocument()
    expect(screen.getByDisplayValue("SP")).toBeInTheDocument()
  })

  it("cria representante via POST com gerente e clientes vinculados e redireciona para a lista", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/usuarios/ativos?role=COMERCIAL,ADMIN,SUDO") {
        return { json: [{ id: 3, name: "Ana Vendas" }, { id: 1, name: "Tiago" }] }
      }
      if (method === "GET" && url === "/api/clientes?q=Tecelagem") {
        return { json: [{ id: 9, nome: "Tecelagem Beta", cnpj: "11.222.333/0001-44" }] }
      }
      if (method === "POST" && url === "/api/representantes") return { status: 201, json: { id: 99 } }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<NovoRepresentantePage />)
    fireEvent.change(screen.getByPlaceholderText("Ex: Representações ABC"), { target: { value: "Rep Teste" } })
    fireEvent.change(screen.getByPlaceholderText("00.000.000/0001-00"), { target: { value: "11.222.333/0001-44" } })

    await waitFor(() => expect(screen.getByRole("option", { name: "Ana Vendas" })).toBeInTheDocument())
    const selects = screen.getAllByRole("combobox")
    fireEvent.change(selects[1], { target: { value: "3" } })

    const busca = screen.getByPlaceholderText("Buscar cliente pelo nome ou CNPJ...")
    fireEvent.change(busca, { target: { value: "Tecelagem" } })
    await waitFor(() => expect(screen.getByRole("button", { name: /Tecelagem Beta/ })).toBeInTheDocument())
    fireEvent.click(screen.getByRole("button", { name: /Tecelagem Beta/ }))
    expect(screen.getByText("Tecelagem Beta")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Salvar Representante" }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/representantes", "POST")
      expect(call).toBeDefined()
      expect(call!.body.nome).toBe("Rep Teste")
      expect(call!.body.cnpj).toBe("11.222.333/0001-44")
      expect(call!.body.gerenteId).toBe(3)
      expect(call!.body.clientesIds).toEqual([9])
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Representante cadastrado com sucesso!"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/representantes")
  })
})
