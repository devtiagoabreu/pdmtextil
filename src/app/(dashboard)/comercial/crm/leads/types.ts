export type Lead = {
  id: number
  nome: string
  tipoPessoa: string | null
  documento: string | null
  email: string | null
  telefone: string | null
  celular: string | null
  empresaNome: string | null
  cargo: string | null
  origem: string | null
  status: string
  descricao: string | null
  pessoaId: number | null
  segmentoIa: string | null
  porteIa: string | null
  createdAt: string
  updatedAt: string
}

export type MensagemWhatsapp = {
  id: number
  mensagem: string
  tipo: "RECEBIDA" | "ENVIADA"
  status: string
  createdAt: string
}