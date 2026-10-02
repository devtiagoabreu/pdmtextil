export interface Integracao {
  id: number
  nome: string
  baseUrl: string
  tipoAuth: string
  telas?: string[]
}

export interface LinhaCte {
  cte_numero: number | null
  cte_serie: string | null
  cte_data: string | null
  cte_data_transacao: string | null
  cte_valor_total: number | null
  cte_valor_frete: number | null
  cte_natureza: number | null
  cte_tipo_conhecimento: number | null
  cte_cod_cidade_origem: number | null
  cte_cod_cidade_destino: number | null
  cte_situacao: number | null
  cte_transportadora_razao: string | null
  cte_transportadora_fantasia: string | null
  cte_tomador_razao: string | null
  cte_tomador_fantasia: string | null
  soma_nf_do_cte: number | null
  soma_rateio_do_cte: number | null
  pct_cte_sobre_total_nfs: number | null
  nf_numero: number | null
  nf_serie: string | null
  nf_data: string | null
  nf_valor_total: number | null
  pct_nf_no_total_cte: number | null
  nf_frete_rateado: number | null
  nf_situacao: number | null
  nf_cliente_razao: string | null
  nf_cliente_fantasia: string | null
  nf_fornecedor_razao: string | null
  nf_fornecedor_fantasia: string | null
  nf_cab_origem: string | null
  nf_item_qtd: number | null
  nf_item_qtd_total: number | null
  nf_item_unidade: string | null
  nf_item_descricoes: string | null
  nf_item_valor_total: number | null
  nf_item_icms: number | null
  nf_pct_rateio_no_cte: number | null
  nf_valor_origem: string | null
  nf_od_pedido: number | null
  nf_od_data: string | null
  nf_od_valor: number | null
  nf_od_qtde: number | null
  nf_od_cliente_razao: string | null
  nf_od_cliente_fantasia: string | null
  nf_od_cod_cidade: number | null
  nf_od_cidade: string | null
  nf_od_regiao: string | null
  nf_od_representante: string | null
  nf_od_romaneio: number | null
  nf_od_qtde_rolos: number | null
  nf_od_peso_bruto: number | null
  nf_od_peso_liquido: number | null
  nf_od_faturamento: string | null
  nf_od_cfop: string | null
  nf_od_natureza: string | null
}

export interface GrupoCte {
  chave: string
  numero: number | null
  serie: string | null
  data: string | null
  dataTransacao: string | null
  dataIso: string | null
  valorTotal: number | null
  valorFrete: number | null
  natureza: number | null
  tipoConhecimento: number | null
  codCidadeOrigem: number | null
  codCidadeDestino: number | null
  situacao: number | null
  transportadora: string
  tomador: string
  /** Região do cliente/atendente da ordem de despacho (`nf_od_regiao`). */
  regiao: string
  somaNf: number | null
  somaRateio: number | null
  pctSobreNf: number | null
  somaNfCalculada: number
  somaRateioCalculada: number
  pctCalculado: number | null
  /** Rateio dos itens não bate com o total do CT-e (inconsistência de cadastro no ERP). */
  rateioDivergente: boolean
  nfs: LinhaCte[]
}

export interface Periodo {
  de: string
  ate: string
}

/**
 * Uma NF-e dentro de uma ordem de despacho.
 *
 * `metros` e `valor` são **da nota** (`nf_od_qtde` = `qtde_saida` e
 * `nf_od_valor`, agrupados por NF-e no SQL), então somam direto.
 *
 * `volumes` **não é da nota**: `nf_od_qtde_rolos` é o
 * `COUNT(DISTINCT codigo_rolo)` do romaneio do *pedido*, repetido em todas as
 * NF-e desse pedido. Por isso o campo só vem preenchido na primeira NF-e do
 * pedido dentro da ordem (`repetido` = false) e as demais vêm com `null` +
 * `repetido` = true, para o total da ordem não contar o mesmo rolo N vezes.
 */
