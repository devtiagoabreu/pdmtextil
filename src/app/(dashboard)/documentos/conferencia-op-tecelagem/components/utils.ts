import type { ConferenciaRolo, GrupoOp } from "./types"

export function pick(obj: Record<string, unknown>, ...names: string[]): unknown {
  if (!obj || typeof obj !== "object") return undefined
  for (const n of names) {
    if (n in obj) return obj[n]
  }
  const lower = new Map<string, unknown>()
  for (const [k, v] of Object.entries(obj)) lower.set(k.toLowerCase().replace(/[^a-z0-9]/g, ""), v)
  for (const n of names) {
    const key = n.toLowerCase().replace(/[^a-z0-9]/g, "")
    if (lower.has(key)) return lower.get(key)
  }
  return undefined
}

export function num(val: unknown): number {
  const n = Number(val)
  return Number.isFinite(n) ? n : 0
}

export function str(val: unknown): string {
  if (val === null || val === undefined) return ""
  return String(val)
}

export function normalizeRolo(raw: Record<string, unknown>): ConferenciaRolo {
  return {
    op: str(pick(raw, "op", "OP")),
    nivel: str(pick(raw, "nivel", "NIVEL")).trim() || null,
    grupo: str(pick(raw, "grupo", "GRUPO")).trim() || null,
    sub: str(pick(raw, "sub", "SUB")).trim() || null,
    codigoRolo: str(pick(raw, "codigoRolo", "CODIGO_ROLO", "codigo_rolo")),
    dep: str(pick(raw, "dep", "DEP")),
    enderecoRolo: pick(raw, "enderecoRolo", "ENDERECO_ROLO", "endereco_rolo") != null
      ? str(pick(raw, "enderecoRolo", "ENDERECO_ROLO", "endereco_rolo"))
      : null,
    sit: str(pick(raw, "sit", "SIT", "situacao", "SITUACAO")),
    item: str(pick(raw, "item", "ITEM", "produto", "PRODUTO")),
    lote: str(pick(raw, "lote", "LOTE")),
    loteProduto: str(pick(raw, "loteProduto", "LOTE_PRODUTO", "lote_produto")),
    quantidade: num(pick(raw, "quantidade", "QUANTIDADE", "metragem", "METRAGEM")),
    pesoBruto: num(pick(raw, "pesoBruto", "PESO_BRUTO", "peso_bruto")),
    operador: str(pick(raw, "operador", "OPERADOR")),
    nomeOperador: str(pick(raw, "nomeOperador", "NOME_OPERADOR", "nome_operador")),
    dataInsercao: str(pick(raw, "dataInsercao", "DATA_INSERCAO", "data_insercao")),
    pedido: str(pick(raw, "pedido", "PEDIDO")),
    romaneio: str(pick(raw, "romaneio", "ROMANEIO")),
  }
}

export function extractItems(body: unknown): Record<string, unknown>[] {
  if (!body || typeof body !== "object") return []
  const b = body as Record<string, unknown>
  const raw =
    (Array.isArray(b.items) && b.items) ||
    (Array.isArray(b.data) && b.data) ||
    (Array.isArray(b.result) && b.result)
  if (Array.isArray(raw)) return raw as Record<string, unknown>[]
  if (Array.isArray(b)) return b as Record<string, unknown>[]
  return []
}

export function formatarData(valor: string | null | undefined): string {
  if (!valor) return "—"
  const d = new Date(valor)
  if (isNaN(d.getTime())) return valor
  return d.toLocaleDateString("pt-BR")
}

export function formatarMetragem(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—"
  return `${Number(valor).toFixed(1)} m`
}

export function formatarPeso(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return "—"
  return `${Number(valor).toFixed(2)} kg`
}

export function montarProduto(rolo: Pick<ConferenciaRolo, "nivel" | "grupo" | "sub" | "item"> | null | undefined): string {
  if (!rolo) return ""
  return [rolo.nivel, rolo.grupo, rolo.sub, rolo.item]
    .filter((parte): parte is string => typeof parte === "string" && parte.trim() !== "")
    .map((parte) => parte.trim())
    .join(".")
}

export function buildGrupos(itens: ConferenciaRolo[], ordem: "asc" | "desc" = "desc"): GrupoOp[] {
  const map = new Map<string, GrupoOp>()
  for (const item of itens) {
    const op = item.op || "SEM OP"
    let grupo = map.get(op)
    if (!grupo) {
      grupo = { op, produto: montarProduto(item), capa: item, rolos: [], totalRolos: 0, totalMetragem: 0, totalPesoBruto: 0 }
      map.set(op, grupo)
    }
    grupo.rolos.push(item)
    grupo.totalRolos++
    grupo.totalMetragem += item.quantidade || 0
    grupo.totalPesoBruto += item.pesoBruto || 0
  }
  const fator = ordem === "desc" ? -1 : 1
  return Array.from(map.values()).sort(
    (a, b) => fator * a.op.localeCompare(b.op, undefined, { numeric: true }),
  )
}
