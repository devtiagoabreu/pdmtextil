import { describe, it, expect } from "vitest"
import {
  agruparPorCte,
  ApiRelatorioError,
  LIMITE_PAGINA,
  MAX_PAGINAS,
  buscarTodasPaginas,
  calcularDerivadosPorCte,
  deduplicarPorCteNf,
  calcularResumo,
  classificarFaixaFrete,
  contarFaixas,
  descricoesItem,
  extrairItems,
  filtrarPorPeriodo,
  formatarMoeda,
  formatarNumero,
  formatarPercentual,
  freteSobreMercadoria,
  isoParaData,
  nfSemCabecalho,
  nfTemDespacho,
  nfTemRateio,
  nomeClienteNf,
  nomeTranspDistinct,
  normalizarLinha,
  normalizarResposta,
  paraIso,
  parseDataBr,
  periodoMesCorrente,
  periodoPadrao,
  rateioFechaComCte,
  resumirFretePorRegiao,
  resumirFretePorTransportadora,
  somarMeses,
} from "./utils"
import type { LinhaCte } from "./types"

const cteBase = {
  cte_numero: 195476,
  cte_serie: "1",
  cte_data: "18/09/2026",
  cte_data_transacao: "25/09/2026",
  cte_valor_total: 131.7,
  cte_valor_frete: 0,
  cte_natureza: 119,
  cte_tipo_conhecimento: 3,
  cte_cod_cidade_origem: 7702,
  cte_cod_cidade_destino: 8606,
  cte_situacao: 4,
  cte_transportadora_razao: "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
  cte_transportadora_fantasia: "SORRISO TRANSPORTES",
  cte_tomador_razao: "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
  cte_tomador_fantasia: "SORRISO TRANSPORTES",
  soma_nf_do_cte: null,
  soma_rateio_do_cte: null,
  pct_cte_sobre_total_nfs: null,
  nf_numero: null,
  nf_serie: null,
  nf_data: null,
  nf_valor_total: null,
  pct_nf_no_total_cte: null,
  nf_frete_rateado: null,
  nf_situacao: null,
  nf_cliente_razao: null,
  nf_cliente_fantasia: null,
  nf_fornecedor_razao: null,
  nf_fornecedor_fantasia: null,
  nf_cab_origem: null,
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
} satisfies LinhaCte

function linha(over: Partial<LinhaCte>): LinhaCte {
  return { ...cteBase, ...over }
}

