export type Campanha = {
  id: number
  nome: string
  tipo: string
  descricao: string | null
  dataInicio: string | null
  dataFim: string | null
  orcamento: number | string | null
  leadsGerados: number | null
  custoAquisicao: number | string | null
  status: string
  criadoPor: number | null
  createdAt: string | Date
}

export type CampanhaForm = {
  nome: string
  tipo: string
  descricao: string | null
  dataInicio: string | null
  dataFim: string | null
  orcamento: number | string | null
  leadsGerados: number | null
  custoAquisicao: number | string | null
  status: string
}