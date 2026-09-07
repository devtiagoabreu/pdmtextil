export type PedidoVendaResumo = {
  id: number
  oportunidadeId: number
  oportunidadeTitulo: string | null
  numero: string | null
  dataEmissao: string | null
  status: string
  observacao: string | null
  origem: string
  referenciaExterna: string | null
  total: number
  itensCount: number
  createdAt: string | Date | null
  updatedAt: string | Date | null
}

export type PedidoVendaItem = {
  id: number
  pedidoVendaId: number
  produto: string
  codigo: string | null
  unidade: string
  unidadeOutra: string | null
  quantidade: string | null
  valorUnitario: string | null
  valorTotal: string | null
  createdAt: string | Date | null
}

export type PedidoVenda = Omit<PedidoVendaResumo, "total" | "itensCount"> & {
  itens: PedidoVendaItem[]
}

export type PedidoVendaForm = {
  oportunidadeId: string
  numero: string
  dataEmissao: string
  status: string
  observacao: string
  origem: string
  referenciaExterna: string
}