export const ROLES_PERMITIDOS = ["COMERCIAL", "DESENVOLVIMENTO", "QUALIDADE", "PCP", "ADMIN", "SUDO"]

export interface StatusCol {
  nome: string
  rotulo: string
  cor: string | null
}

export interface Solicitacao {
  id: number
  tipo: string
  status: string
  cliente: string
  projeto: string | null
  prazoDesejado: string | null
  createdAt: string
  solicitanteNome: string
  chatExists?: boolean
  produtoId?: number | null
  produtoCodigoPdm?: string | null
  produtoIdIntegracao?: string | null
  produtoAmostrasCount?: number
}

export interface ChatMensagem {
  remetenteNome: string
  mensagem: string
  createdAt: string
}

export interface AmostraItem {
  tipo: string
  descricao: string | null
  status: string
  id: number
  scrollId: string
}

export interface PilotagemAmostra {
  id: number
  tipo: "tecido_cru" | "acabamento"
  descricao: string | null
  status: string
  produtoCruId: number
  acabamentoId?: number
  rotulo: string
}
