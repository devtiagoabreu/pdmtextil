export const INICIO_ID = "inicio"
export const FIM_ID = "fim"
export const IDS_RESERVADOS = [INICIO_ID, FIM_ID]

export interface AtividadeSemantica {
  id: string
  nome: string
  responsavel?: string
  sistema?: string
  descricao?: string
}

export interface DecisaoSemantica {
  id: string
  pergunta: string
}

export interface FluxoSemantico {
  id: string
  de: string
  para: string
  rotulo?: string
}

export interface ModeloProcesso {
  schemaVersion?: string
  nome?: string
  objetivo?: string
  atividades: AtividadeSemantica[]
  decisoes: DecisaoSemantica[]
  fluxos: FluxoSemantico[]
}

export interface CanvasExcalidraw {
  elements: unknown[]
  appState?: Record<string, unknown>
  files?: Record<string, unknown>
}

export interface ResumoModelo {
  atividades: number
  decisoes: number
  fluxos: number
  nos: number
}

export interface ResultadoParseMermaid {
  modelo: ModeloProcesso | null
  erro?: string
}