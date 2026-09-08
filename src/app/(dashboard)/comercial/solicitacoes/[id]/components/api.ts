import type { Solicitacao } from "../../types"

export async function fetchSolicitacao(id: string): Promise<Solicitacao> {
  const res = await fetch(`/api/solicitacoes/${id}?t=${Date.now()}`)
  if (!res.ok) throw new Error("Falha ao carregar solicitação")
  return res.json() as Promise<Solicitacao>
}