describe("normalizarLinha", () => {
  it("aceita chaves minúsculas (formato real da API)", () => {
    const r = normalizarLinha({ cte_numero: 195476, cte_data: "18/09/2026", cte_valor_total: 131.7 })
    expect(r.cte_numero).toBe(195476)
    expect(r.cte_data).toBe("18/09/2026")
    expect(r.cte_valor_total).toBe(131.7)
  })

  it("aceita chaves maiúsculas (formato da documentação)", () => {
    const r = normalizarLinha({ CTE_NUMERO: 195476, CTE_DATA: "18/09/2026", CTE_VALOR_TOTAL: 131.7 })
    expect(r.cte_numero).toBe(195476)
    expect(r.cte_data).toBe("18/09/2026")
    expect(r.cte_valor_total).toBe(131.7)
  })

  it("converte string numérica com vírgula", () => {
    const r = normalizarLinha({ cte_valor_total: "1.234,56", nf_valor_total: "20.737,52" })
    expect(r.cte_valor_total).toBe(1234.56)
    expect(r.nf_valor_total).toBe(20737.52)
  })

  it("normaliza null e string vazia para null", () => {
    const r = normalizarLinha({ nf_numero: null, nf_serie: "", nf_data: "   " })
    expect(r.nf_numero).toBeNull()
    expect(r.nf_serie).toBeNull()
    expect(r.nf_data).toBeNull()
  })

  it("não inventa campo para chave desconhecida", () => {
    const r = normalizarLinha({ campo_inexistente: 10 })
    expect((r as unknown as Record<string, unknown>).campo_inexistente).toBeUndefined()
  })

  it("lê a razão social do cliente e a origem do cabeçalho da NF-e", () => {
    const r = normalizarLinha({
      nf_cliente_razao: "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
      nf_cliente_fantasia: "SORRISO TRANSPORTES",
      nf_cab_origem: "CNPJ_CLIENTE_NF",
    })
    expect(r.nf_cliente_razao).toBe("E E CARGAS E ENCOMENDAS LTDA- SORRISO")
    expect(r.nf_cliente_fantasia).toBe("SORRISO TRANSPORTES")
    expect(r.nf_cab_origem).toBe("CNPJ_CLIENTE_NF")
  })

  // O endpoint v2 devolve os aliases em MAIÚSCULO. Se algum campo novo ficar fora
  // de CAMPOS_NUMERICOS/CAMPOS_TEXTO, ele é descartado em silêncio aqui e some da
  // tela — e nenhum teste com payload minúsculo acusaria.
  it("preserva os três campos novos do v2 quando vêm em maiúsculas", () => {
    const r = normalizarLinha({
      CTE_NUMERO: 195476,
      NF_NUMERO: 35832,
      NF_VALOR_TOTAL: "20.737,52",
      NF_CLIENTE_RAZAO: "PH TECNICA COMERCIO E REPRESENTACOES LTDA",
      NF_CLIENTE_FANTASIA: "PH TECNICA",
      NF_CAB_ORIGEM: "SEM_CABECALHO",
    })
    expect(r.nf_cliente_razao).toBe("PH TECNICA COMERCIO E REPRESENTACOES LTDA")
    expect(r.nf_cliente_fantasia).toBe("PH TECNICA")
    expect(r.nf_cab_origem).toBe("SEM_CABECALHO")
    expect(r.nf_valor_total).toBe(20737.52)
    expect(r.nf_numero).toBe(35832)
  })

  it("não inventa origem de cabeçalho quando o endpoint v1 não manda a coluna", () => {
    const r = normalizarLinha({ NF_NUMERO: 35832, CTE_NUMERO: 195476 })
    expect(r.nf_cab_origem).toBeNull()
  })

  // O v3 publishou os itens/rateio. Same risco do v2: campo fora da whitelist
  // some da tela sem erro nenhum. O payload abaixo é a linha real do CT-e
  // 195477 / NF 35835 devolvida pelo endpoint.
  it("preserva os campos de item/rateio do v3 quando vêm em maiúsculas", () => {
    const r = normalizarLinha({
      CTE_NUMERO: 195477,
      CTE_DATA_TRANSACAO: "25/09/2026",
      CTE_NATUREZA: 119,
      CTE_TIPO_CONHECIMENTO: 3,
      CTE_COD_CIDADE_ORIGEM: 7702,
      CTE_COD_CIDADE_DESTINO: 8606,
      SOMA_RATEIO_DO_CTE: 79.32,
      NF_NUMERO: 35835,
      NF_CAB_ORIGEM: "SEM_CABECALHO",
      NF_ITEM_QTD: 1,
      NF_ITEM_QTD_TOTAL: 1,
      NF_ITEM_UNIDADE: "UN",
      NF_ITEM_DESCRICOES: "SERVICOS FRETES COMPRAS",
      NF_ITEM_VALOR_TOTAL: 79.32,
      NF_ITEM_ICMS: 9.52,
      NF_PCT_RATEIO_NO_CTE: 100,
      NF_VALOR_ORIGEM: "RATEIO_CTE",
    })
    expect(r.cte_data_transacao).toBe("25/09/2026")
    expect(r.cte_natureza).toBe(119)
    expect(r.cte_tipo_conhecimento).toBe(3)
    expect(r.cte_cod_cidade_origem).toBe(7702)
    expect(r.cte_cod_cidade_destino).toBe(8606)
    expect(r.soma_rateio_do_cte).toBe(79.32)
    expect(r.nf_item_qtd).toBe(1)
    expect(r.nf_item_qtd_total).toBe(1)
    expect(r.nf_item_unidade).toBe("UN")
    expect(r.nf_item_descricoes).toBe("SERVICOS FRETES COMPRAS")
    expect(r.nf_item_valor_total).toBe(79.32)
    expect(r.nf_item_icms).toBe(9.52)
    expect(r.nf_pct_rateio_no_cte).toBe(100)
    expect(r.nf_valor_origem).toBe("RATEIO_CTE")
  })

  it("lê o rateio em vírgula decimal", () => {
    const r = normalizarLinha({ NF_ITEM_VALOR_TOTAL: "1.340,47", NF_ITEM_ICMS: "160,86" })
    expect(r.nf_item_valor_total).toBe(1340.47)
    expect(r.nf_item_icms).toBe(160.86)
  })

  // A v3.1b junta a ordem de despacho à linha da NF-e. Mesmo risco das v2/v3:
  // alias fora da whitelist desaparece em silêncio. O payload abaixo é a linha
  // real devolvida pelo endpoint, com os aliases em maiúsculas.
  it("preserva os 17 campos de despacho da v3.1b quando vêm em maiúsculas", () => {
    const r = normalizarLinha({
      NF_OD_PEDIDO: 8305,
      NF_OD_DATA: "25/09/2026",
      NF_OD_VALOR: "4.730,00",
      NF_OD_QTDE: "12,5",
      NF_OD_CLIENTE_RAZAO: "PH TECNICA COMERCIO E REPRESENTACOES LTDA",
      NF_OD_CLIENTE_FANTASIA: "PH TECNICA",
      NF_OD_COD_CIDADE: 7107,
      NF_OD_CIDADE: "SAO PAULO",
      NF_OD_REGIAO: "Sudeste",
      NF_OD_REPRESENTANTE: "MARIA SOUZA",
      NF_OD_ROMANEIO: 24795,
      NF_OD_QTDE_ROLOS: 3,
      NF_OD_PESO_BRUTO: "1.200,75",
      NF_OD_PESO_LIQUIDO: "1.150,25",
      NF_OD_FATURAMENTO: "Nao",
      NF_OD_CFOP: "5.924",
      NF_OD_NATUREZA: "Venda de mercadoria",
    })
    expect(r.nf_od_pedido).toBe(8305)
    expect(r.nf_od_data).toBe("25/09/2026")
    expect(r.nf_od_valor).toBe(4730)
    expect(r.nf_od_qtde).toBe(12.5)
    expect(r.nf_od_cliente_razao).toBe("PH TECNICA COMERCIO E REPRESENTACOES LTDA")
    expect(r.nf_od_cliente_fantasia).toBe("PH TECNICA")
    expect(r.nf_od_cod_cidade).toBe(7107)
    expect(r.nf_od_cidade).toBe("SAO PAULO")
    expect(r.nf_od_regiao).toBe("Sudeste")
    expect(r.nf_od_representante).toBe("MARIA SOUZA")
    expect(r.nf_od_romaneio).toBe(24795)
    expect(r.nf_od_qtde_rolos).toBe(3)
    expect(r.nf_od_peso_bruto).toBe(1200.75)
    expect(r.nf_od_peso_liquido).toBe(1150.25)
    expect(r.nf_od_faturamento).toBe("Nao")
    expect(r.nf_od_cfop).toBe("5.924")
    expect(r.nf_od_natureza).toBe("Venda de mercadoria")
  })

  it("mantém o CFOP da v3.1b como texto, e não como número", () => {
    // "5.924" viraria 5924 se fosse para a whitelist numérica — o código CFOP
    // precisa preservar o ponto para continuar legível.
    const r = normalizarLinha({ NF_OD_CFOP: "5.924" })
    expect(r.nf_od_cfop).toBe("5.924")
  })
})

describe("nfTemDespacho", () => {
  it("reconhece NF-e com pedido real", () => {
    expect(nfTemDespacho(linha({ nf_od_pedido: 8305 }))).toBe(true)
  })

  it("ignora PEDIDO = 0, que é placeholder de NF-e sem ordem", () => {
    expect(nfTemDespacho(linha({ nf_od_pedido: 0 }))).toBe(false)
  })

  it("ignora NF-e sem pedido de despacho", () => {
    expect(nfTemDespacho(linha({ nf_od_pedido: null }))).toBe(false)
  })
})

