import type { Contato } from "../crm/contatos/types"

export type Cliente = {
  id: number
  nome: string
  cnpj: string
  razaoSocial: string | null
  email: string | null
  emailNf: string | null
  telefone: string | null
  celular: string | null
  contato: string | null
  segmento: string | null
  endereco: string | null
  cidade: string | null
  uf: string | null
  ativo: boolean | null
  idIntegracao: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

export type VinculoRepresentante = {
  id: number
  clienteId: number
  representanteId: number
  nome: string
  cnpj: string
  cidade: string
  uf: string
  email: string
  telefone: string
  contato: string
  createdAt: string | Date
}

export type RepresentanteResumo = {
  id: number
  nome: string
  cnpj: string
  cidade: string | null
  uf: string | null
}

export type SolicitacaoResumo = {
  id: number
  tipo: string
  status: string
  cliente: string
  projeto: string | null
  prazoDesejado: string | null
  createdAt: string
  solicitanteNome: string | null
}

export type AmostraResumo = {
  id: number
  tipoAmostra: string
  descricao: string | null
  status: string
  produtoCodigo: string
  produtoDescricao: string
  acabamentoDescricao?: string | null
}

export type { Contato }