export type Chat = {
  id: number
  tipo: string
  titulo: string
  entidadeTipo: string | null
  entidadeId: number | null
  criadoPor: number
  updatedAt: string
  createdAt: string
  ultimaMensagem: string | null
  ultimaMensagemData: string | null
  naoLidas: number
  participantes: number
}

export type Mensagem = {
  id: number
  chatId: number
  remetenteId: number
  mensagem: string
  createdAt: string
  remetenteNome?: string
}
