// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import RomaneiosPage from "./page"
import { createFetchMock, navMock, renderPage } from "@/test/harness"

const integracoes = [
  { id: 1, nome: "ERP Principal", baseUrl: "http://erp.local", tipoAuth: "token", telas: ["romaneios"] },
]

const rolos = [
  {
    romaneio: 22742,
    codigo_rolo: 101,
    produto: "SARJA",
    narrativa: "Rolo de sarja",
    lote: 1,
    lote_produto: "L1",
    quantidade: 1200,
    peso_bruto: 300,
    peso_liquido: 280,
    data_entrada: "2026-08-01",
    op: 55,
    nome_operador: "Carlos",
    largura: 1.5,
    gramatura: 200,
    endereco_rolo: "A-01",
    pedido: 7603,
    situacao: "EM EXPEDIÇÃO",
    emissao: "2026-08-01",
    entrega: "2026-08-05",
    chegada: null,
    cnpj: "11.222.333/0001-44",
    nome_cliente: "Tecelagem Silva",
    fantasia: "Silva Têxtil",
    cidade: "Americana",
    uf: "SP",
    nome_represenante: "João Rep",
    nome_regiao: "Campinas",
    linha: "SARJA",
    grupo: "CRU",
    sub: "1",
    cor: "BRANCA",
    vendido: 1,
    saldo: 0,
    unitario: 15,
    valor_vendido: 18000,
  },
]

function handler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/integracao/listar?tela=romaneios") {
      return { json: integracoes }
    }
    if (method === "GET" && url === "/api/integracao/1/executar") {
      return { json: { success: true, responseBody: { items: rolos } } }
    }
    return { status: 404, json: { error: "Rota não mockada" } }
  }
}

describe("RomaneiosPage", () => {
  beforeEach(() => {
    navMock.reset()
    navMock.setPathname("/documentos/romaneios")
  })

  it("renderiza o heading e as integrações configuradas", async () => {
    vi.stubGlobal("fetch", createFetchMock(handler()).fn)
    renderPage(<RomaneiosPage />)

    expect(screen.getByRole("heading", { name: "Romaneios de Expedição" })).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: "ERP Principal" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Carregar Todos/ })).toBeEnabled()
  })

  it("carrega os romaneios ao clicar em Carregar Todos", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<RomaneiosPage />)

    await screen.findByRole("button", { name: "ERP Principal" })
    fireEvent.click(screen.getByRole("button", { name: /Carregar Todos/ }))

    expect(await screen.findByText("Romaneio Nº 22742")).toBeInTheDocument()
    expect(screen.getByText("Tecelagem Silva")).toBeInTheDocument()
    expect(screen.getAllByText("1 rolo(s)").length).toBeGreaterThan(0)
    expect(fetchMock.calls.some((c) => c.url === "/api/integracao/1/executar")).toBe(true)
  })

  it("mostra estado vazio quando não há integrações", async () => {
    const empty = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/integracao/listar?tela=romaneios") {
        return { json: [] }
      }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", empty.fn)
    renderPage(<RomaneiosPage />)

    expect(
      await screen.findByText("Nenhuma integração configurada para romaneios")
    ).toBeInTheDocument()
  })
})
