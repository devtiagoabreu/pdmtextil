export type LicaoLink = {
  label: string
  url: string
  descricao?: string | null
}

export type Licao = {
  id: number
  moduloId: number
  moduloTitulo: string
  moduloCor: string | null
  moduloIcone: string | null
  titulo: string
  conteudoMd: string
  preRequisitos: string | null
  linksPop: LicaoLink[]
  linksVideo: LicaoLink[]
  pathnameRelacionado: string | null
  ordem: number
  ativo: boolean
  createdAt: string
  updatedAt: string
}

export type LicaoResumo = {
  id: number
  titulo: string
  ordem: number
  ativo: boolean
  pathnameRelacionado: string | null
}

export type Modulo = {
  id: number
  titulo: string
  descricao: string | null
  icone: string | null
  cor: string | null
  ordem: number
  ativo: boolean
  licoes: LicaoResumo[]
}

export type ModuloResumo = {
  id: number
  titulo: string
}