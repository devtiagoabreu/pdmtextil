// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { screen, fireEvent, within } from "@testing-library/react"
import NfeCtePage from "./page"
import { createFetchMock, findCall, navMock, renderPage, toastMock } from "@/test/harness"

const integracoes = [
  {
    id: 7,
    nome: "api_rel_nfe_cte_periodo",
    baseUrl: "https://systextil.local/api_rel_nfe_cte_periodo",
    tipoAuth: "oauth2",
    telas: ["nfe-cte"],
  },
]

const hoje = new Date()
const dentroDoPeriodoPadrao = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 15, 12)
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const br = (d: Date) =>
  `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`

function menosDoisMeses(d: Date): Date {
  const alvo = new Date(d.getFullYear(), d.getMonth() - 2, 1, 12)
  const ultimoDia = new Date(alvo.getFullYear(), alvo.getMonth() + 1, 0, 12).getDate()
  return new Date(alvo.getFullYear(), alvo.getMonth(), Math.min(d.getDate(), ultimoDia), 12)
}

const dentroDoPeriodo = {
  cte_numero: 195476,
  cte_serie: "1",
  cte_data: br(dentroDoPeriodoPadrao),
  cte_valor_total: 131.7,
  cte_transportadora_fantasia: "SORRISO TRANSPORTES",
  cte_tomador_fantasia: "SORRISO TRANSPORTES",
  cte_situacao: 4,
  nf_numero: 35832,
  nf_serie: "1",
  nf_data: br(dentroDoPeriodoPadrao),
  nf_valor_total: 20737.52,
  pct_nf_no_total_cte: 24.76,
  nf_fornecedor_razao: "SEMEAR ECOTEXTIL LTDA",
  nf_fornecedor_fantasia: "PGFIOS",
}

const foraDoPeriodo = {
  cte_numero: 100,
  cte_serie: "1",
  cte_data: "01/01/2020",
  cte_valor_total: 50,
  cte_transportadora_fantasia: "JADLOG",
  cte_tomador_fantasia: "JADLOG",
  nf_numero: 1,
  nf_serie: "1",
  nf_data: "01/01/2020",
  nf_valor_total: 50,
  nf_fornecedor_razao: "FORNECEDOR X",
}

const segundaNfDoMesmoCte = {
  cte_numero: 195476,
  cte_serie: "1",
  cte_data: br(dentroDoPeriodoPadrao),
  cte_valor_total: 131.7,
  cte_transportadora_fantasia: "SORRISO TRANSPORTES",
  cte_tomador_fantasia: "SORRISO TRANSPORTES",
  cte_situacao: 4,
  nf_numero: 35840,
  nf_serie: "1",
  nf_data: br(dentroDoPeriodoPadrao),
  nf_valor_total: 41299.74,
  pct_nf_no_total_cte: 75.24,
  nf_fornecedor_razao: "SEMEAR ECOTEXTIL LTDA",
  nf_fornecedor_fantasia: "PGFIOS",
}

const semValores = {
  cte_numero: 195477,
  cte_serie: "1",
  cte_data: br(dentroDoPeriodoPadrao),
  cte_valor_total: 79.32,
  cte_transportadora_fantasia: "SORRISO TRANSPORTES",
  cte_tomador_fantasia: "SORRISO TRANSPORTES",
  nf_numero: 35835,
  nf_serie: "1",
  nf_data: null,
  nf_valor_total: null,
  nf_cab_origem: "SEM_CABECALHO",
}

