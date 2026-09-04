// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent } from "@testing-library/react"
import ConferenciaOpTecidoCruPage from "./page"
import { createFetchMock, navMock, renderPage } from "@/test/harness"

const integracoes = [
  {
    id: 1,
    nome: "Estoques Rolos Nível 2",
    baseUrl: "http://erp.local/rolos",
    tipoAuth: "oauth2",
    telas: ["conferencia-op-tecido-cru"],
  },
]

const rolos = [
  {
    OP: 12345,
    NIVEL: "3",
    GRUPO: "1",
    SUB: "2",
    CODIGO_ROLO: 1001,
    DEP: "T2",
    ENDERECO_ROLO: "A-01",
    SIT: "EM ESTOQUE",
    ITEM: "SARJA 1001",
    LOTE_PRODUTO: "LP1",
    QUANTIDADE: 1200.5,
    PESO_BRUTO: 300.25,
    NOME_OPERADOR: "Carlos",
    DATA_INSERCAO: "2026-08-01T10:00:00",
    PEDIDO: 7603,
    ROMANEIO: null,
  },
  {
    OP: 12345,
    NIVEL: "3",
    GRUPO: "1",
    SUB: "2",
    CODIGO_ROLO: 1002,
    DEP: "T2",
    ENDERECO_ROLO: "A-02",
    SIT: "EM ESTOQUE",
    ITEM: "SARJA 1001",
    LOTE: "L123",
    LOTE_PRODUTO: "LP1",
    QUANTIDADE: 800.0,
    PESO_BRUTO: 200.0,
    NOME_OPERADOR: "Carlos",
    DATA_INSERCAO: "2026-08-01T11:00:00",
    PEDIDO: 7603,
    ROMANEIO: 900,
  },
  {
    OP: 99999,
    NIVEL: "2",
    GRUPO: "4",
    CODIGO_ROLO: 2001,
    DEP: "T1",
    ENDERECO_ROLO: "B-01",
    SIT: "EM ESTOQUE",
    ITEM: "Brim 2002",
    LOTE_PRODUTO: "LP2",
    QUANTIDADE: 500.0,
    PESO_BRUTO: 125.0,
    NOME_OPERADOR: "Ana",
    DATA_INSERCAO: "2026-08-02T09:00:00",
    PEDIDO: 8000,
    ROMANEIO: null,
  },
]

function handler() {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/integracao/listar?tela=conferencia-op-tecido-cru") {
      return { json: integracoes }
    }
    if (method === "GET" && url === "/api/integracao/1/executar") {
      return { json: { success: true, responseBody: { items: rolos } } }
    }
    return { status: 404, json: { error: "Rota não mockada" } }
  }
}

