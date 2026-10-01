// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest"
import { screen, fireEvent, within } from "@testing-library/react"
import { Dashboard } from "./dashboard"
import { agruparPorCte, calcularResumo } from "./utils"
import type { LinhaCte } from "./types"
import { navMock, renderPage } from "@/test/harness"

function linha(over: Partial<LinhaCte>): LinhaCte {
  return {
    cte_numero: 1,
    cte_serie: "1",
    cte_data: "18/09/2026",
    cte_data_transacao: null,
    cte_valor_total: 20,
    cte_valor_frete: 0,
    cte_natureza: 119,
    cte_tipo_conhecimento: 3,
    cte_cod_cidade_origem: 7702,
    cte_cod_cidade_destino: 8606,
    cte_situacao: 4,
    cte_transportadora_razao: null,
    cte_transportadora_fantasia: "SORRISO TRANSPORTES",
    cte_tomador_razao: null,
    cte_tomador_fantasia: "SORRISO",
    soma_nf_do_cte: null,
    soma_rateio_do_cte: null,
    pct_cte_sobre_total_nfs: null,
    nf_numero: 100,
    nf_serie: "1",
    nf_data: "18/09/2026",
    nf_valor_total: 1000,
    pct_nf_no_total_cte: null,
    nf_frete_rateado: null,
    nf_situacao: 1,
    nf_cliente_razao: null,
    nf_cliente_fantasia: null,
    nf_fornecedor_razao: null,
    nf_fornecedor_fantasia: null,
    nf_cab_origem: "CNPJ_CLIENTE_NF",
    nf_item_qtd: null,
    nf_item_qtd_total: null,
    nf_item_unidade: null,
    nf_item_descricoes: null,
    nf_item_valor_total: null,
    nf_item_icms: null,
    nf_pct_rateio_no_cte: null,
    nf_valor_origem: null,
    nf_od_pedido: null,
    nf_od_data: null,
    nf_od_valor: null,
    nf_od_qtde: null,
    nf_od_cliente_razao: null,
    nf_od_cliente_fantasia: null,
    nf_od_cod_cidade: null,
    nf_od_cidade: null,
    nf_od_regiao: null,
    nf_od_representante: null,
    nf_od_romaneio: null,
    nf_od_qtde_rolos: null,
    nf_od_peso_bruto: null,
    nf_od_peso_liquido: null,
    nf_od_faturamento: null,
    nf_od_cfop: null,
    nf_od_natureza: null,
    ...over,
  } as LinhaCte
}

function montar(itens: LinhaCte[]) {
  const grupos = agruparPorCte(itens)
  const resumo = calcularResumo(itens)
  renderPage(<Dashboard grupos={grupos} resumo={resumo} />)
  return grupos
}

/** Card do bloco de resumo, localizado pelo rótulo dentro da seção. */
function cardResumo(rotulo: string): HTMLElement {
  const el = within(screen.getByRole("region", { name: "Resumo do período" })).getByText(rotulo)
  // Com drill-down o card virou <button>; sem drill-down continua <div>.
  return (el.closest("button") ?? el.closest("div"))!
}

/** Card de faixa de frete: sobe do rótulo até a div do card (p -> linha -> card). */
function cardFaixa(rotulo: string): HTMLElement {
  return within(screen.getByRole("region", { name: "Faixa de frete sobre a mercadoria" }))
    .getByText(rotulo)
    .parentElement!.parentElement!
}

