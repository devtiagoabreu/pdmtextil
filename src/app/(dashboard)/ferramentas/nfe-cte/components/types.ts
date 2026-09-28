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
  cte_valor_total: number | null
  cte_valor_frete: number | null
  cte_situacao: number | null
  cte_transportadora_razao: string | null
  cte_transportadora_fantasia: string | null
  cte_tomador_razao: string | null
  cte_tomador_fantasia: string | null
  soma_nf_do_cte: number | null
  pct_cte_sobre_total_nfs: number | null
  nf_numero: number | null
  nf_serie: string | null
  nf_data: string | null
  nf_valor_total: number | null
  pct_nf_no_total_cte: number | null
  nf_frete_rateado: number | null
  nf_situacao: number | null
  nf_fornecedor_razao: string | null
  nf_fornecedor_fantasia: string | null
}

export interface GrupoCte {
  chave: string
  numero: number | null
  serie: string | null
  data: string | null
  dataIso: string | null
  valorTotal: number | null
  valorFrete: number | null
  situacao: number | null
  transportadora: string
  tomador: string
  somaNf: number | null
  pctSobreNf: number | null
  somaNfCalculada: number
  pctCalculado: number | null
  nfs: LinhaCte[]
}

export interface Periodo {
  de: string
  ate: string
}

export interface Resumo {
  linhas: number
  ctes: number
  nfs: number
  semData: number
  comValorNf: number
  totalFrete: number
  totalNf: number
}