describe("ConferenciaOpTecidoCruPage", () => {
  beforeEach(() => {
    navMock.reset()
    navMock.setPathname("/documentos/conferencia-op-tecido-cru")
  })

  it("renderiza o heading, a integração e o botão de leitura de código de barras", async () => {
    vi.stubGlobal("fetch", createFetchMock(handler()).fn)
    renderPage(<ConferenciaOpTecidoCruPage />)

    expect(
      screen.getByRole("heading", { name: /Conferência de OP de Tecelagem/ }),
    ).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: "Estoques Rolos Nível 2" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Ler código de barras/ })).toBeEnabled()
    expect(screen.getByRole("button", { name: /Carregar Todas/ })).toBeEnabled()
  })

  it("carrega os rolos ao clicar em Carregar Todas e agrupa por OP", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ConferenciaOpTecidoCruPage />)

    await screen.findByRole("button", { name: "Estoques Rolos Nível 2" })
    fireEvent.click(screen.getByRole("button", { name: /Carregar Todas/ }))

    expect(await screen.findByRole("heading", { name: /OP 12345/ })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: /OP 99999/ })).toBeInTheDocument()
    expect(screen.getAllByText("2 rolo(s)").length).toBeGreaterThan(0)
    expect(fetchMock.calls.some((c) => c.url === "/api/integracao/1/executar")).toBe(true)
  })

  it("filtra os rolos pela OP digitada", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ConferenciaOpTecidoCruPage />)

    await screen.findByRole("button", { name: "Estoques Rolos Nível 2" })
    fireEvent.click(screen.getByRole("button", { name: /Carregar Todas/ }))
    await screen.findByRole("heading", { name: /OP 12345/ })

    fireEvent.change(screen.getByPlaceholderText(/OP 12345 ou rolo 1001/), { target: { value: "99999" } })
    fireEvent.click(screen.getByRole("button", { name: /Buscar/ }))

    expect(await screen.findByRole("heading", { name: /OP 99999/ })).toBeInTheDocument()
    expect(screen.getByText(/Filtrando por "99999"/)).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /OP 12345/ })).not.toBeInTheDocument()
  })

  it("filtra os rolos pelo número do rolo", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ConferenciaOpTecidoCruPage />)

    await screen.findByRole("button", { name: "Estoques Rolos Nível 2" })
    fireEvent.click(screen.getByRole("button", { name: /Carregar Todas/ }))
    await screen.findByRole("heading", { name: /OP 12345/ })

    fireEvent.change(screen.getByPlaceholderText(/OP 12345 ou rolo 1001/), { target: { value: "1002" } })
    fireEvent.click(screen.getByRole("button", { name: /Buscar/ }))

    expect(await screen.findByRole("heading", { name: /OP 12345/ })).toBeInTheDocument()
    expect(screen.getByText(/Filtrando por "1002" — 1 de 3 rolo\(s\)/)).toBeInTheDocument()
    expect(screen.queryByRole("heading", { name: /OP 99999/ })).not.toBeInTheDocument()
  })

  it("ordena as OPs por padrão de forma decrescente (maior primeiro)", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ConferenciaOpTecidoCruPage />)

    await screen.findByRole("button", { name: "Estoques Rolos Nível 2" })
    fireEvent.click(screen.getByRole("button", { name: /Carregar Todas/ }))

    await screen.findByRole("heading", { name: /OP 12345/ })
    const ops = screen
      .getAllByRole("heading")
      .map((h) => h.textContent?.trim() ?? "")
      .filter((t) => /^OP /.test(t))
    expect(ops).toEqual(["OP 99999", "OP 12345"])
    const select = screen.getByLabelText("Ordenar por OP") as HTMLSelectElement
    expect(select.value).toBe("desc")
  })

  it("permite alternar a ordenação para OP crescente", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ConferenciaOpTecidoCruPage />)

    await screen.findByRole("button", { name: "Estoques Rolos Nível 2" })
    fireEvent.click(screen.getByRole("button", { name: /Carregar Todas/ }))
    await screen.findByRole("heading", { name: /OP 12345/ })

    fireEvent.change(screen.getByLabelText("Ordenar por OP"), { target: { value: "asc" } })

    const ops = screen
      .getAllByRole("heading")
      .map((h) => h.textContent?.trim() ?? "")
      .filter((t) => /^OP /.test(t))
    expect(ops).toEqual(["OP 12345", "OP 99999"])
  })

  it("mostra o produto (nivel.grupo.sub.item) concatenado no cabeçalho da OP", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ConferenciaOpTecidoCruPage />)

    await screen.findByRole("button", { name: "Estoques Rolos Nível 2" })
    fireEvent.click(screen.getByRole("button", { name: /Carregar Todas/ }))

    expect(await screen.findByText("3.1.2.SARJA 1001")).toBeInTheDocument()
    expect(screen.getByText("2.4.Brim 2002")).toBeInTheDocument()
  })

  it("listagem exibe situacao, deposito, lote e lote produto, sem a coluna Item", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<ConferenciaOpTecidoCruPage />)

    await screen.findByRole("button", { name: "Estoques Rolos Nível 2" })
    fireEvent.click(screen.getByRole("button", { name: /Carregar Todas/ }))
    await screen.findByRole("heading", { name: /OP 12345/ })

    expect(screen.getByRole("columnheader", { name: /Situação/ })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: /Depósito/ })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: /Endereço/ })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: /^Lote$/ })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Lote Prod." })).toBeInTheDocument()
    expect(screen.queryByRole("columnheader", { name: "Item" })).not.toBeInTheDocument()

    expect(screen.getAllByText("EM ESTOQUE").length).toBeGreaterThan(0)
    expect(screen.getAllByText("T2").length).toBeGreaterThan(0)
    expect(screen.getByText("L123")).toBeInTheDocument()
  })

  it("mostra estado vazio quando não há integrações", async () => {
    const empty = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/integracao/listar?tela=conferencia-op-tecido-cru") {
        return { json: [] }
      }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", empty.fn)
    renderPage(<ConferenciaOpTecidoCruPage />)

    expect(
      await screen.findByText("Nenhuma integração configurada para conferência de OP"),
    ).toBeInTheDocument()
  })
})
