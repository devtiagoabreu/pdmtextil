import type { BriefingTecelagem } from "@/types/briefing"

export type HistoricoComunicacao = {
  id?: number
  data?: string
  usuario?: string
  acao?: string
  mensagem?: string
  mensagens?: string[]
  de?: string
  para?: string
}

export type Anexo = {
  id: number
  solicitacaoId: number
  tipo: string
  titulo: string
  url: string
  nomeArquivo?: string | null
  tamanho?: number | null
  mimeType?: string | null
  idIntegracao?: string | null
  criadoPor?: number | null
  createdAt?: string | Date | null
}

export type ProdutoCru = {
  id: number
  codigoPdm: string
  descricao: string
  status: string
}

export type Solicitacao = {
  id: number
  tipo: string
  status: string
  solicitanteId: number
  responsavelId?: number | null
  cliente: string
  cnpj?: string | null
  projeto?: string | null
  briefing: Partial<BriefingTecelagem> | null
  historicoComunicacao?: HistoricoComunicacao[] | null
  observacoes?: string | null
  prazoDesejado?: string | null
  dataConclusao?: string | null
  idIntegracao?: string | null
  createdAt?: string | null
  updatedAt?: string | null
  anexos?: Anexo[]
}

export type SolicitacaoLista = {
  id: number
  tipo: string
  status: string
  cliente: string
  cnpj: string | null
  projeto: string | null
  prazoDesejado: string | null
  observacoes: string
  createdAt: string
  solicitanteId: number
  solicitanteNome: string | null
  anexosCount: number
  produtoId: number | null
  produtoCodigoPdm: string | null
  produtoIdIntegracao: string | null
  produtoIdIntegracaoErpCru: string | null
  produtoAmostrasCount: number
  chatExists: boolean
}