const comCliente = {
  cte_numero: 195478,
  cte_serie: "1",
  cte_data: br(dentroDoPeriodoPadrao),
  cte_valor_total: 160,
  cte_transportadora_fantasia: "SORRISO TRANSPORTES",
  cte_tomador_fantasia: "SORRISO TRANSPORTES",
  cte_situacao: 4,
  nf_numero: 12600,
  nf_serie: "1",
  nf_data: br(dentroDoPeriodoPadrao),
  nf_valor_total: 7690,
  soma_nf_do_cte: 7690,
  pct_nf_no_total_cte: 100,
  nf_cliente_razao: "PH TECNICA COMERCIO E REPRESENTACOES LTDA",
  nf_cliente_fantasia: "PH TECNICA",
  nf_fornecedor_razao: "PH TECNICA COMERCIO E REPRESENTACOES LTDA",
  nf_fornecedor_fantasia: "PH TECNICA",
  nf_cab_origem: "CNPJ_FORNECEDOR",
}

// Linha real devolvida pelo endpoint v3: CT-e 195477 / NF 35835. A nota é
// prevista (não existe no fiscal) mas tem cota de frete rateada.
const comRateio = {
  cte_numero: 195477,
  cte_serie: "1",
  cte_data: br(dentroDoPeriodoPadrao),
  cte_data_transacao: br(dentroDoPeriodoPadrao),
  cte_valor_total: 79.32,
  cte_valor_frete: 0,
  cte_natureza: 119,
  cte_tipo_conhecimento: 3,
  cte_cod_cidade_origem: 7702,
  cte_cod_cidade_destino: 8606,
  cte_situacao: 4,
  cte_transportadora_fantasia: "SORRISO TRANSPORTES",
  cte_tomador_fantasia: "SORRISO TRANSPORTES",
  soma_rateio_do_cte: 79.32,
  nf_numero: 35835,
  nf_serie: "1",
  nf_data: null,
  nf_valor_total: null,
  nf_cab_origem: "SEM_CABECALHO",
  nf_item_qtd: 1,
  nf_item_qtd_total: 1,
  nf_item_unidade: "UN",
  nf_item_descricoes: "SERVICOS FRETES COMPRAS",
  nf_item_valor_total: 79.32,
  nf_item_icms: 9.52,
  nf_pct_rateio_no_cte: 100,
  nf_valor_origem: "RATEIO_CTE",
}

// Linha real devolvida pela v3.1b: mesma NF 35835, agora com os campos de
// ordem de despacho. A NF existe no fiscal e tem pedido de romaneio válido.
const comDespacho = {
  cte_numero: 195477,
  cte_serie: "1",
  cte_data: br(dentroDoPeriodoPadrao),
  cte_valor_total: 79.32,
  cte_transportadora_fantasia: "SORRISO TRANSPORTES",
  cte_tomador_fantasia: "SORRISO TRANSPORTES",
  soma_rateio_do_cte: 79.32,
  nf_numero: 35835,
  nf_serie: "1",
  nf_data: br(dentroDoPeriodoPadrao),
  nf_valor_total: 4730,
  nf_cliente_razao: "PH TECNICA COMERCIO E REPRESENTACOES LTDA",
  nf_cliente_fantasia: "PH TECNICA",
  nf_cab_origem: "CNPJ_CLIENTE_NF",
  nf_item_valor_total: 79.32,
  nf_pct_rateio_no_cte: 100,
  nf_valor_origem: "CABECALHO_NF",
  nf_od_pedido: 8305,
  nf_od_data: br(dentroDoPeriodoPadrao),
  nf_od_valor: 4730,
  nf_od_cliente_fantasia: "PH TECNICA",
  nf_od_cidade: "SAO PAULO",
  nf_od_romaneio: 24795,
  nf_od_qtde_rolos: 3,
}

