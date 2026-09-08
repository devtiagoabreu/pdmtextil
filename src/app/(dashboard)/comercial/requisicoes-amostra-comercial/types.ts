export type ItemHistoricoAmostra = {
  id?: number | null
  data?: string | null
  acao?: string | null
  status?: string | null
  descricao?: string | null
  observacao?: string | null
  usuario?: string | null
  de?: string | null
  para?: string | null
}

export type ProdutoAmostra = {
  id: number
  codigoPdm: string | null
  descricao: string | null
}

export type RequisicaoAmostraLista = {
  id: number
  status: string
  titulo: string | null
  cliente: string | null
  quantidade: string | null
  produtoCodigo: string | null
  produtoDescricao: string | null
  solicitanteNome: string | null
  createdAt: string | null
  prazoDesejado: string | null
}

export type RequisicaoAmostraDetalhe = {
  id: number
  status: string
  solicitanteId: number | null
  responsavelId: number | null
  cliente: string | null
  produtoCruId: number | null
  solicitacaoDesenvolvimentoId: number | null
  titulo: string | null
  quantidade: string | null
  motivo: string | null
  observacoes: string | null
  historico: ItemHistoricoAmostra[]
  prazoDesejado: string | null
  createdAt: string | null
  updatedAt: string | null
  produtoCodigo: string | null
  produtoDescricao: string | null
  solicitanteNome: string | null
  responsavelNome: string | null
  produto?: ProdutoAmostra | null
}

export type NovaRequisicaoAmostra = {
  produtoCruId: number
  titulo: string
  cliente: string | null
  quantidade: string | null
  motivo: string | null
  observacoes: string | null
  prazoDesejado: string | null
  solicitacaoDesenvolvimentoId: number | null
}