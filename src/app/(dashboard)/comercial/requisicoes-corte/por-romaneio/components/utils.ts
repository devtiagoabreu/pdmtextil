import type { OrientacaoPdf, ProdutoAgrupado, Rolo } from "./types"

export function formatarData(data: string | null | undefined): string {
  if (!data) return "—"
  try {
    return new Date(data).toLocaleDateString("pt-BR")
  } catch {
    return data
  }
}

export function formatarMetragem(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—"
  return `${Number(valor).toFixed(1)} m`
}

export function formatarPeso(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—"
  return `${Number(valor).toFixed(4)} kg`
}

export const ORIENTACAO_LABEL: Record<OrientacaoPdf, string> = {
  portrait: "Retrato",
  landscape: "Paisagem",
}

export function agruparProdutos(rolos: Rolo[]): ProdutoAgrupado[] {
  const map = new Map<string, Rolo[]>()
  for (const r of rolos) {
    const key = r.produto || "SEM PRODUTO"
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(r)
  }
  const produtos: ProdutoAgrupado[] = []
  for (const [nome, rolos] of map) {
    const total = rolos.reduce((acc: any, r: any) => acc + (r.quantidade || 0), 0)
    produtos.push({
      nome,
      narrativa: rolos[0]?.narrativa || "",
      cor: rolos[0]?.cor || "",
      totalMetragem: total,
      rolos,
    })
  }
  return produtos.sort((a: any, b: any) => a.nome.localeCompare(b.nome))
}
