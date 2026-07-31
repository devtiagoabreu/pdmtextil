import type { SheetTab, BiSheet, Relationship, ProductClient, AbcItem } from "./types"
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs"
import { join } from "path"
import { tmpdir } from "os"

function resolveCacheDir(): string {
  const override = process.env.BI_CACHE_DIR
  if (override) return override

  const tmp = join(tmpdir(), ".bi-cache")
  try {
    mkdirSync(tmp, { recursive: true })
    return tmp
  } catch {
    return join(process.cwd(), ".bi-cache")
  }
}

let cacheDir: string | null = null
function getCacheDir(): string | null {
  if (cacheDir) return cacheDir
  try {
    cacheDir = resolveCacheDir()
    mkdirSync(cacheDir, { recursive: true })
    return cacheDir
  } catch {
    return null
  }
}

function cachePath(id: string) {
  const dir = getCacheDir()
  return dir ? join(dir, `${id}.json`) : null
}

function extractSheetId(url: string): string | null {
  const m = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  return m?.[1] ?? null
}

function parseCsvLine(line: string): string[] {
  const result: string[] = []
  let current = ""
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim())
      current = ""
    } else {
      current += ch
    }
  }
  result.push(current.trim())
  return result
}

function parseNumber(val: string): number {
  const cleaned = val
    .replace(/\./g, "")
    .replace(",", ".")
    .replace(/[^0-9.\-]/g, "")
  const n = Number.parseFloat(cleaned)
  return Number.isNaN(n) ? 0 : n
}

