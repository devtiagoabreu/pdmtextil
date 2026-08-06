import type { Chat, Mensagem } from "./types"

export async function fetchChats(): Promise<Chat[]> {
  const res = await fetch("/api/chats")
  if (!res.ok) throw new Error("Erro ao carregar chats")
  return res.json()
}

export async function fetchMensagens(chatId: number): Promise<{ mensagens: Mensagem[] }> {
  const res = await fetch(`/api/chats/${chatId}/mensagens`)
  if (!res.ok) throw new Error("Erro ao carregar mensagens")
  return res.json()
}

export async function enviarMensagem({ chatId, mensagem }: { chatId: number; mensagem: string }) {
  const res = await fetch(`/api/chats/${chatId}/mensagens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mensagem }),
  })
  if (!res.ok) throw new Error("Erro ao enviar mensagem")
  return res.json()
}

export async function marcarLidas(chatId: number) {
  await fetch(`/api/chats/${chatId}/ler`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  })
}
