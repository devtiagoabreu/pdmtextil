export type ViagemResumo = {
  id: number
  titulo: string
  descricao: string | null
  destinoCidade: string | null
  destinoUf: string | null
  dataInicio: string | null
  dataFim: string | null
  status: string
  criadoPor: number | null
  criadoPorNome: string | null
  totalInvestimento: number
  totalVisitas: number
  createdAt: string | Date
  updatedAt: string | Date
}

export type Investimento = {
  id: number
  viagemId: number
  tipo: string
  valor: string | null
  observacao: string | null
  createdAt: string | Date | null
}

export type VisitaResumo = {
  id: number
  dataVisita: string | null
  hora: string | null
  tipo: string | null
  status: string | null
  empresaId: number | null
  empresaNome: string | null
  clienteId: number | null
  clienteNome: string | null
  nomeAvulso: string | null
  relato: string | null
}

export type Viagem = Omit<ViagemResumo, "totalVisitas"> & {
  possivelRetorno: number
  retornoReal: number
  vendas: number
  investimentos: Investimento[]
  visitas: VisitaResumo[]
}

export type ViagemForm = {
  titulo: string
  descricao: string | null
  destinoCidade: string | null
  destinoUf: string | null
  dataInicio: string | null
  dataFim: string | null
  status: string
}