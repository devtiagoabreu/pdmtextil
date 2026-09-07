export type Oportunidade = {
  id: number
  titulo: string
  descricao: string | null
  valorEstimado: string | null
  status: string
  leadId: number | null
  empresaId: number | null
  empresaNome: string | null
  clienteId: number | null
  clienteNome: string | null
  contatoId: number | null
  responsavelId: number | null
  responsavelNome: string | null
  dataFechamentoPrevista: string | null
  probabilidade: number | null
  motivoPerda: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

export type PropostaResumo = {
  id: number
  titulo: string
  valor: string | null
  status: string
  dataEnvio: string | null
  createdAt: string | Date
}

export type ContatoResumo = {
  nome: string | null
  cargo: string | null
  email: string | null
  telefone: string | null
}

export type OportunidadeDetalhe = Oportunidade & {
  contato: ContatoResumo | null
  propostas: PropostaResumo[]
}

export type EmpresaResumo = {
  id: number
  razaoSocial: string | null
  nomeFantasia: string | null
}

export type LeadResumo = {
  id: number
  nome: string | null
}

export type UsuarioResumo = {
  id: number
  name: string | null
}

export type OportunidadeForm = {
  titulo: string
  descricao: string
  valorEstimado: string
  empresaId: string
  clienteId: string
  leadId: string
  responsavelId: string
  dataFechamentoPrevista: string
  probabilidade: string
  status: string
}