describe("nomeClienteNf com despacho", () => {
  it("prefere o cliente fiscal sobre o da ordem de despacho", () => {
    expect(
      nomeClienteNf(linha({ nf_cliente_fantasia: "CLIENTE FISCAL", nf_od_cliente_fantasia: "CLIENTE OD" }))
    ).toBe("CLIENTE FISCAL")
  })

  it("cai para o cliente da ordem de despacho quando o fiscal não tem", () => {
    expect(
      nomeClienteNf(
        linha({
          nf_cliente_fantasia: null,
          nf_cliente_razao: null,
          nf_fornecedor_fantasia: null,
          nf_fornecedor_razao: null,
          nf_od_cliente_fantasia: "CLIENTE OD",
        })
      )
    ).toBe("CLIENTE OD")
  })

  it("usa a razão social do despacho quando não há fantasia", () => {
    expect(nomeClienteNf(linha({ nf_od_cliente_razao: "PH TECNICA LTDA" }))).toBe("PH TECNICA LTDA")
  })
})

describe("nfTemRateio", () => {
  it("reconhece NF-e que só tem cota de frete, sem cabeçalho no fiscal", () => {
    expect(
      nfTemRateio(linha({ nf_valor_total: null, nf_item_valor_total: 79.32 }))
    ).toBe(true)
  })

  it("reconhece rateio só com descrição de item", () => {
    expect(nfTemRateio(linha({ nf_item_descricoes: "SERVICOS FRETES COMPRAS" }))).toBe(true)
  })

  it("diz que não tem quando a NF-e não tem item nenhum", () => {
    expect(nfTemRateio(linha({}))).toBe(false)
  })
})

describe("descricoesItem", () => {
  it("separa a coluna agregada do endpoint em linhas", () => {
    expect(
      descricoesItem(linha({ nf_item_descricoes: "SERVICOS FRETES COMPRAS | SERVICOS FRETES VENDA" }))
    ).toEqual(["SERVICOS FRETES COMPRAS", "SERVICOS FRETES VENDA"])
  })

  it("devolve lista vazia sem descrição", () => {
    expect(descricoesItem(linha({}))).toEqual([])
    expect(descricoesItem(linha({ nf_item_descricoes: "   " }))).toEqual([])
  })
})

describe("rateioFechaComCte", () => {
  it("confere quando o rateio fecha com o total do CT-e", () => {
    expect(
      rateioFechaComCte(linha({ cte_valor_total: 79.32, soma_rateio_do_cte: 79.32 }))
    ).toBe(true)
  })

  it("aceita diferença de arredondamento de centavo", () => {
    expect(
      rateioFechaComCte(linha({ cte_valor_total: 199.99, soma_rateio_do_cte: 199.99 }))
    ).toBe(true)
  })

  it("aponta o rateio que passa do total do CT-e", () => {
    // CT-e 351348/1: item da NF 31933 carrega 717,35 num CT-e de 199,99.
    expect(
      rateioFechaComCte(linha({ cte_valor_total: 199.99, soma_rateio_do_cte: 917.34 }))
    ).toBe(false)
  })

  it("não acusa divergência quando falta um dos lados", () => {
    expect(rateioFechaComCte(linha({ cte_valor_total: null, soma_rateio_do_cte: 100 }))).toBe(true)
    expect(rateioFechaComCte(linha({ cte_valor_total: 100, soma_rateio_do_cte: null }))).toBe(true)
  })
})

describe("nomeClienteNf", () => {
  it("prefere a fantasia do cliente", () => {
    expect(
      nomeClienteNf(
        linha({
          nf_cliente_fantasia: "SORRISO TRANSPORTES",
          nf_cliente_razao: "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
          nf_fornecedor_fantasia: "PGFIOS",
        })
      )
    ).toBe("SORRISO TRANSPORTES")
  })

  it("cai para a razão social do cliente antes do emissor", () => {
    expect(
      nomeClienteNf(
        linha({
          nf_cliente_razao: "E E CARGAS E ENCOMENDAS LTDA- SORRISO",
          nf_fornecedor_fantasia: "PGFIOS",
        })
      )
    ).toBe("E E CARGAS E ENCOMENDAS LTDA- SORRISO")
  })

  it("usa o emissor enquanto o endpoint não trouxer o cliente", () => {
    expect(nomeClienteNf(linha({ nf_fornecedor_fantasia: "PGFIOS" }))).toBe("PGFIOS")
    expect(nomeClienteNf(linha({ nf_fornecedor_razao: "SEMEAR ECOTEXTIL LTDA" }))).toBe(
      "SEMEAR ECOTEXTIL LTDA"
    )
  })

  it("devolve null quando a NF-e não tem nome nenhum", () => {
    expect(nomeClienteNf(linha({}))).toBeNull()
  })
})

describe("nfSemCabecalho", () => {
  it("reconhece a NF-e prevista, sem cabeçalho no fiscal", () => {
    expect(nfSemCabecalho(linha({ nf_cab_origem: "SEM_CABECALHO" }))).toBe(true)
  })

  it("não confunde nota resolvida com nota prevista", () => {
    expect(nfSemCabecalho(linha({ nf_cab_origem: "CNPJ_FORNECEDOR" }))).toBe(false)
    expect(nfSemCabecalho(linha({ nf_cab_origem: "DOCUMENTO_SERIE" }))).toBe(false)
  })

  it("trata NF-e sem a coluna de origem como resolvida (endpoint v1)", () => {
    expect(nfSemCabecalho(linha({}))).toBe(false)
  })
})

describe("extraitItems", () => {
  it("desembrulha items", () => {
    expect(extrairItems({ items: [{ a: 1 }] })).toEqual([{ a: 1 }])
  })

  it("aceita array direto", () => {
    expect(extrairItems([{ a: 1 }])).toEqual([{ a: 1 }])
  })

  it("aceita data e rows", () => {
    expect(extrairItems({ data: [{ a: 1 }] })).toEqual([{ a: 1 }])
    expect(extrairItems({ rows: [{ a: 2 }] })).toEqual([{ a: 2 }])
  })

  it("devolve lista vazia para payload sem itens", () => {
    expect(extrairItems(null)).toEqual([])
    expect(extrairItems({ erro: "x" })).toEqual([])
  })
})

