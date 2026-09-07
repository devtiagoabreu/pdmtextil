export type Contato = {
  id: number
  nome: string
  cargo: string | null
  email: string | null
  telefone: string | null
  celular: string | null
  whatsapp: string | null
  principal: boolean
  observacoes: string | null
  empresaId: number | null
  empresaNome: string | null
  empresaRazaoSocial: string | null
  empresaNomeFantasia: string | null
  clienteId: number | null
  clienteNome: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

export type EmpresaResumo = {
  id: number
  razaoSocial: string | null
  nomeFantasia: string | null
  nome?: string | null
}

export type ClienteResumo = {
  id: number
  nome: string
}

export type ContatoForm = {
  nome: string
  cargo: string
  email: string
  telefone: string
  celular: string
  whatsapp: string
  principal: boolean
  observacoes: string
  empresaId: string
  clienteId: string
}

export type VinculoTipo = "none" | "pessoa" | "cliente"

export type ContatoFormState = {
  nome: string
  cargo: string
  email: string
  telefone: string
  celular: string
  whatsapp: string
  principal: boolean
  observacoes: string
  empresaId: string | number | null
  clienteId: string | number | null
}