const comDoisItens = {
  cte_numero: 195480,
  cte_serie: "1",
  cte_data: br(dentroDoPeriodoPadrao),
  cte_valor_total: 165.56,
  cte_transportadora_fantasia: "SORRISO TRANSPORTES",
  cte_tomador_fantasia: "SORRISO TRANSPORTES",
  soma_rateio_do_cte: 165.56,
  nf_numero: 35843,
  nf_serie: "1",
  nf_data: null,
  nf_valor_total: null,
  nf_cab_origem: "SEM_CABECALHO",
  nf_item_qtd: 2,
  nf_item_qtd_total: 3,
  nf_item_unidade: "KG",
  nf_item_descricoes: "SERVICOS FRETES COMPRAS | SERVICOS FRETES VENDA",
  nf_item_valor_total: 165.56,
  nf_item_icms: 19.87,
  nf_pct_rateio_no_cte: 100,
  nf_valor_origem: "RATEIO_CTE",
}

// CT-e 351348/1: o rateio dos itens (917,34) não fecha com o total (199,99).
const rateioDivergenteA = {
  cte_numero: 351348,
  cte_serie: "1",
  cte_data: br(dentroDoPeriodoPadrao),
  cte_valor_total: 199.99,
  cte_transportadora_fantasia: "JADLOG",
  cte_tomador_fantasia: "JADLOG",
  soma_rateio_do_cte: 917.34,
  nf_numero: 31933,
  nf_serie: "1",
  nf_data: null,
  nf_valor_total: null,
  nf_cab_origem: "SEM_CABECALHO",
  nf_item_qtd: 1,
  nf_item_unidade: "UN",
  nf_item_descricoes: "SERVICOS FRETES COMPRAS",
  nf_item_valor_total: 717.35,
  nf_item_icms: 86.08,
  nf_pct_rateio_no_cte: 358.69,
  nf_valor_origem: "RATEIO_CTE",
}

const rateioDivergenteB = {
  ...rateioDivergenteA,
  nf_numero: 35653,
  nf_item_valor_total: 199.99,
  nf_item_icms: 24,
  nf_pct_rateio_no_cte: 100,
}

function handler(
  items: Record<string, unknown>[] = [dentroDoPeriodo, segundaNfDoMesmoCte, foraDoPeriodo, semValores]
) {
  return ({ method, url }: { method: string; url: string }) => {
    if (method === "GET" && url === "/api/integracao/listar?tela=nfe-cte") {
      return { json: integracoes }
    }
    if (method === "GET" && url.startsWith("/api/integracao/7/executar?limit=")) {
      return { json: { success: true, responseBody: { items } } }
    }
    return { status: 404, json: { error: "Rota não mockada" } }
  }
}

async function consultar(fetchMock: ReturnType<typeof createFetchMock>) {
  renderPage(<NfeCtePage />)
  await screen.findByRole("button", { name: "api_rel_nfe_cte_periodo" })
  fireEvent.click(screen.getByRole("button", { name: /Consultar/ }))
  return fetchMock
}

