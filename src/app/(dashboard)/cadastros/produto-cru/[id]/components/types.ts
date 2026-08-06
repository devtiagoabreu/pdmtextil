export type FichaTecnica = {
  gramatura?: string
  gramaturaLinear?: string
  largura?: string
  passamento?: string
  batidas?: string
  densidade?: string
  ligamento?: string
  qtdeFiosUrdume?: string
  observacoes?: string
}

export type ProdutoCru = {
  id: number
  codigoPdm: string
  descricao: string
  solicitacaoDesenvolvimentoId?: number | null
  status: string
  fichaTecnica?: FichaTecnica | null
  links?: { url: string; descricao: string }[]
  ativo: boolean
  idIntegracaoErpCru?: string | null
  idIntegracao?: string | null
}

export interface Composicao {
  id: number
  material: string
  percentual: string
}

export interface Estrutura {
  id: number
  tipo: string
  fioId?: number | null
  baseUrdumeId?: number | null
  ordem?: number | null
}

export interface Amostra {
  id: number
  descricao?: string
  status: string
  motivoAprovacao?: string
  observacoes?: string
  links?: { url: string; descricao: string }[]
  data: string
  quantidadeProduzida?: string
  idIntegracaoErpCru?: string
  dados: Record<string, string> | null
}

export interface Acabamento {
  id: number
  tipoAcabamento: string
  descricao?: string
  idIntegracaoErpAcabado?: string
  possuiReceita: boolean
  amostras: AcabamentoAmostra[]
}

export interface AcabamentoAmostra {
  id: number
  descricao?: string
  status: string
  motivoAprovacao?: string
  observacoes?: string
  links?: { url: string; descricao: string }[]
  data: string
  quantidadeProduzida?: string
  dados: Record<string, string> | null
}

export interface DeleteTarget {
  type: string
  label: string
  fn: () => void
}

export interface MotivoModalState {
  open: boolean
  target: { type: "amostra" | "acabamento"; id: number; acabamentoId?: number }
  novoStatus: string
}

export type StatusOption = { value: string; label: string }

export type LinkItem = { url: string; descricao: string }

export type Fio = { id: number; codigoFio: string; nome: string; idIntegracao: string | null }

export type BaseUrdume = { id: number; nome: string; idIntegracao: string | null }

export type Solicitacao = { id: number; cliente: string; projeto: string }
