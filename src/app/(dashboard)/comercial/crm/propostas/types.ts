export type Proposta = {
  id: number
  titulo: string
  valor: string | number | null
  status: string
  empresaId: number | null
  empresaNome: string | null
  clienteId: number | null
  clienteNome: string | null
  oportunidadeId: number | null
  descricao: string | null
  condicoesPagamento: string | null
  prazoEntrega: string | null
  arquivoUrl: string | null
  dataEnvio: string | Date | null
  dataResposta: string | Date | null
  criadoPor: number | null
  createdAt: string | Date
}

export type PropostaCreate = {
  titulo: string
  empresaId: number | null
  clienteId: number | null
  oportunidadeId: number | null
  valor: number | null
  descricao: string
  condicoesPagamento: string
  prazoEntrega: string
  arquivoUrl: string | null
}

export type PropostaUpdate = {
  titulo: string
  valor: number | null
  prazoEntrega: string
  condicoesPagamento: string
  descricao: string
  arquivoUrl: string | null
}