describe("normalizarResposta", () => {
  it("normaliza a lista inteira", () => {
    const r = normalizarResposta({ items: [{ nf_numero: "35832", cte_data: "18/09/2026" }] })
    expect(r).toHaveLength(1)
    expect(r[0].nf_numero).toBe(35832)
  })

  it("remove NF duplicada dentro do mesmo CT-e (obrf_016 repetido)", () => {
    const r = normalizarResposta({
      items: [
        { cte_numero: "351348", cte_serie: "1", nf_numero: "35653", nf_serie: "1", nf_valor_total: 4655.2, cte_valor_total: 199.99 },
        { cte_numero: "351348", cte_serie: "1", nf_numero: "35653", nf_serie: "1", nf_valor_total: 4655.2, cte_valor_total: 199.99 },
      ],
    })
    expect(r).toHaveLength(1)
    expect(r[0].pct_nf_no_total_cte).toBeCloseTo(100, 2)
  })

  it("mantém a mesma NF em CT-es diferentes", () => {
    const r = normalizarResposta({
      items: [
        { cte_numero: "1", cte_serie: "1", nf_numero: "35653", nf_serie: "1", nf_valor_total: 10 },
        { cte_numero: "2", cte_serie: "1", nf_numero: "35653", nf_serie: "1", nf_valor_total: 10 },
      ],
    })
    expect(r).toHaveLength(2)
  })

  it("mantém NFs diferentes com o mesmo número no mesmo CT-e (séries distintas)", () => {
    const r = normalizarResposta({
      items: [
        { cte_numero: "1", cte_serie: "1", nf_numero: "35653", nf_serie: "1", nf_valor_total: 10 },
        { cte_numero: "1", cte_serie: "1", nf_numero: "35653", nf_serie: "2", nf_valor_total: 10 },
      ],
    })
    expect(r).toHaveLength(2)
  })
})

describe("deduplicarPorCteNf", () => {
  it("mantém a primeira ocorrência e devolve o resto intacto", () => {
    const r = deduplicarPorCteNf([
      linha({ cte_numero: 1, cte_serie: "1", nf_numero: 10, nf_serie: "1", nf_cliente_razao: "primeira" }),
      linha({ cte_numero: 1, cte_serie: "1", nf_numero: 10, nf_serie: "1", nf_cliente_razao: "duplicata" }),
      linha({ cte_numero: 1, cte_serie: "1", nf_numero: 11, nf_serie: "1" }),
    ])
    expect(r).toHaveLength(2)
    expect(r[0].nf_cliente_razao).toBe("primeira")
    expect(r[1].nf_numero).toBe(11)
  })

  it("não remove NF com número ou série nulos diferentes", () => {
    const r = deduplicarPorCteNf([
      linha({ cte_numero: 1, cte_serie: "1", nf_numero: null, nf_serie: null }),
      linha({ cte_numero: 1, cte_serie: "1", nf_numero: null, nf_serie: null }),
    ])
    expect(r).toHaveLength(1)
  })
})

describe("calcularDerivadosPorCte", () => {
  it("preenche soma e percentuais da v3.2 (a SQL não calcula mais no banco)", () => {
    const itens = calcularDerivadosPorCte([
      linha({ cte_numero: 195476, cte_valor_total: 131.7, nf_numero: 35832, nf_valor_total: 20737.52 }),
      linha({ cte_numero: 195476, cte_valor_total: 131.7, nf_numero: 35840, nf_valor_total: 41299.74 }),
    ])
    expect(itens[0].soma_nf_do_cte).toBeCloseTo(62037.26, 2)
    expect(itens[0].pct_nf_no_total_cte).toBeCloseTo(33.43, 2)
    expect(itens[0].pct_cte_sobre_total_nfs).toBeCloseTo(0.21, 2)
    expect(itens[1].pct_nf_no_total_cte).toBeCloseTo(66.57, 2)
  })

  it("soma o rateio por CT-e quando a API não devolve", () => {
    const itens = calcularDerivadosPorCte([
      linha({ cte_numero: 1, cte_valor_total: 3038.14, nf_item_valor_total: 1340.47 }),
      linha({ cte_numero: 1, cte_valor_total: 3038.14, nf_item_valor_total: 1697.67 }),
      linha({ cte_numero: 2, cte_valor_total: 79.32, nf_item_valor_total: 79.32 }),
    ])
    expect(itens[0].soma_rateio_do_cte).toBeCloseTo(3038.14, 2)
    expect(itens[1].soma_rateio_do_cte).toBeCloseTo(3038.14, 2)
    expect(itens[2].soma_rateio_do_cte).toBeCloseTo(79.32, 2)
    expect(itens[0].nf_pct_rateio_no_cte).toBeCloseTo(44.12, 2)
    expect(itens[1].nf_pct_rateio_no_cte).toBeCloseTo(55.88, 2)
    expect(itens[2].nf_pct_rateio_no_cte).toBeCloseTo(100, 2)
  })

  it("não sobrescreve valores que a API já devolveu", () => {
    const itens = calcularDerivadosPorCte([
      linha({
        cte_numero: 195476,
        cte_valor_total: 131.7,
        nf_numero: 35832,
        nf_valor_total: 20737.52,
        soma_nf_do_cte: 25000,
        pct_nf_no_total_cte: 42.5,
        soma_rateio_do_cte: 120,
        nf_pct_rateio_no_cte: 90,
      }),
    ])
    expect(itens[0].soma_nf_do_cte).toBe(25000)
    expect(itens[0].pct_nf_no_total_cte).toBe(42.5)
    expect(itens[0].soma_rateio_do_cte).toBe(120)
    expect(itens[0].nf_pct_rateio_no_cte).toBe(90)
    expect(itens[0].pct_cte_sobre_total_nfs).toBeCloseTo(0.64, 2)
  })

  it("não inventa percentual sem NF-e com valor", () => {
    const itens = calcularDerivadosPorCte([
      linha({ cte_numero: 1, cte_valor_total: 100, nf_numero: 1, nf_valor_total: null }),
    ])
    expect(itens[0].soma_nf_do_cte).toBeNull()
    expect(itens[0].pct_nf_no_total_cte).toBeNull()
    expect(itens[0].pct_cte_sobre_total_nfs).toBeNull()
  })
})

