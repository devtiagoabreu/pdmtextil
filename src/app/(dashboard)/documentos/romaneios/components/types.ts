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
  data_entrada: string
  op: number
  nome_operador: string
  largura: number
  gramatura: number
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
  vendido: number
  saldo: number
  unitario: number
  valor_vendido: number
}

export interface GrupoRomaneio {
  romaneio: number
  capa: Rolo
  rolos: Rolo[]
  totalRolos: number
  totalMetragem: number
  totalPesoBruto: number
  totalPesoLiquido: number
}

export type OrientacaoPdf = "portrait" | "landscape"
