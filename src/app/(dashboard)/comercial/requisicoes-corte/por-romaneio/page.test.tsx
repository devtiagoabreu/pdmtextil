// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from "vitest"
import { screen, fireEvent, waitFor, within } from "@testing-library/react"
import { createFetchMock, renderPage, findCall, navMock, toastMock } from "@/test/harness"
import RequisicaoPorRomaneioPage from "./page"

const rolos = [
  {
    romaneio: 22742,
    codigo_rolo: 1001,
    produto: "10.12345.678.9012.3",
    narrativa: "Fio poliéster",
    lote: 5,
    lote_produto: "L1",
    quantidade: 100,
    peso_bruto: 10,
    peso_liquido: 9,
    largura: 1.5,
    endereco_rolo: null,
    pedido: 7603,
    situacao: "EM_ESTOQUE",
    emissao: "2026-01-01",
    entrega: "2026-01-05",
    chegada: null,
    cnpj: "11.222.333/0001-44",
    nome_cliente: "Cliente A",
    fantasia: "Cliente A",
    cidade: "São Paulo",
    uf: "SP",
    nome_represenante: "Rep A",
    nome_regiao: "Sudeste",
    linha: "Linha 1",
    grupo: "Grupo 1",
    sub: "Sub 1",
    cor: "Preto",
  },
  {
    romaneio: 22742,
    codigo_rolo: 1002,
    produto: "10.12345.678.9012.3",
    narrativa: "Fio poliéster",
    lote: 5,
    lote_produto: "L1",
    quantidade: 50,
    peso_bruto: 5,
    peso_liquido: 4.5,
    largura: 1.5,
    endereco_rolo: null,
    pedido: 7603,
    situacao: "EM_ESTOQUE",
    emissao: "2026-01-01",
    entrega: "2026-01-05",
    chegada: null,
    cnpj: "11.222.333/0001-44",
    nome_cliente: "Cliente A",
    fantasia: "Cliente A",
    cidade: "São Paulo",
    uf: "SP",
    nome_represenante: "Rep A",
    nome_regiao: "Sudeste",
    linha: "Linha 1",
    grupo: "Grupo 1",
    sub: "Sub 1",
    cor: "Preto",
  },
]

function makeMock() {
  return createFetchMock(({ method, url }) => {
    if (method === "GET" && url.startsWith("/api/integracao/listar?tela=")) {
      return { json: [{ id: 1, nome: "ERP Romaneios", baseUrl: "https://api.example.com" }] }
    }
    if (method === "GET" && url === "/api/integracao/1/executar") {
      return { json: { success: true, responseBody: { items: rolos } } }
    }
    if (method === "POST" && url === "/api/comercial/requisicoes-corte") return { status: 201, json: { id: 33 } }
    return { status: 404, json: { error: "Rota não mockada" } }
  })
}

describe("RequisicaoPorRomaneioPage", () => {
  beforeEach(() => {
    navMock.setPathname("/comercial/requisicoes-corte/por-romaneio")
  })

  it("renderiza a página com a integração e o estado inicial", async () => {
    const fetchMock = makeMock()
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<RequisicaoPorRomaneioPage />)

    expect(screen.getByRole("heading", { name: /Requisição de Corte por Romaneio/ })).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: "ERP Romaneios" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Carregar Todos/ })).toBeInTheDocument()
    expect(await screen.findByText("Carregue os romaneios para criar requisições de corte")).toBeInTheDocument()
  })

  it("carrega os romaneios e cria uma requisição de corte", async () => {
    const fetchMock = makeMock()
    vi.stubGlobal("fetch", fetchMock.fn)

    renderPage(<RequisicaoPorRomaneioPage />)
    fireEvent.click(await screen.findByRole("button", { name: /Carregar Todos/ }))

    expect(await screen.findByRole("heading", { name: "Romaneio Nº 22742" })).toBeInTheDocument()
    expect(screen.getByText("2 rolo(s)")).toBeInTheDocument()
    expect(screen.getByText("Pedido 7603")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: "Requisição de Corte" }))

    const dialog = await screen.findByRole("dialog", { name: "Nova Requisição de Corte" })
    expect(within(dialog).getByText("10.12345.678.9012.3")).toBeInTheDocument()
    fireEvent.change(within(dialog).getByDisplayValue("150"), { target: { value: "80" } })
    fireEvent.click(within(dialog).getByRole("button", { name: /Criar Requisição de Corte/ }))

    await waitFor(() => {
      const call = findCall(fetchMock.calls, "/api/comercial/requisicoes-corte", "POST")
      expect(call).toBeDefined()
      expect(call!.body.itens).toHaveLength(1)
      expect(call!.body.itens[0].codigoProduto).toBe("10.12345.678.9012.3")
      expect(call!.body.itens[0].ordem).toBe("12345")
      expect(call!.body.itens[0].quantidade).toBe("80")
      expect(call!.body.observacoes).toBe("Criado a partir do Romaneio Nº 22742")
    })
    await waitFor(() => expect(toastMock.success).toHaveBeenCalledWith("Requisição de corte #33 criada com sucesso!"))
    expect(navMock.router.push).toHaveBeenCalledWith("/comercial/requisicoes-corte/33")
  })
})
