export interface SheetTab {
  name: string
  gid: number
  header: string[]
  rows: Record<string, string>[]
}

export interface BiSheet {
  id: string
  url: string
  title: string
  tabs: SheetTab[]
  relationships: Relationship[]
  loadedAt: string
}

export interface Relationship {
  fromTab: string
  fromColumn: string
  toTab: string
  toColumn: string
  type: "equal" | "contains"
}

export interface ProductClient {
  razaoSocial: string
  cidade: string
  uf: string
  ultimaData: string
  totalFaturado: number
  ticketMedio: number
  ultimaNF: string
  quantidadeTotal: number
}

export interface MetricCard {
  label: string
  value: string | number
  change?: number
  prefix?: string
}

export interface AbcItem {
  grupo: string
  valorTotal: number
  percentual: number
  acumulado: number
  classe: string
}
