export interface InvestimentoLinha {
  tipo: string
  valor: string
  observacao: string
}

export interface Investimento {
  id: number
  viagemId: number
  tipo: string
  valor: string | null
  observacao: string | null
  createdAt: Date | string | null
}

export function normalizarInvestimentos(body: any): Omit<Investimento, "id" | "viagemId" | "createdAt">[] {
  if (!Array.isArray(body.investimentos)) return []
  return body.investimentos
    .filter((i: any) => i?.tipo)
    .map((i: any) => ({
      tipo: String(i.tipo).trim(),
      valor: i.valor != null && i.valor !== "" ? i.valor : null,
      observacao: i.observacao?.trim() || null,
    }))
}

export function linhaParaForm(inv: Investimento | any): InvestimentoLinha {
  return {
    tipo: inv.tipo || "PASSAGEM",
    valor: inv.valor != null ? String(inv.valor) : "",
    observacao: inv.observacao || "",
  }
}
