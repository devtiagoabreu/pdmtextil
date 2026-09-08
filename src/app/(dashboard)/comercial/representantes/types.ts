export type Representante = {
  id: number
  nome: string
  cnpj: string
  razaoSocial: string | null
  email: string | null
  telefone: string | null
  contato: string | null
  endereco: string | null
  cidade: string | null
  uf: string | null
  gerenteId: number | null
  ativo: boolean | null
  idIntegracao: string | null
  createdAt: string | Date
  updatedAt: string | Date
}

export type ClienteVinculado = {
  id: number
  nome: string
}

export type RepresentanteComClientes = Representante & {
  clientes: ClienteVinculado[]
}

export type ConsultaCnpjData = {
  razao_social?: string | null
  nome_fantasia?: string | null
  situacao_cadastral?: string | null
  logradouro?: string | null
  municipio?: string | null
  uf?: string | null
}