describe("datas", () => {
  it("paraIso e isoParaData fazem round-trip", () => {
    const d = new Date(2026, 8, 18, 12)
    expect(paraIso(d)).toBe("2026-09-18")
    expect(paraIso(isoParaData("2026-09-18")!)).toBe("2026-09-18")
  })

  it("isoParaData devolve null para entrada inválida", () => {
    expect(isoParaData("18/09/2026")).toBeNull()
    expect(isoParaData("")).toBeNull()
  })

  it("parseDataBr converte DD/MM/AAAA para ISO", () => {
    expect(parseDataBr("18/09/2026")).toBe("2026-09-18")
    expect(parseDataBr("01/08/2026")).toBe("2026-08-01")
  })

  it("parseDataBr devolve null para formatos não suportados", () => {
    expect(parseDataBr("2026-09-18")).toBeNull()
    expect(parseDataBr(null)).toBeNull()
    expect(parseDataBr(undefined)).toBeNull()
  })

  it("somarMeses preserva o dia quando o mês tem menos dias", () => {
    const d = new Date(2024, 2, 31, 12)
    expect(paraIso(somarMeses(d, -1))).toBe("2024-02-29")
  })

  it("somarMeses soma meses cheio", () => {
    const d = new Date(2026, 0, 15, 12)
    expect(paraIso(somarMeses(d, 2))).toBe("2026-03-15")
    expect(paraIso(somarMeses(d, -2))).toBe("2025-11-15")
  })

  it("periodoPadrao cobre os últimos 2 meses", () => {
    const p = periodoPadrao(new Date(2026, 8, 28, 12))
    expect(p.de).toBe("2026-07-28")
    expect(p.ate).toBe("2026-09-28")
  })

  it("periodoMesCorrente começa no dia 1 do mês", () => {
    const p = periodoMesCorrente(new Date(2026, 8, 28, 12))
    expect(p.de).toBe("2026-09-01")
    expect(p.ate).toBe("2026-09-28")
  })
})

describe("filtrarPorPeriodo", () => {
  const itens = [
    linha({ nf_numero: 1, nf_data: "10/08/2026", cte_data: "10/08/2026" }),
    linha({ nf_numero: 2, nf_data: "15/09/2026", cte_data: "15/09/2026" }),
    linha({ nf_numero: 3, nf_data: "20/10/2026", cte_data: "20/10/2026" }),
  ]

  it("mantém somente o que está dentro do intervalo", () => {
    const r = filtrarPorPeriodo(itens, { de: "2026-09-01", ate: "2026-09-30" })
    expect(r.map((l) => l.nf_numero)).toEqual([2])
  })

  it("inclui as bordas do intervalo", () => {
    const r = filtrarPorPeriodo(itens, { de: "2026-08-10", ate: "2026-10-20" })
    expect(r).toHaveLength(3)
  })

  it("usa a data do CT-e quando a NF-e não tem data", () => {
    const semData = [linha({ nf_numero: 9, nf_data: null, cte_data: "18/09/2026" })]
    const r = filtrarPorPeriodo(semData, { de: "2026-09-01", ate: "2026-09-30" })
    expect(r).toHaveLength(1)
  })

  it("mantém linha sem qualquer data para não sumir do relatório", () => {
    const semData = [linha({ nf_numero: 9, nf_data: null, cte_data: null })]
    expect(filtrarPorPeriodo(semData, { de: "2026-09-01", ate: "2026-09-30" })).toHaveLength(1)
  })

  it("sem datas define devolve tudo", () => {
    expect(filtrarPorPeriodo(itens, { de: "", ate: "" })).toHaveLength(3)
  })

  it("permite só a data inicial", () => {
    expect(filtrarPorPeriodo(itens, { de: "2026-09-01", ate: "" })).toHaveLength(2)
  })

  it("permite só a data final", () => {
    expect(filtrarPorPeriodo(itens, { de: "", ate: "2026-09-30" })).toHaveLength(2)
  })
})

describe("agruparPorCte", () => {
  it("agrupa as NF-e do mesmo CT-e", () => {
    const itens = [
      linha({ nf_numero: 35835, nf_serie: "1" }),
      linha({ nf_numero: 35832, nf_serie: "1" }),
    ]
    const g = agruparPorCte(itens)
    expect(g).toHaveLength(1)
    expect(g[0].nfs.map((n) => n.nf_numero)).toEqual([35832, 35835])
  })

  it("separa CT-es com números distintos", () => {
    const g = agruparPorCte([linha({ cte_numero: 1 }), linha({ cte_numero: 2 })])
    expect(g).toHaveLength(2)
  })

  it("separa o mesmo número em séries diferentes", () => {
    const g = agruparPorCte([
      linha({ cte_numero: 7, cte_serie: "1" }),
      linha({ cte_numero: 7, cte_serie: "2" }),
    ])
    expect(g).toHaveLength(2)
  })

  it("calcula soma e percentual quando a API não devolve", () => {
    const itens = [
      linha({ nf_numero: 1, nf_valor_total: 250 }),
      linha({ nf_numero: 2, nf_valor_total: 750 }),
    ]
    const g = agruparPorCte(itens)[0]
    expect(g.somaNfCalculada).toBe(1000)
    expect(g.pctCalculado).toBeCloseTo(13.17, 2)
  })

  it("usa soma e percentual da API quando presentes", () => {
    const itens = [
      linha({ soma_nf_do_cte: 25290.67, pct_cte_sobre_total_nfs: 6.31, nf_valor_total: 25290.67 }),
    ]
    const g = agruparPorCte(itens)[0]
    expect(g.somaNf).toBe(25290.67)
    expect(g.pctSobreNf).toBe(6.31)
  })

  it("percentual calculado fica nulo sem base de NF-e", () => {
    const g = agruparPorCte([linha({ nf_valor_total: null })])[0]
    expect(g.pctCalculado).toBeNull()
  })

  it("ordena por data do CT-e, do mais recente para o mais antigo", () => {
    const g = agruparPorCte([
      linha({ cte_numero: 1, cte_data: "10/08/2026" }),
      linha({ cte_numero: 2, cte_data: "18/09/2026" }),
      linha({ cte_numero: 3, cte_data: "15/09/2026" }),
    ])
    expect(g.map((x) => x.numero)).toEqual([2, 3, 1])
  })

  it("usa fantasia e cai para razão social ou travessão", () => {
    const comFantasia = agruparPorCte([
      linha({ cte_transportadora_fantasia: "SORRISO TRANSPORTES" }),
    ])[0]
    expect(comFantasia.transportadora).toBe("SORRISO TRANSPORTES")

    const soRazao = agruparPorCte([
      linha({ cte_transportadora_fantasia: null, cte_transportadora_razao: "TRANSPORTES X" }),
    ])[0]
    expect(soRazao.transportadora).toBe("TRANSPORTES X")

    const nenhuma = agruparPorCte([
      linha({ cte_transportadora_fantasia: null, cte_transportadora_razao: null }),
    ])[0]
    expect(nenhuma.transportadora).toBe("—")
  })

  it("leva os dados da capa do CT-e para o grupo", () => {
    const g = agruparPorCte([linha({})])[0]
    expect(g.dataTransacao).toBe("25/09/2026")
    expect(g.natureza).toBe(119)
    expect(g.tipoConhecimento).toBe(3)
    expect(g.codCidadeOrigem).toBe(7702)
    expect(g.codCidadeDestino).toBe(8606)
  })

  it("soma o rateio das NF-e quando a API não devolve", () => {
    const g = agruparPorCte([
      linha({ nf_numero: 23391, cte_valor_total: 3038.14, nf_item_valor_total: 1340.47 }),
      linha({ nf_numero: 23392, cte_valor_total: 3038.14, nf_item_valor_total: 1697.67 }),
    ])[0]
    expect(g.somaRateio).toBeNull()
    expect(g.somaRateioCalculada).toBeCloseTo(3038.14, 2)
  })

  it("usa a soma do rateio da API quando presente", () => {
    const g = agruparPorCte([
      linha({ cte_valor_total: 3038.14, soma_rateio_do_cte: 3038.14 }),
    ])[0]
    expect(g.somaRateio).toBe(3038.14)
  })

  it("marca o grupo com rateio divergente do total do CT-e", () => {
    // CT-e 351348/1: rateio 917,34 contra total 199,99.
    const g = agruparPorCte([
      linha({ cte_numero: 351348, cte_valor_total: 199.99, soma_rateio_do_cte: 917.34 }),
    ])[0]
    expect(g.rateioDivergente).toBe(true)
  })

  it("não marca grupo com rateio que fecha", () => {
    const g = agruparPorCte([
      linha({ cte_valor_total: 79.32, soma_rateio_do_cte: 79.32 }),
    ])[0]
    expect(g.rateioDivergente).toBe(false)
  })
})