async function fetchTabCsv(sheetId: string, gid: number): Promise<string | null> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${gid}`
    const res = await fetch(url)
    if (!res.ok) return null
    const text = await res.text()
    if (text.length < 50 || text.includes("<!DOCTYPE")) return null
    return text
  } catch {
    return null
  }
}

function parseCsv(text: string): { header: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split("\n")
  if (lines.length < 2) return { header: [], rows: [] }

  const header = parseCsvLine(lines[0]).map(h => h.toUpperCase().replace(/[^a-z0-9_]/gi, ""))
  const rows: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])
    const row: Record<string, string> = {}
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = values[j] ?? ""
    }
    rows.push(row)
  }

  return { header, rows }
}

function detectRelationships(tabs: SheetTab[]): Relationship[] {
  const rels: Relationship[] = []

  for (let i = 0; i < tabs.length; i++) {
    for (let j = i + 1; j < tabs.length; j++) {
      const a = tabs[i]
      const b = tabs[j]
      const commonCols = a.header.filter(col => b.header.includes(col))
      for (const col of commonCols) {
        rels.push({
          fromTab: a.name,
          fromColumn: col,
          toTab: b.name,
          toColumn: col,
          type: "equal",
        })
      }
    }
  }

  return rels
}

export async function loadSheet(url: string): Promise<BiSheet> {
  const id = extractSheetId(url)
  if (!id) throw new Error("URL de planilha inválida")

  // Try cache first
  const cached = getCachedSheet(id)
  if (cached) return cached

  const tabs: SheetTab[] = []
  let gid = 0
  let emptyCount = 0

  while (emptyCount < 3 && gid < 200) {
    const csv = await fetchTabCsv(id, gid)
    if (!csv) { emptyCount++; gid++; continue }
    emptyCount = 0

    const { header, rows } = parseCsv(csv)
    if (header.length === 0) { gid++; continue }

    tabs.push({ name: `aba_${tabs.length + 1}`, gid, header, rows })
    gid++
  }

  if (tabs.length === 0) throw new Error("Nenhuma aba encontrada na planilha")

  const relationships = detectRelationships(tabs)

  const sheet: BiSheet = {
    id,
    url,
    title: `Planilha ${id.slice(0, 8)}`,
    tabs,
    relationships,
    loadedAt: new Date().toISOString(),
  }

  // Save cache (best effort — read-only filesystems must not break the load)
  try {
    const path = cachePath(id)
    if (path) writeFileSync(path, JSON.stringify(sheet, null, 2))
  } catch {
    // cache is optional
  }

  return sheet
}

export function getCachedSheet(sheetId: string): BiSheet | null {
  try {
    const path = cachePath(sheetId)
    if (!path || !existsSync(path)) return null
    return JSON.parse(readFileSync(path, "utf-8")) as BiSheet
  } catch {
    return null
  }
}

// --- Query helpers ---

export function queryTabRows(tab: SheetTab, filters: Record<string, string>): Record<string, string>[] {
  return tab.rows.filter(row =>
    Object.entries(filters).every(([k, v]) =>
      (row[k] ?? "").toLowerCase().includes(v.toLowerCase()),
    ),
  )
}

export function listClientesByProduto(sheet: BiSheet, codigoProduto: string): ProductClient[] {
  // Find the main faturamento tab (the one with highest rows count)
  const fatTab = [...sheet.tabs].sort((a, b) => b.rows.length - a.rows.length)[0]
  if (!fatTab) return []

  const filtered = fatTab.rows.filter(r => (r["PRODUTO"] ?? "").includes(codigoProduto))

  const clientMap = new Map<string, {
    razaoSocial: string
    cidade: string
    uf: string
    ultimaData: string
    totalFaturado: number
    ticketMedio: number
    ultimaNF: string
    quantidadeTotal: number
    count: number
  }>()

  for (const r of filtered) {
    const key = r["RAZAOSOCIAL"] || r["RAZAO_SOCIAL"] || "unknown"
    const existing = clientMap.get(key) || {
      razaoSocial: key,
      cidade: r["CIDADE"] || "",
      uf: r["UF"] || "",
      ultimaData: "",
      totalFaturado: 0,
      ticketMedio: 0,
      ultimaNF: "",
      quantidadeTotal: 0,
      count: 0,
    }

    existing.totalFaturado += parseNumber(r["VALORSAIDA"] || r["VALOR_SAIDA"] || "0")
    existing.quantidadeTotal += parseNumber(r["QTDESAIDA"] || r["QTDE_SAIDA"] || "0")
    existing.count++

    const dataMov = r["DATAMOVTO"] || r["DATA_MOVTO"] || ""
    if (dataMov > existing.ultimaData) {
      existing.ultimaData = dataMov
      existing.ultimaNF = r["NF"] || existing.ultimaNF
    }

    clientMap.set(key, existing)
  }

  const result = [...clientMap.values()]
  result.forEach(c => {
    c.ticketMedio = c.count > 0 ? c.totalFaturado / c.count : 0
  })
  result.sort((a, b) => b.ultimaData.localeCompare(a.ultimaData))

  return result.map(({ count, ...rest }) => rest)
}

export function listProdutos(sheet: BiSheet): string[] {
  const fatTab = [...sheet.tabs].sort((a, b) => b.rows.length - a.rows.length)[0]
  if (!fatTab) return []

  const seen = new Set<string>()
  for (const r of fatTab.rows) {
    const p = (r["PRODUTO"] || "").trim()
    if (p) seen.add(p)
  }
  return [...seen].sort()
}

export function getAbcCurve(sheet: BiSheet): AbcItem[] {
  const abcTab = sheet.tabs.find(t => t.name.includes("4"))
  if (!abcTab) return []

  return abcTab.rows.map(r => ({
    grupo: r["GRUPO"] || "",
    valorTotal: parseNumber(r["VALORTOTALR"] || r["VALOR_TOTAL_R"] || r["VALORTOTAL"] || "0"),
    percentual: parseNumber(r["SOBRETOTAL"] || r["_SOBRE_TOTAL"] || "0"),
    acumulado: parseNumber(r["ACUMULADO"] || r["_ACUMULADO"] || "0"),
    classe: r["CLASSEABC"] || r["CLASSE_ABC"] || "",
  }))
}

export function getMetrics(sheet: BiSheet) {
  const fatTab = [...sheet.tabs].sort((a, b) => b.rows.length - a.rows.length)[0]
  if (!fatTab) return null

  const reps = new Set<string>()
  const clients = new Set<string>()
  const groups = new Set<string>()
  let totalValue = 0
  let totalQty = 0

  for (const r of fatTab.rows) {
    reps.add(r["NOMEREPRESENANTE"] || r["NOME_REPRESENANTE"] || "")
    clients.add(r["RAZAOSOCIAL"] || r["RAZAO_SOCIAL"] || "")
    groups.add(r["GRUPO"] || "")
    totalValue += parseNumber(r["VALORSAIDA"] || r["VALOR_SAIDA"] || "0")
    totalQty += parseNumber(r["QTDESAIDA"] || r["QTDE_SAIDA"] || "0")
  }

  return {
    totalVendas: totalValue,
    totalQuantidade: totalQty,
    totalRepresentantes: reps.size,
    totalClientes: clients.size,
    totalGrupos: groups.size,
    totalLinhas: fatTab.rows.length,
    ticketMedioGeral: totalValue / (fatTab.rows.length || 1),
  }
}

export function getRevenueByRepresentante(sheet: BiSheet) {
  const fatTab = [...sheet.tabs].sort((a, b) => b.rows.length - a.rows.length)[0]
  if (!fatTab) return []

  const repMap = new Map<string, number>()
  for (const r of fatTab.rows) {
    const rep = r["NOMEREPRESENANTE"] || r["NOME_REPRESENANTE"] || "Sem representante"
    repMap.set(rep, (repMap.get(rep) || 0) + parseNumber(r["VALORSAIDA"] || r["VALOR_SAIDA"] || "0"))
  }

  return [...repMap.entries()]
    .map(([nome, valor]) => ({ nome, valor }))
    .sort((a, b) => b.valor - a.valor)
}

export function getMonthlyTrend(sheet: BiSheet) {
  const fatTab = [...sheet.tabs].sort((a, b) => b.rows.length - a.rows.length)[0]
  if (!fatTab) return []

  const monthMap = new Map<string, { mes: string; valor: number; quantidade: number }>()

  for (const r of fatTab.rows) {
    const dataStr = r["DATAMOVTO"] || r["DATA_MOVTO"] || ""
    const mes = dataStr.slice(0, 7)
    if (!mes) continue

    const existing = monthMap.get(mes) || { mes, valor: 0, quantidade: 0 }
    existing.valor += parseNumber(r["VALORSAIDA"] || r["VALOR_SAIDA"] || "0")
    existing.quantidade += parseNumber(r["QTDESAIDA"] || r["QTDE_SAIDA"] || "0")
    monthMap.set(mes, existing)
  }

  return [...monthMap.values()].sort((a, b) => a.mes.localeCompare(b.mes))
}

export function getGeoDistribution(sheet: BiSheet) {
  const fatTab = [...sheet.tabs].sort((a, b) => b.rows.length - a.rows.length)[0]
  if (!fatTab) return []

  const ufMap = new Map<string, number>()
  for (const r of fatTab.rows) {
    const uf = r["UF"] || "N/D"
    ufMap.set(uf, (ufMap.get(uf) || 0) + parseNumber(r["VALORSAIDA"] || r["VALOR_SAIDA"] || "0"))
  }

  return [...ufMap.entries()]
    .map(([uf, valor]) => ({ uf, valor }))
    .sort((a, b) => b.valor - a.valor)
}

