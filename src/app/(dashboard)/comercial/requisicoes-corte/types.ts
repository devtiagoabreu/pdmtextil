export interface ItemOcr {
  codigoProduto: string
  ordem: string
  artigo: string
  cor: string
  desenho: string
  quantidade: string
}

export interface RequisicaoCorteItem {
  id?: number
  codigoProduto: string
  ordem: string
  artigo: string
  cor: string
  desenho: string
  quantidade: string
  clienteId: number | null
  clienteNome: string | null
  fornecedorId: number | null
  fornecedorNome: string | null
  representanteId: number | null
  representanteNome: string | null
}

export interface RequisicaoCorteLista {
  id: number
  requisitanteId: number | null
  requisitanteNome: string | null
  status: string
  observacoes: string | null
  entreguePor: string | null
  dataSolicitacao: string | null
  dataEntrega: string | null
  createdAt: string | null
  updatedAt: string | null
  totalCortes: number
  quantidadeTotal: string
}

export interface RequisicaoCorteDetalhe {
  id: number
  requisitanteId: number | null
  requisitanteNome: string | null
  status: string
  observacoes: string | null
  entreguePor: string | null
  dataSolicitacao: string | null
  dataEntrega: string | null
  clienteId: number | null
  clienteNome: string | null
  fornecedorId: number | null
  fornecedorNome: string | null
  representanteId: number | null
  representanteNome: string | null
  createdAt: string | null
  updatedAt: string | null
  itens: RequisicaoCorteItem[]
}

export interface RequisicaoCopia {
  itens: RequisicaoCorteItem[]
  observacoes?: string
  entreguePor?: string
  dataSolicitacao?: string
  dataEntrega?: string
  clienteId?: number
  clienteNome?: string
  fornecedorId?: number
  fornecedorNome?: string
  representanteId?: number
  representanteNome?: string
}