export interface NotaDespacho {
  chave: string
  nfNumero: number | null
  nfSerie: string | null
  nfData: string | null
  /** CT-e que transportou a nota — de onde vem a transportadora da ordem. */
  cteNumero: number | null
  cteSerie: string | null
  transportadora: string
  pedido: number | null
  romaneio: number | null
  cliente: string
  cidade: string
  regiao: string
  /** Metragem faturada/despachada nesta nota (`nf_od_qtde`), em metros. */
  metros: number | null
  /** Volumes (rolos) do romaneio do pedido; só na 1ª NF-e do pedido. */
  volumes: number | null
  /** A NF-e repete volumes/peso que já entraram na 1ª NF-e do mesmo pedido. */
  repetido: boolean
  valor: number | null
  rateio: number | null
}

/**
 * Ordem de despacho: as NF-e que saíram **no mesmo dia pela mesma
 * transportadora** — a carga de um caminhão, que pode levar várias notas,
 * de vários pedidos e para vários destinos.
 *
 * A chave é `transportadora + data de despacho`. Não é pedido/romaneio: o
 * pedido é a fase anterior da nota (romaneado e depois faturado), e as NF-e de
 * um mesmo pedido saem em datas diferentes. Medido em 03/10/2026 (907 NF-e
 * despachadas na janela): por transportadora+data são 300 ordens (125 com uma
 * NF-e, até 12 NF-e e até 12 destinos); por pedido+romaneio seriam 884 ordens,
 * quase todas de uma nota só — que é o grupo errado para quem opera o despacho.
 *
 * Uma carga costuma reunir mais de um pedido, então `pedido`/`romaneio` não
 * vivem aqui: ficam na nota.
 */
export interface OrdemDespacho {
  chave: string
  data: string | null
  dataIso: string | null
  transportadora: string
  notas: NotaDespacho[]
  /** Romaneios distintos que entraram nesta carga. */
  romaneios: number[]
  /** Cidades de destino da carga; pode ter várias (entrega multi-destino). */
  destinos: string[]
  regioes: string[]
  /** Volume (rolos) somado dos romaneios da carga, contando cada um uma vez. */
  volumes: number | null
  /** Metragem somada das notas — é exato, cada NF-e tem a sua. */
  metros: number
  valor: number
  pesoBruto: number | null
  pesoLiquido: number | null
}

export interface ResumoDespacho {
  notas: number
  ordens: number
  romaneios: number
  /** Volumes (rolos) somados dos romaneios, sem repetir o mesmo rolo. */
  volumes: number | null
  metros: number
  valor: number
  semDespacho: number
  transportadoras: number
}

export interface Resumo {
  linhas: number
  ctes: number
  nfs: number
  semData: number
  comValorNf: number
  semCabecalho: number
  comDespacho: number
  totalFrete: number
  totalNf: number
  totalRateio: number
  ctesRateioDivergente: number
}

/**
 * Faixa do frete sobre a mercadoria, pela regra do negócio (frete esperado
 * entre 1,5% e 2,0% do valor da nota):
 *
 * - `abaixo`: até 1,5% → verde
 * - `na_faixa`: acima de 1,5% e até 2,0% → laranja
 * - `acima`: acima de 2,0% → vermelho
 * - `indefinido`: falta o valor do frete ou o da mercadoria → cinza
 */
export type FaixaFrete = "abaixo" | "na_faixa" | "acima" | "indefinido"

/**
 * Contagem de CT-es por faixa. Usado no topo (total geral) e nos breakdowns
 * por transportadora / região.
 */
export interface ContagemFaixas {
  avaliados: number
  abaixo: number
  naFaixa: number
  acima: number
  indefinido: number
}

/** Uma linha dos breakdowns por transportadora / região. */
export interface ResumoFrete extends ContagemFaixas {
  chave: string
  ctes: number
  /** Média do frete % POR CT-e (não Σfrete ÷ Σmercadoria, que distorce). */
  mediaPct: number | null
  freteTotal: number
  mercadoriaTotal: number
}