describe("Dashboard", () => {
  beforeEach(() => {
    navMock.reset()
  })

  it("renderiza os cards de resumo com os totais", () => {
    montar([
      linha({ cte_numero: 1, cte_valor_total: 20, nf_numero: 100, nf_valor_total: 1000 }),
      linha({ cte_numero: 2, cte_valor_total: 30, nf_numero: 200, nf_valor_total: 1000 }),
    ])

    expect(screen.getByRole("region", { name: "Resumo do período" })).toBeInTheDocument()
    expect(cardResumo("NF-e")).toHaveTextContent("2")
    expect(cardResumo("CT-es")).toHaveTextContent("2")
    // mercadoria 1.000 + 1.000
    expect(cardResumo("Mercadoria")).toHaveTextContent("R$ 2.000,00")
    // frete 20 + 30, somado uma vez por CT-e
    expect(cardResumo("Frete total")).toHaveTextContent("R$ 50,00")
    // frete 50 ÷ mercadoria 2.000 = 2,50%
    expect(cardResumo("Percentual total")).toHaveTextContent("2,50%")
    expect(cardResumo("Rateio dos itens")).toBeInTheDocument()
    expect(cardResumo("NF-e com valor")).toBeInTheDocument()
    expect(cardResumo("Rateio divergente")).toBeInTheDocument()
  })

  it("conta os CT-es em cada faixa e destaca o que está na faixa esperada", () => {
    montar([
      linha({ cte_numero: 1, cte_valor_total: 10, nf_numero: 100, nf_valor_total: 1000 }), // 1,0%
      linha({ cte_numero: 2, cte_valor_total: 18, nf_numero: 200, nf_valor_total: 1000 }), // 1,8%
      linha({ cte_numero: 3, cte_valor_total: 25, nf_numero: 300, nf_valor_total: 1000 }), // 2,5%
    ])

    expect(cardFaixa("até 1,5%")).toHaveTextContent("1")
    expect(cardFaixa("na faixa (1,5% a 2,0%)")).toHaveTextContent("1")
    expect(cardFaixa("acima de 2,0%")).toHaveTextContent("1")
    expect(cardFaixa("sem dado")).toHaveTextContent("0")
  })

  it("resume a faixa esperada no texto abaixo dos cards", () => {
    montar([
      linha({ cte_numero: 1, cte_valor_total: 10, nf_numero: 100, nf_valor_total: 1000 }),
      linha({ cte_numero: 2, cte_valor_total: 18, nf_numero: 200, nf_valor_total: 1000 }),
      linha({ cte_numero: 3, cte_valor_total: 25, nf_numero: 300, nf_valor_total: 1000 }),
      linha({ cte_numero: 4, cte_valor_total: 30, nf_numero: 400, nf_valor_total: 1000 }),
    ])
    // 1 dos 4 CT-es avaliados está na faixa esperada = 25%
    expect(screen.getByText(/1 de 4 CT-es/)).toBeInTheDocument()
    expect(
      screen.getByText(/A regra é ficar entre/).parentElement
    ).toHaveTextContent("estão na faixa (25,00%)")
  })

  it("mostra o breakdown por transportadora com a média e a distribuição", () => {
    montar([
      linha({ cte_numero: 1, cte_transportadora_fantasia: "SORRISO TRANSPORTES", cte_valor_total: 10, nf_numero: 100, nf_valor_total: 1000 }),
      linha({ cte_numero: 2, cte_transportadora_fantasia: "SORRISO TRANSPORTES", cte_valor_total: 18, nf_numero: 200, nf_valor_total: 1000 }),
      linha({ cte_numero: 3, cte_transportadora_fantasia: "JADLOG", cte_valor_total: 25, nf_numero: 300, nf_valor_total: 1000 }),
    ])

    const linhaSorriso = screen.getByText("SORRISO TRANSPORTES").closest("tr")!
    expect(linhaSorriso).toHaveTextContent("2") // CT-es
    expect(linhaSorriso).toHaveTextContent("1,40%") // média de 1,0% e 1,8%
    expect(linhaSorriso).toHaveTextContent("1 / 1 / 0") // abaixo / na faixa / acima

    const linhaJadlog = screen.getByText("JADLOG").closest("tr")!
    expect(linhaJadlog).toHaveTextContent("0 / 0 / 1")
  })

  it("troca para o breakdown por região do cliente", () => {
    montar([
      linha({ cte_numero: 1, nf_od_regiao: "SÃO PAULO", cte_valor_total: 18, nf_numero: 100, nf_valor_total: 1000 }),
      linha({ cte_numero: 2, nf_od_regiao: "SERGIPE", cte_valor_total: 10, nf_numero: 200, nf_valor_total: 1000 }),
      linha({ cte_numero: 3, nf_od_regiao: null, cte_valor_total: 25, nf_numero: 300, nf_valor_total: 1000 }),
    ])

    fireEvent.click(screen.getByRole("tab", { name: /região do cliente/i }))

    const linhaSp = screen.getByText("SÃO PAULO").closest("tr")!
    expect(linhaSp).toHaveTextContent("1,80%")
    expect(linhaSp).toHaveTextContent("0 / 1 / 0")

    // CT-e sem região do cliente aparece como linha própria
    expect(screen.getByText("Sem região")).toBeInTheDocument()
    expect(screen.getByText("Sem região").closest("tr")).toHaveTextContent("0 / 0 / 1")
  })

  it("mostra a coluna Região quando a aba de região está ativa", () => {
    montar([linha({ cte_numero: 1, nf_od_regiao: "BAHIA", cte_valor_total: 18, nf_numero: 100, nf_valor_total: 1000 })])
    fireEvent.click(screen.getByRole("tab", { name: /região do cliente/i }))
    expect(within(screen.getByRole("tabpanel")).getByText("Região")).toBeInTheDocument()
  })

  it("avisa quando não há CT-es para agrupar", () => {
    montar([])
    expect(screen.getAllByText(/Sem CT-es para agrupar/).length).toBeGreaterThan(0)
  })
})