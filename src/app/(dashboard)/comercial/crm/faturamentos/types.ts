export type FaturamentoResumo = {
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

export type FaturamentoItem = {
  id: number
  faturamentoId: number
  produto: string
  codigo: string | null
  unidade: string
  unidadeOutra: string | null
  quantidade: string | null
  valorUnitario: string | null
  valorTotal: string | null
  createdAt: string | Date | null
}

export type Faturamento = Omit<FaturamentoResumo, "total" | "itensCount"> & {
  itens: FaturamentoItem[]
}

export type FaturamentoForm = {
  oportunidadeId: string
  numero: string
  dataEmissao: string
  status: string
  observacao: string
  origem: string
  referenciaExterna: string
}