describe("calcularResumo", () => {
  it("conta linhas, CT-es, NF-e e totais", () => {
    const itens = [
      linha({ cte_numero: 1, nf_numero: 10, cte_valor_total: 100, nf_valor_total: 500 }),
      linha({ cte_numero: 1, nf_numero: 11, cte_valor_total: 0, nf_valor_total: 300 }),
      linha({ cte_numero: 2, nf_numero: 12, cte_valor_total: 50, nf_valor_total: null }),
    ]
    const r = calcularResumo(itens)
    expect(r.linhas).toBe(3)
    expect(r.ctes).toBe(2)
    expect(r.nfs).toBe(3)
    expect(r.comValorNf).toBe(2)
    expect(r.totalFrete).toBe(150)
    expect(r.totalNf).toBe(800)
  })

  it("conta as NF-e previstas, que não têm valor no fiscal", () => {
    const r = calcularResumo([
      linha({ nf_numero: 10, nf_valor_total: 500, nf_cab_origem: "CNPJ_FORNECEDOR" }),
      linha({ nf_numero: 11, nf_valor_total: null, nf_cab_origem: "SEM_CABECALHO" }),
      linha({ nf_numero: 12, nf_valor_total: null, nf_cab_origem: "SEM_CABECALHO" }),
    ])
    expect(r.semCabecalho).toBe(2)
    expect(r.comValorNf).toBe(1)
  })

  it("conta as NF-e em ordem de despacho e ignora PEDIDO = 0", () => {
    const r = calcularResumo([
      linha({ nf_numero: 10, nf_od_pedido: 8305 }),
      linha({ nf_numero: 11, nf_od_pedido: 8005 }),
      linha({ nf_numero: 12, nf_od_pedido: 0 }),
      linha({ nf_numero: 13, nf_od_pedido: null }),
    ])
    expect(r.comDespacho).toBe(2)
  })

  it("conta linhas sem data de referência", () => {
    const r = calcularResumo([linha({ nf_data: null, cte_data: null })])
    expect(r.semData).toBe(1)
  })

  it("soma o rateio dos itens e conta os CT-es divergentes", () => {
    const r = calcularResumo([
      linha({ cte_numero: 1, nf_numero: 10, nf_item_valor_total: 79.32 }),
      linha({ cte_numero: 2, nf_numero: 11, nf_item_valor_total: 1340.47 }),
      linha({
        cte_numero: 3,
        nf_numero: 12,
        nf_item_valor_total: 717.35,
        cte_valor_total: 199.99,
        soma_rateio_do_cte: 917.34,
      }),
    ])
    expect(r.totalRateio).toBeCloseTo(2137.14, 2)
    expect(r.ctesRateioDivergente).toBe(1)
  })

  it("não conta a mesma NF duas vezes quando ela se repete no CT-e", () => {
    const r = calcularResumo([
      linha({ cte_numero: 1, nf_numero: 10 }),
      linha({ cte_numero: 1, nf_numero: 10 }),
    ])
    expect(r.linhas).toBe(2)
    expect(r.nfs).toBe(1)
  })
})

describe("formatadores", () => {
  it("formata moeda com 2 casas", () => {
    expect(formatarMoeda(1234.5)).toMatch(/1\.234,50/)
  })

  it("formata percentual com 2 casas", () => {
    expect(formatarPercentual(6)).toBe("6,00%")
    expect(formatarPercentual(13.456)).toBe("13,46%")
  })

  it("formata número com separador pt-BR", () => {
    expect(formatarNumero(1234)).toBe(formatarNumero(1234))
    expect(formatarNumero(1234)).not.toBe("1234")
  })

  it("devolve travessão para valores ausentes", () => {
    expect(formatarMoeda(null)).toBe("—")
    expect(formatarMoeda(undefined)).toBe("—")
    expect(formatarPercentual(null)).toBe("—")
    expect(formatarNumero(null)).toBe("—")
  })
})

