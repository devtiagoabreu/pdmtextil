export interface Tela {
  id: string
  label: string
  href: string
  module: string
}

export interface MenuItem {
  id: number
  titulo: string
  url: string
  ordem: number
}

export interface Menu {
  id: number
  titulo: string
  icone?: string | null
  ordem: number
  itens: MenuItem[]
}
