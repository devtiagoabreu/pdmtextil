export interface Integracao {
  id: number
  nome: string
  baseUrl: string
  tipoAuth: string
  telas?: string[]
}

export interface Rolo {
  romaneio: number
  codigo_rolo: number
  produto: string
  narrativa: string
  lote: number
  lote_produto: string
  quantidade: number
  peso_bruto: number
  peso_liquido: number
  largura: number
  endereco_rolo: string | null
  pedido: number
  situacao: string
  emissao: string
  entrega: string
  chegada: string | null
  cnpj: string
  nome_cliente: string
  fantasia: string
  cidade: string
  uf: string
  nome_represenante: string
  nome_regiao: string
  linha: string
  grupo: string
  sub: string
  cor: string
}

export interface ProdutoAgrupado {
  nome: string
  narrativa: string
  cor: string
  totalMetragem: number
  rolos: Rolo[]
}

export interface GrupoRomaneio {
  romaneio: number
  capa: Rolo
  rolos: Rolo[]
  produtos: ProdutoAgrupado[]
  totalRolos: number
  totalMetragem: number
  totalPesoBruto: number
  totalPesoLiquido: number
}

export type OrientacaoPdf = "portrait" | "landscape"

export interface ItemCorteDialog {
  produto: string
  narrativa: string
  cor: string
  metragemDisponivel: number
  metragem: string
}