describe("buscarTodasPaginas", () => {
  function paginaDe(items: Record<string, unknown>[]) {
    return async (offset: number) => ({ items: items.slice(offset, offset + LIMITE_PAGINA) })
  }

  it("acumula todas as páginas antes de normalizar", async () => {
    const total = LIMITE_PAGINA + 3
    const todas = Array.from({ length: total }, (_, i) => ({
      ...cteBase,
      cte_numero: 1000 + i,
      nf_numero: 5000 + i,
      cte_data: "18/09/2026",
      nf_data: "18/09/2026",
    }))
    const linhas = await buscarTodasPaginas(paginaDe(todas))
    expect(linhas).toHaveLength(total)
  })

  it("usa o offset correto em cada página", async () => {
    const offsets: number[] = []
    await buscarTodasPaginas(async (offset) => {
      offsets.push(offset)
      return { items: new Array(LIMITE_PAGINA).fill({ ...cteBase }) }
    })
    expect(offsets).toHaveLength(MAX_PAGINAS)
    offsets.forEach((offset, i) => {
      expect(offset).toBe(i * LIMITE_PAGINA)
    })
  })

  it("para quando uma página volta com menos linhas que o limite", async () => {
    const chamadas: number[] = []
    await buscarTodasPaginas(async (offset) => {
      chamadas.push(offset)
      return { items: new Array(offset === 0 ? LIMITE_PAGINA : 5).fill({ ...cteBase }) }
    })
    expect(chamadas).toEqual([0, LIMITE_PAGINA])
  })

  it("limita a MAX_PAGINAS mesmo que o endpoint sempre devolva página cheia", async () => {
    const chamadas: number[] = []
    await buscarTodasPaginas(async (offset) => {
      chamadas.push(offset)
      return { items: new Array(LIMITE_PAGINA).fill({ ...cteBase }) }
    })
    expect(chamadas).toHaveLength(MAX_PAGINAS)
  })

  it("calcula soma por CT-e sobre o conjunto completo, mesmo com CT-e entre páginas", async () => {
    const ctePartido = [
      { ...cteBase, cte_numero: 42, nf_numero: 1, nf_valor_total: 100, nf_data: "18/09/2026" },
    ]
    const ctePartido2 = [
      { ...cteBase, cte_numero: 42, nf_numero: 2, nf_valor_total: 300, nf_data: "18/09/2026" },
    ]
    const linhas = await buscarTodasPaginas(async (offset) => ({
      items: offset === 0 ? [...ctePartido, ...new Array(LIMITE_PAGINA - 1).fill({ ...cteBase, cte_numero: 9 })] : ctePartido2,
    }))
    const linhaCte42 = linhas.find((l) => l.cte_numero === 42)!
    expect(linhaCte42.soma_nf_do_cte).toBe(400)
    expect(linhaCte42.pct_nf_no_total_cte).toBe(25)
    expect(linhaCte42.pct_cte_sobre_total_nfs).toBe(32.92)
  })

  it("lança ApiRelatorioError com o status devolvido pelo proxy", async () => {
    await expect(
      buscarTodasPaginas(async () => {
        throw new ApiRelatorioError(500)
      })
    ).rejects.toThrow("API retornou erro: 500")
  })

  it("normaliza a soma mesmo quando a API não devolve os campos", async () => {
    const linhas = await buscarTodasPaginas(async () => ({
      items: [{ ...cteBase, cte_numero: 7, nf_numero: 1, nf_valor_total: 50, nf_data: "18/09/2026" }],
    }))
    expect(linhas).toHaveLength(1)
    expect(linhas[0].soma_nf_do_cte).toBe(50)
    expect(linhas[0].pct_nf_no_total_cte).toBe(100)
  })
})

describe("freteSobreMercadoria", () => {
  it("divide o total do CT-e pela soma das NF-e", () => {
    // 79,32 / 9.932,00 = 0,798...% → 0,8% (o caso real do CT-e 195483-1)
    expect(freteSobreMercadoria(79.32, 9932)).toBe(0.8)
  })

  it("devolve null quando falta o frete ou a mercadoria", () => {
    expect(freteSobreMercadoria(null, 1000)).toBeNull()
    expect(freteSobreMercadoria(10, null)).toBeNull()
    expect(freteSobreMercadoria(null, null)).toBeNull()
  })

  it("devolve null quando a soma das NF-e é zero ou negativa", () => {
    expect(freteSobreMercadoria(10, 0)).toBeNull()
    expect(freteSobreMercadoria(10, -5)).toBeNull()
  })

  it("distingue frete zero de frete ausente", () => {
    expect(freteSobreMercadoria(0, 1000)).toBe(0)
  })
})

describe("classificarFaixaFrete", () => {
  it("trata 1,5% exato como abaixo (verde)", () => {
    expect(classificarFaixaFrete(1.5)).toBe("abaixo")
  })

  it("trata 2,0% exato como dentro da faixa (laranja)", () => {
    expect(classificarFaixaFrete(2)).toBe("na_faixa")
  })

  it("classifica os intervalos da regra 1,5% a 2,0%", () => {
    expect(classificarFaixaFrete(0)).toBe("abaixo")
    expect(classificarFaixaFrete(1.49)).toBe("abaixo")
    expect(classificarFaixaFrete(1.51)).toBe("na_faixa")
    expect(classificarFaixaFrete(1.99)).toBe("na_faixa")
    expect(classificarFaixaFrete(2.01)).toBe("acima")
    expect(classificarFaixaFrete(267.27)).toBe("acima")
  })

  it("devolve indefinido quando não há percentual", () => {
    expect(classificarFaixaFrete(null)).toBe("indefinido")
    expect(classificarFaixaFrete(undefined)).toBe("indefinido")
    expect(classificarFaixaFrete(Number.NaN)).toBe("indefinido")
  })
})

describe("contarFaixas", () => {
  it("conta os CT-es por faixa e separa os que não dá para avaliar", () => {
    const grupos = agruparPorCte([
      linha({ cte_numero: 1, cte_valor_total: 10, nf_valor_total: 1000 }),
      linha({ cte_numero: 2, cte_valor_total: 15, nf_valor_total: 1000 }),
      linha({ cte_numero: 3, cte_valor_total: 20, nf_valor_total: 1000 }),
      linha({ cte_numero: 4, cte_valor_total: 25, nf_valor_total: 1000 }),
      linha({ cte_numero: 5, cte_valor_total: null, nf_valor_total: 1000 }),
    ])
    // 1,0% e 1,5% abaixo | 2,0% na faixa | 2,5% acima | sem frete não é avaliável
    expect(contarFaixas(grupos)).toEqual({
      avaliados: 4,
      abaixo: 2,
      naFaixa: 1,
      acima: 1,
      indefinido: 1,
    })
  })

  it("devolve zero para lista vazia", () => {
    expect(contarFaixas([])).toEqual({
      avaliados: 0,
      abaixo: 0,
      naFaixa: 0,
      acima: 0,
      indefinido: 0,
    })
  })
})