describe("NfeCtePage", () => {
  beforeEach(() => {
    navMock.reset()
    navMock.setPathname("/ferramentas/nfe-cte")
  })

  it("renderiza o heading e a integração configurada", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<NfeCtePage />)

    expect(screen.getByRole("heading", { name: /NF-e → CT-e por Período/ })).toBeInTheDocument()
    expect(await screen.findByRole("button", { name: "api_rel_nfe_cte_periodo" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Consultar/ })).toBeEnabled()
  })

  it("monta o período padrão com os últimos 2 meses", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<NfeCtePage />)

    await screen.findByRole("button", { name: "api_rel_nfe_cte_periodo" })

    expect(screen.getByLabelText("De")).toHaveValue(iso(menosDoisMeses(hoje)))
    expect(screen.getByLabelText("Até")).toHaveValue(iso(hoje))
  })

  it("estado vazio quando não há integração para a tela", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/integracao/listar?tela=nfe-cte") return { json: [] }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    renderPage(<NfeCtePage />)

    expect(
      await screen.findByText("Nenhuma integração configurada para nfe-cte")
    ).toBeInTheDocument()
  })

  it("pede os dados no proxy da integração ao consultar", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    await screen.findByText(/CT-e 195476/)
    expect(findCall(fetchMock.calls, "/api/integracao/7/executar?limit=20&offset=0")).toBeDefined()
  })

  it("agrupa as NF-e do mesmo CT-e em um único card", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    expect(await screen.findByText("CT-e 195476/1")).toBeInTheDocument()
    expect(screen.getByText("CT-e 195477/1")).toBeInTheDocument()
    expect(screen.queryByText("CT-e 195478/1")).not.toBeInTheDocument()
    expect(screen.getByText("2 NF-e")).toBeInTheDocument()
  })

  it("calcula no cliente a soma das NF-e e o percentual quando a API não devolve", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    const card = (await screen.findByText("CT-e 195476/1")).closest("div.rounded-xl")!
    expect(card).toHaveTextContent("soma das NFs")
    expect(card).toHaveTextContent("R$ 62.037,26")
    expect(card).toHaveTextContent("0,21% das NFs")
  })

  it("aplica o filtro de período no cliente, ignorando o que está fora", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    expect(await screen.findByText("CT-e 195476/1")).toBeInTheDocument()
    expect(screen.queryByText("CT-e 100/1")).not.toBeInTheDocument()
  })

  it("filtra por número de NF-e", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    fireEvent.change(screen.getByLabelText("NF-e ou CT-e"), { target: { value: "35835" } })

    expect(await screen.findByText("CT-e 195477/1")).toBeInTheDocument()
    expect(screen.queryByText("CT-e 195476/1")).not.toBeInTheDocument()
  })

  it("filtra por transportadora via select", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    fireEvent.change(screen.getByLabelText("Transportadora"), { target: { value: "SORRISO TRANSPORTES" } })

    await screen.findByText("CT-e 195476/1")
    expect(screen.getByText("CT-e 195477/1")).toBeInTheDocument()
  })

  it("expande o card do CT-e e mostra as NF-e filhas", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    const botao = await screen.findByRole("button", { name: /CT-e 195476/ })
    expect(botao).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(botao)

    expect(botao).toHaveAttribute("aria-expanded", "true")
    expect(screen.getByText("NF 35832/1")).toBeInTheDocument()
    expect(screen.getByText("NF 35840/1")).toBeInTheDocument()
    expect(screen.getAllByText("PGFIOS")).toHaveLength(2)
  })

  it("mostra travessão quando a NF-e não tem data nem valor", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    fireEvent.click(await screen.findByRole("button", { name: /CT-e 195477/ }))

    // colunas: Nota | Despacho | Emissão | Cliente | Valor da nota | Rateio | % no CT-e
    const linha = screen.getByText("NF 35835/1").closest("tr")!
    const celulas = within(linha).getAllByRole("cell")
    expect(celulas).toHaveLength(7)
    expect(celulas[1]).toHaveTextContent("—")
    expect(celulas[2]).toHaveTextContent("—")
    expect(celulas[3]).toHaveTextContent("—")
    expect(celulas[4]).toHaveTextContent("—")
    expect(celulas[5]).toHaveTextContent("—")
    expect(celulas[6]).toHaveTextContent("—")
  })

  it("resume CT-es, NF-e com valor e rateio", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    await screen.findByText("CT-e 195476/1")
    expect(screen.getByText("NF-e com valor de nota")).toBeInTheDocument()
    expect(screen.getByText("Total dos CT-es")).toBeInTheDocument()
    expect(screen.getByText("Rateio dos itens")).toBeInTheDocument()
  })

  it("oferece os atalhos de último período e mês corrente", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    fireEvent.click(screen.getByRole("button", { name: "Mês corrente" }))
    expect(screen.getByLabelText("De")).toHaveValue(
      `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}-01`
    )

    fireEvent.click(screen.getByRole("button", { name: "Últimos 2 meses" }))
    expect(screen.getByLabelText("Até")).toHaveValue(iso(hoje))
  })

  it("limpar volta ao estado inicial e remove os resultados", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    await screen.findByText("CT-e 195476/1")
    fireEvent.click(screen.getByRole("button", { name: /Limpar/ }))

    expect(screen.queryByText("CT-e 195476/1")).not.toBeInTheDocument()
    expect(screen.getByText("Consulte o relatório para ver as NF-e")).toBeInTheDocument()
  })

  it("avisa quando a API não retorna NF-e", async () => {
    const fetchMock = createFetchMock(handler([]))
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    expect(await screen.findByText("Nenhuma NF-e no período selecionado")).toBeInTheDocument()
    expect(toastMock.error).toHaveBeenCalledWith("Nenhuma NF-e encontrada no período")
  })

  it("mostra o cliente da NF-e na coluna Cliente e usa o emissor como fallback", async () => {
    const fetchMock = createFetchMock(handler([comCliente, dentroDoPeriodo]))
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    fireEvent.click(await screen.findByRole("button", { name: /CT-e 195478/ }))

    const linhaCliente = screen.getByText("NF 12600/1").closest("tr")!
    expect(within(linhaCliente).getByText("PH TECNICA")).toBeInTheDocument()

    fireEvent.click(screen.getByRole("button", { name: /CT-e 195476/ }))
    const linhaFallback = screen.getByText("NF 35832/1").closest("tr")!
    expect(within(linhaFallback).getByText("PGFIOS")).toBeInTheDocument()
  })

  it("marca a NF-e prevista e avisa que ela não existe no fiscal", async () => {
    const fetchMock = createFetchMock(handler())
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    fireEvent.click(await screen.findByRole("button", { name: /CT-e 195477/ }))

    const linha = screen.getByText("NF 35835/1").closest("tr")!
    expect(within(linha).getByText("prevista")).toBeInTheDocument()
    expect(
      screen.getByText(/NF-e não localizada no fiscal: o CT-e aponta para nota prevista/)
    ).toBeInTheDocument()
    expect(
      screen.getByText(/1 NF-e não localizadas no fiscal/)
    ).toBeInTheDocument()
  })

  it("não marca prevista a NF-e que o endpoint resolveu", async () => {
    const fetchMock = createFetchMock(handler([comCliente]))
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    fireEvent.click(await screen.findByRole("button", { name: /CT-e 195478/ }))

    const linha = screen.getByText("NF 12600/1").closest("tr")!
    expect(within(linha).queryByText("prevista")).not.toBeInTheDocument()
    expect(screen.queryByText(/NF-e não localizadas no fiscal/)).not.toBeInTheDocument()
    expect(screen.queryByText(/nota prevista/)).not.toBeInTheDocument()
  })

  it("exporta cliente, razão social, emissor e origem do cabeçalho no CSV", async () => {
    const blobs: Blob[] = []
    const criarUrl = vi.fn((b: Blob) => {
      blobs.push(b)
      return "blob:mock"
    })
    const revogar = vi.fn()
    const createObjectURLOriginal = URL.createObjectURL
    const revokeObjectURLOriginal = URL.revokeObjectURL
    Object.defineProperty(URL, "createObjectURL", { value: criarUrl, configurable: true })
    Object.defineProperty(URL, "revokeObjectURL", { value: revogar, configurable: true })

    try {
      const fetchMock = createFetchMock(handler([comCliente]))
      vi.stubGlobal("fetch", fetchMock.fn)
      await consultar(fetchMock)

      await screen.findByText("CT-e 195478/1")
      fireEvent.click(screen.getByRole("button", { name: /Exportar CSV/ }))

      expect(criarUrl).toHaveBeenCalledTimes(1)
      const csv = await blobs[0].text()
      expect(csv).toContain("Cliente,Cliente (razao social),Fornecedor (emissor)")
      expect(csv).toContain("Origem do cabecalho")
      expect(csv).toContain(
        "PH TECNICA,PH TECNICA COMERCIO E REPRESENTACOES LTDA,PH TECNICA"
      )
      expect(csv).toContain("CNPJ_FORNECEDOR")
    } finally {
      Object.defineProperty(URL, "createObjectURL", {
        value: createObjectURLOriginal,
        configurable: true,
      })
      Object.defineProperty(URL, "revokeObjectURL", {
        value: revokeObjectURLOriginal,
        configurable: true,
      })
    }
  })

  it("avisa quando o proxy retorna falha", async () => {
    const fetchMock = createFetchMock(({ method, url }) => {
      if (method === "GET" && url === "/api/integracao/listar?tela=nfe-cte") {
        return { json: integracoes }
      }
      if (method === "GET" && url.startsWith("/api/integracao/7/executar")) {
        return { json: { success: false, status: 500 } }
      }
      return { status: 404, json: { error: "Rota não mockada" } }
    })
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    await screen.findByText("Consulte o relatório para ver as NF-e")
    expect(toastMock.error).toHaveBeenCalledWith("API retornou erro: 500")
  })

  it("abre os itens da NF-e e mostra descrição, quantidade, rateio e ICMS", async () => {
    const fetchMock = createFetchMock(handler([comRateio]))
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    fireEvent.click(await screen.findByRole("button", { name: /CT-e 195477/ }))

    const botaoItem = screen.getByRole("button", { name: /NF 35835/ })
    expect(botaoItem).toHaveAttribute("aria-expanded", "false")
    fireEvent.click(botaoItem)

    expect(botaoItem).toHaveAttribute("aria-expanded", "true")
    const tabelaItens = screen.getByText("Item do CT-e").closest("table")!
    expect(within(tabelaItens).getByText("SERVICOS FRETES COMPRAS")).toBeInTheDocument()
    expect(within(tabelaItens).getByText("1 UN")).toBeInTheDocument()
    expect(within(tabelaItens).getByText("R$ 79,32")).toBeInTheDocument()
    expect(within(tabelaItens).getByText("R$ 9,52")).toBeInTheDocument()
  })

  it("separa em linhas as descrições agregadas do endpoint", async () => {
    const fetchMock = createFetchMock(handler([comDoisItens]))
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    fireEvent.click(await screen.findByRole("button", { name: /CT-e 195480/ }))
    fireEvent.click(screen.getByRole("button", { name: /NF 35843/ }))

    const tabelaItens = screen.getByText("Item do CT-e").closest("table")!
    expect(within(tabelaItens).getByText("SERVICOS FRETES COMPRAS")).toBeInTheDocument()
    expect(within(tabelaItens).getByText("SERVICOS FRETES VENDA")).toBeInTheDocument()
    // a quantidade total aparece nas duas linhas, porque a SQL agrupa
    expect(within(tabelaItens).getAllByText("3 KG")).toHaveLength(2)
    // com mais de um item o rateio é do CT-e inteiro, então não se repete por linha:
    // valor e ICMS ficam em travessão nas duas linhas
    expect(within(tabelaItens).getAllByText("—")).toHaveLength(4)
  })

  it("mostra a cota de rateio da NF-e prevista e o percentual do CT-e", async () => {
    const fetchMock = createFetchMock(handler([comRateio]))
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    fireEvent.click(await screen.findByRole("button", { name: /CT-e 195477/ }))

    // colunas: Nota | Despacho | Emissão | Cliente | Valor da nota | Rateio | % no CT-e
    const linha = screen.getByRole("button", { name: /NF 35835/ }).closest("tr")!
    const rateio = within(linha).getAllByRole("cell")[5]
    expect(rateio).toHaveTextContent("R$ 79,32")
    expect(rateio).toHaveTextContent("100,00% do CT-e")
    // o valor da nota continua vazio: o rateio não é o total da NF-e
    expect(within(linha).getAllByRole("cell")[4]).toHaveTextContent("—")
  })

  it("mostra pedido e romaneio da ordem de despacho na linha da NF-e", async () => {
    const fetchMock = createFetchMock(handler([comDespacho]))
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    fireEvent.click(await screen.findByRole("button", { name: /CT-e 195477/ }))

    // colunas: Nota | Despacho | Emissão | Cliente | Valor da nota | Rateio | % no CT-e
    const linha = screen.getByRole("button", { name: /NF 35835/ }).closest("tr")!
    const despacho = within(linha).getAllByRole("cell")[1]
    expect(despacho).toHaveTextContent("pedido 8.305")
    expect(despacho).toHaveTextContent("romaneio 24.795")
  })

  it("conta as NF-e em ordem de despacho no resumo", async () => {
    const fetchMock = createFetchMock(handler([comDespacho, { ...comDespacho, nf_numero: 35840 }]))
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    await screen.findByText("NF-e em ordem de despacho")
    const card = screen.getByText("NF-e em ordem de despacho").closest("div")!
    expect(card).toHaveTextContent("2")
    expect(card).toHaveTextContent("/ 2")
  })

  it("sinaliza o CT-es cujo rateio não fecha com o total", async () => {
    const fetchMock = createFetchMock(handler([rateioDivergenteA, rateioDivergenteB]))
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    const card = await screen.findByRole("button", { name: /CT-e 351348/ })
    expect(within(card).getByText("rateio não fecha")).toBeInTheDocument()
    expect(screen.getByText(/1 CT-es com rateio divergente do total/)).toBeInTheDocument()
  })

  it("não sinaliza rateio que fecha com o total do CT-e", async () => {
    const fetchMock = createFetchMock(handler([comRateio]))
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    const card = await screen.findByRole("button", { name: /CT-e 195477/ })
    expect(within(card).queryByText("rateio não fecha")).not.toBeInTheDocument()
    expect(screen.queryByText(/rateio divergente/)).not.toBeInTheDocument()
  })

  it("avisa que o valor da NF prevista vem do rateio, e não da nota", async () => {
    const fetchMock = createFetchMock(handler([comRateio]))
    vi.stubGlobal("fetch", fetchMock.fn)
    await consultar(fetchMock)

    fireEvent.click(await screen.findByRole("button", { name: /CT-e 195477/ }))
    expect(
      screen.getByText(/O rateio acima vem dos itens do próprio CT-e, não da nota/)
    ).toBeInTheDocument()
  })

  it("exporta os itens e o rateio no CSV", async () => {
    const blobs: Blob[] = []
    const criarUrl = vi.fn((b: Blob) => {
      blobs.push(b)
      return "blob:mock"
    })
    const revogar = vi.fn()
    const createObjectURLOriginal = URL.createObjectURL
    const revokeObjectURLOriginal = URL.revokeObjectURL
    Object.defineProperty(URL, "createObjectURL", { value: criarUrl, configurable: true })
    Object.defineProperty(URL, "revokeObjectURL", { value: revogar, configurable: true })

    try {
      const fetchMock = createFetchMock(handler([comRateio]))
      vi.stubGlobal("fetch", fetchMock.fn)
      await consultar(fetchMock)

      await screen.findByText("CT-e 195477/1")
      fireEvent.click(screen.getByRole("button", { name: /Exportar CSV/ }))

      const csv = await blobs[0].text()
      expect(csv).toContain("Origem do valor,Itens rateados,Quantidade total,Unidade")
      expect(csv).toContain("Valor do rateio,ICMS do rateio,% rateio no CT-e")
      expect(csv).toContain("RATEIO_CTE")
      expect(csv).toContain("SERVICOS FRETES COMPRAS")
    } finally {
      Object.defineProperty(URL, "createObjectURL", {
        value: createObjectURLOriginal,
        configurable: true,
      })
      Object.defineProperty(URL, "revokeObjectURL", {
        value: revokeObjectURLOriginal,
        configurable: true,
      })
    }
  })
})
