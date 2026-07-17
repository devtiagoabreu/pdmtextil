export interface Modelo {
  id: number
  nome: string
  assunto: string
  html: string
  createdAt: string
  updatedAt: string
}

export interface Lista {
  id: number
  nome: string
  descricao: string | null
  totalContatos: number
  createdAt: string
  updatedAt: string
}

export interface ListaComContatos extends Lista {
  contatos: Contato[]
}

export interface Contato {
  id: number
  listaId: number
  nome: string
  email: string
}

export interface Envio {
  id: number
  email: string
  nome: string | null
  assunto: string
  status: string
  error: string | null
  abertoEm: string | null
  createdAt: string
  totalCliques: number
}

export interface HistoricoData {
  envios: Envio[]
  stats: {
    total: number
    enviados: number
    lidos: number
    falhas: number
    totalCliques: number
  }
}

export const FONT_SIZES = [
  { label: "Pequeno", value: "1" },
  { label: "Normal", value: "3" },
  { label: "Grande", value: "4" },
  { label: "M. Grande", value: "5" },
  { label: "Enorme", value: "6" },
]

export const FONT_FAMILIES = [
  "Arial", "Times New Roman", "Courier New", "Georgia", "Verdana", "Tahoma", "Trebuchet MS",
  "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Inter", "Nunito",
  "Raleway", "Ubuntu", "Playfair Display", "Merriweather", "Oswald", "Noto Sans",
  "Source Sans Pro", "PT Sans", "Quicksand", "Work Sans",
]
