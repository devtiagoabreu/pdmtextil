export interface Integracao {
  id: number
  nome: string
  baseUrl: string
  tipoAuth: string
  telas?: string[]
}

export interface ConferenciaRolo {
  op: string
  codigoRolo: string | null
  dep: string | null
  enderecoRolo: string | null
  sit: string | null
  item: string | null
  lote: string | null
  loteProduto: string | null
  quantidade: number
  pesoBruto: number
  operador: string | null
  nomeOperador: string | null
  dataInsercao: string | null
  pedido: string | null
  romaneio: string | null
}

export interface GrupoOp {
  op: string
  capa: ConferenciaRolo
  rolos: ConferenciaRolo[]
  totalRolos: number
  totalMetragem: number
  totalPesoBruto: number
}