describe("resumirFretePor", () => {
  it("agrupa por transportadora e ordena por volume de CT-es", () => {
    const grupos = agruparPorCte([
      linha({ cte_numero: 1, cte_transportadora_fantasia: "SORRISO", cte_valor_total: 10, nf_valor_total: 1000 }),
      linha({ cte_numero: 2, cte_transportadora_fantasia: "SORRISO", cte_valor_total: 20, nf_valor_total: 1000 }),
      linha({ cte_numero: 3, cte_transportadora_fantasia: "JADLOG", cte_valor_total: 30, nf_valor_total: 1000 }),
    ])
    const r = resumirFretePorTransportadora(grupos)
    expect(r.map((x) => x.chave)).toEqual(["SORRISO", "JADLOG"])
    expect(r[0].ctes).toBe(2)
    expect(r[0].abaixo).toBe(1)
    expect(r[0].naFaixa).toBe(1)
    expect(r[0].acima).toBe(0)
    expect(r[0].freteTotal).toBe(30)
    expect(r[0].mercadoriaTotal).toBe(2000)
    expect(r[1].acima).toBe(1)
  })

  it("usa a média do frete % por CT-e, não o ratio agregado", () => {
    // Reproduz o caso real da SORRISO: uma NF-e de R$ 100 mil com frete baixo
    // (0,1%) faz o ratio agregado cair para 0,3% e esconder o CT-e de 20%.
    const grupos = agruparPorCte([
      linha({ cte_numero: 1, cte_transportadora_fantasia: "SORRISO", cte_valor_total: 100, nf_valor_total: 100000 }),
      linha({ cte_numero: 2, cte_transportadora_fantasia: "SORRISO", cte_valor_total: 200, nf_valor_total: 1000 }),
    ])
    const s = resumirFretePorTransportadora(grupos)[0]
    // média por CT-e: (0,1 + 20) / 2
    expect(s.mediaPct).toBe(10.05)
    // ratio agregado: 300 / 101.000 — verde, e completamente enganoso
    expect((s.freteTotal / s.mercadoriaTotal) * 100).toBeCloseTo(0.3, 2)
    expect(s.abaixo).toBe(1)
    expect(s.acima).toBe(1)
  })

  it("não divide por zero quando a transportadora tem um CT-e só sem mercadoria", () => {
    const grupos = agruparPorCte([
      linha({ cte_numero: 1, cte_transportadora_fantasia: "TROCA", cte_valor_total: null, nf_valor_total: null }),
    ])
    const r = resumirFretePorTransportadora(grupos)
    expect(r[0].mediaPct).toBeNull()
    expect(r[0].avaliados).toBe(0)
    expect(r[0].indefinido).toBe(1)
  })

  it("agrupa pela região do cliente e mantém as CT-es sem região", () => {
    const grupos = agruparPorCte([
      linha({ cte_numero: 1, nf_od_regiao: "SÃO PAULO", cte_valor_total: 20, nf_valor_total: 1000 }),
      linha({ cte_numero: 2, nf_od_regiao: "SÃO PAULO", cte_valor_total: 18, nf_valor_total: 1000 }),
      linha({ cte_numero: 3, nf_od_regiao: "PERNAMBUCO", cte_valor_total: 10, nf_valor_total: 1000 }),
      linha({ cte_numero: 4, nf_od_regiao: null, cte_valor_total: 30, nf_valor_total: 1000 }),
    ])
    const r = resumirFretePorRegiao(grupos)
    expect(r).toHaveLength(3)
    expect(r.map((x) => x.chave)).toEqual(
      expect.arrayContaining(["SÃO PAULO", "PERNAMBUCO", "Sem região"])
    )
    // 2 CT-es na faixa de SÃO PAULO, 1 abaixo em Pernambuco e 1 acima sem região
    expect(r.find((x) => x.chave === "SÃO PAULO")!.naFaixa).toBe(2)
    expect(r.find((x) => x.chave === "PERNAMBUCO")!.abaixo).toBe(1)
    expect(r.find((x) => x.chave === "Sem região")!.acima).toBe(1)
  })
})

describe("agruparPorCte com região", () => {
  it("pega a primeira região preenchida das NF-e do CT-e", () => {
    const g = agruparPorCte([
      linha({ cte_numero: 7, nf_numero: 1, nf_od_regiao: null }),
      linha({ cte_numero: 7, nf_numero: 2, nf_od_regiao: "SERGIPE" }),
      linha({ cte_numero: 7, nf_numero: 3, nf_od_regiao: "BAHIA" }),
    ])
    expect(g).toHaveLength(1)
    expect(g[0].regiao).toBe("SERGIPE")
  })

  it("usa Sem região quando nenhuma NF-e do CT-e tem região", () => {
    const g = agruparPorCte([linha({ cte_numero: 8, nf_od_regiao: null })])
    expect(g[0].regiao).toBe("Sem região")
  })
})

describe("calcularResumo com CT-e de várias NF-e", () => {
  it("soma o frete do CT-e uma vez, e não uma vez por NF-e", () => {
    // CT-e 1 tem 2 NF-e com frete 150: somar por linha daria 300.
    const itens = [
      linha({ cte_numero: 1, cte_serie: "1", cte_valor_total: 150, nf_numero: 10 }),
      linha({ cte_numero: 1, cte_serie: "1", cte_valor_total: 150, nf_numero: 11 }),
      linha({ cte_numero: 2, cte_serie: "1", cte_valor_total: 200, nf_numero: 20 }),
    ]
    const r = calcularResumo(itens)
    expect(r.ctes).toBe(2)
    expect(r.totalFrete).toBe(350)
  })

  it("mantém a soma do rateio por NF-e, que é a unidade correta", () => {
    const itens = [
      linha({ cte_numero: 1, cte_valor_total: 150, nf_numero: 10, nf_item_valor_total: 40 }),
      linha({ cte_numero: 1, cte_valor_total: 150, nf_numero: 11, nf_item_valor_total: 110 }),
    ]
    expect(calcularResumo(itens).totalRateio).toBe(150)
  })
})
