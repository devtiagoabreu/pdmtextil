import type { SheetTab, BiSheet, Relationship, ProductClient, AbcItem, RepResumo, ClienteResumo, Previsao } from "./types"
import { db } from "@/lib/db"
import { biSheets } from "@/lib/db/schema/bi-sheets"
import { configGeral } from "@/lib/db/schema/config-geral"
import { eq } from "drizzle-orm"

const TTL_DEFAULT = 10

export async function getTtlMinutos(): Promise<number> {
  try {
    const [cfg] = await db.select().from(configGeral).where(eq(configGeral.chave, "bi_ttl_minutos"))
    const n = cfg?.valor ? Number.parseInt(cfg.valor, 10) : NaN
    if (Number.isFinite(n) && n > 0) return n
  } catch {
    // usa default
  }
  return TTL_DEFAULT
}

export async function setTtlMinutos(minutos: number): Promise<void> {
  const n = Math.max(1, Math.min(1440, Math.round(minutos)))
  await db
    .insert(configGeral)
    .values({ chave: "bi_ttl_minutos", valor: String(n) })
    .onConflictDoUpdate({
      target: configGeral.chave,
      set: { valor: String(n), updatedAt: new Date() },
    })
}

function isExpired(loadedAt: Date | string | null | undefined, ttlMin: number): boolean {
  if (!loadedAt) return true
  const t = typeof loadedAt === "string" ? new Date(loadedAt).getTime() : loadedAt.getTime()
  return Date.now() - t > ttlMin * 60 * 1000
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

async function discoverTabs(sheetId: string): Promise<{ name: string; gid: number }[] | null> {
  try {
    const res = await fetch(`https://docs.google.com/spreadsheets/d/${sheetId}/htmlview`)
    if (!res.ok) return null
    const html = await res.text()

    const tabs: { name: string; gid: number }[] = []
    const re = /name:\s*"([^"]+)",[\s\S]*?gid:\s*"(\d+)"/g
    let m: RegExpExecArray | null
    while ((m = re.exec(html))) {
      const gid = Number(m[2])
      if (!tabs.some(t => t.gid === gid)) tabs.push({ name: m[1], gid })
    }
    return tabs.length > 0 ? tabs : null
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

async function fetchAndParse(url: string): Promise<BiSheet> {
  const id = extractSheetId(url)
  if (!id) throw new Error("URL de planilha inválida")

  const discovered = await discoverTabs(id)
  const tabs: SheetTab[] = []

  if (discovered && discovered.length > 0) {
    for (const c of discovered) {
      const csv = await fetchTabCsv(id, c.gid)
      if (!csv) continue
      const { header, rows } = parseCsv(csv)
      if (header.length === 0) continue
      tabs.push({ name: c.name, gid: c.gid, header, rows })
    }
  } else {
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
  }

  if (tabs.length === 0) throw new Error("Nenhuma aba encontrada na planilha")

  const relationships = detectRelationships(tabs)

  return {
    id,
    url,
    title: `Planilha ${id.slice(0, 8)}`,
    tabs,
    relationships,
    loadedAt: new Date().toISOString(),
  }
}

async function persistSheet(sheet: BiSheet): Promise<void> {
  try {
    await db
      .insert(biSheets)
      .values({
        id: sheet.id,
        url: sheet.url,
        title: sheet.title,
        data: sheet,
        loadedAt: new Date(),
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: biSheets.id,
        set: {
          url: sheet.url,
          title: sheet.title,
          data: sheet,
          loadedAt: new Date(),
          updatedAt: new Date(),
        },
      })
  } catch (e) {
    console.error("[BI] Falha ao gravar cache no banco:", e)
  }
}

export async function getSheetById(
  sheetId: string,
  opts: { force?: boolean; url?: string } = {}
): Promise<BiSheet | null> {
  let row: any = null
  try {
    const [r] = await db.select().from(biSheets).where(eq(biSheets.id, sheetId))
    row = r
  } catch (e) {
    console.error("[BI] Falha ao ler cache do banco:", e)
  }

  const ttlMin = await getTtlMinutos()
  const precisaBuscar = opts.force || !row || isExpired(row.loadedAt, ttlMin)

  if (precisaBuscar && (opts.url || row?.url)) {
    try {
      const sheet = await fetchAndParse(opts.url || row.url)
      await persistSheet(sheet)
      return sheet
    } catch (e) {
      if (!row) throw e
      console.error(`[BI] Falha ao re-buscar planilha ${sheetId}, usando cache:`, e)
    }
  }

  return row ? (row.data as BiSheet) : null
}

export async function loadSheet(url: string, opts: { force?: boolean } = {}): Promise<BiSheet> {
  const id = extractSheetId(url)
  if (!id) throw new Error("URL de planilha inválida")

  const sheet = await getSheetById(id, { force: opts.force, url })
  if (!sheet) throw new Error("Nenhuma aba encontrada na planilha")
  return sheet
}

// --- Query helpers ---

export function queryTabRows(tab: SheetTab, filters: Record<string, string>): Record<string, string>[] {
  return tab.rows.filter(row =>
    Object.entries(filters).every(([k, v]) =>
      (row[k] ?? "").toLowerCase().includes(v.toLowerCase()),
    ),
  )
}

function rowGrupo(r: Record<string, string>): string {
  const g = (r["GRUPO"] || "").trim()
  if (g) return g
  const parts = (r["PRODUTO"] || "").split(".")
  return parts.length >= 2 ? parts[1].trim() : ""
}

function parseDataMovto(val: string): Date | null {
  if (!val) return null
  const iso = new Date(val)
  if (!Number.isNaN(iso.getTime())) return iso
  const m = val.match(/(\d{2})\/(\d{2})\/(\d{4})/)
  if (m) return new Date(Date.UTC(Number(m[3]), Number(m[2]) - 1, Number(m[1])))
  return null
}

function filterTabByPeriod(tab: SheetTab, de: Date | null, ate: Date | null): SheetTab {
  if (!de && !ate) return tab
  const dateCol = tab.header.find(h => /^DATA_?MOVTO$/i.test(h))
  if (!dateCol) return tab
  const rows = tab.rows.filter(r => {
    const t = parseDataMovto(r[dateCol])
    if (!t) return false
    if (de && t < de) return false
    if (ate && t > ate) return false
    return true
  })
  return { ...tab, rows }
}

export function sheetNoPeriodo(sheet: BiSheet, de?: string | null, ate?: string | null): BiSheet {
  let deD: Date | null = null
  let ateD: Date | null = null
  if (de) {
    const d = new Date(`${de}T00:00:00Z`)
    if (!Number.isNaN(d.getTime())) deD = d
  }
  if (ate) {
    const a = new Date(`${ate}T23:59:59.999Z`)
    if (!Number.isNaN(a.getTime())) ateD = a
  }
  if (!deD && !ateD) return sheet
  return { ...sheet, tabs: sheet.tabs.map(t => filterTabByPeriod(t, deD, ateD)) }
}

function getFatTab(sheet: BiSheet): SheetTab | undefined {
  const candidatos = sheet.tabs.filter(t => t.header.includes("PRODUTO"))
  const pool = candidatos.length > 0 ? candidatos : sheet.tabs
  return [...pool].sort((a, b) => b.rows.length - a.rows.length)[0]
}

function aggregateClientes(rows: Record<string, string>[]): ProductClient[] {
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

  for (const r of rows) {
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

export function listClientesByProduto(sheet: BiSheet, codigoProduto: string): ProductClient[] {
  // Find the main faturamento tab (the one with highest rows count)
  const fatTab = getFatTab(sheet)
  if (!fatTab) return []

  return aggregateClientes(fatTab.rows.filter(r => (r["PRODUTO"] ?? "").includes(codigoProduto)))
}

export function listClientesByGrupo(sheet: BiSheet, grupo: string): ProductClient[] {
  const fatTab = getFatTab(sheet)
  if (!fatTab) return []

  return aggregateClientes(fatTab.rows.filter(r => rowGrupo(r) === grupo))
}

export function listGrupos(sheet: BiSheet): string[] {
  const fatTab = getFatTab(sheet)
  if (!fatTab) return []

  const seen = new Set<string>()
  for (const r of fatTab.rows) {
    const g = rowGrupo(r)
    if (g) seen.add(g)
  }
  return [...seen].sort()
}

export function listProdutos(sheet: BiSheet): string[] {
  const fatTab = getFatTab(sheet)
  if (!fatTab) return []

  const seen = new Set<string>()
  for (const r of fatTab.rows) {
    const p = (r["PRODUTO"] || "").trim()
    if (p) seen.add(p)
  }
  return [...seen].sort()
}

export function getAbcCurve(sheet: BiSheet): AbcItem[] {
  const abcTab =
    sheet.tabs.find(t => /abc|curva/i.test(t.name)) ||
    sheet.tabs.find(t => t.name.includes("4"))
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
  const fatTab = getFatTab(sheet)
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
  const fatTab = getFatTab(sheet)
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
  const fatTab = getFatTab(sheet)
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
  const fatTab = getFatTab(sheet)
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

function rowDataMov(r: Record<string, string>): string {
  return r["DATA_MOVTO"] || r["DATAMOVTO"] || ""
}

function rowValor(r: Record<string, string>): number {
  return parseNumber(r["VALOR_SAIDA"] || r["VALORSAIDA"] || "0")
}

function rowQtd(r: Record<string, string>): number {
  return parseNumber(r["QTDE_SAIDA"] || r["QTDESAIDA"] || "0")
}

function aggregateReps(rows: Record<string, string>[]): RepResumo[] {
  const map = new Map<string, RepResumo>()
  const clientesPorRep = new Map<string, Set<string>>()

  for (const r of rows) {
    const nome = (r["NOME_REPRESENANTE"] || r["NOMEREPRESENANTE"] || "").trim() || "Sem representante"
    let e = map.get(nome)
    if (!e) {
      e = { nome, totalVendas: 0, totalQtd: 0, count: 0, ticketMedio: 0, numClientes: 0, ultimaData: "" }
      map.set(nome, e)
      clientesPorRep.set(nome, new Set())
    }
    e.totalVendas += rowValor(r)
    e.totalQtd += rowQtd(r)
    e.count++
    const d = rowDataMov(r)
    if (d > e.ultimaData) e.ultimaData = d
    const cli = (r["RAZAO_SOCIAL"] || r["RAZAOSOCIAL"] || "").trim()
    if (cli) clientesPorRep.get(nome)!.add(cli)
  }

  const result = [...map.values()]
  result.forEach(e => {
    e.ticketMedio = e.count > 0 ? e.totalVendas / e.count : 0
    e.numClientes = clientesPorRep.get(e.nome)?.size ?? 0
  })
  result.sort((a, b) => b.totalVendas - a.totalVendas)
  return result
}

export function getRepResumo(sheet: BiSheet): RepResumo[] {
  const fatTab = getFatTab(sheet)
  if (!fatTab) return []
  return aggregateReps(fatTab.rows)
}

export function getRepsByGrupo(sheet: BiSheet, grupo: string): RepResumo[] {
  const fatTab = getFatTab(sheet)
  if (!fatTab) return []
  return aggregateReps(fatTab.rows.filter(r => rowGrupo(r) === grupo))
}

function classificarCurva(intervalo: number | null, nCompras: number): string {
  if (!intervalo || nCompras < 2) return "Sem curva"
  if (intervalo < 8) return "Semanal"
  if (intervalo < 22) return "Quinzenal"
  if (intervalo < 45) return "Mensal"
  if (intervalo < 105) return "Bimestral"
  if (intervalo < 210) return "Semestral"
  return "Esporádico"
}

export function getClientesResumo(sheet: BiSheet): ClienteResumo[] {
  const fatTab = getFatTab(sheet)
  if (!fatTab) return []

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayT = today.getTime()
  const DAY = 86400000

  const map = new Map<string, {
    razaoSocial: string
    cidade: string
    uf: string
    totalVendas: number
    totalQtd: number
    count: number
    dates: number[]
  }>()

  for (const r of fatTab.rows) {
    const nome = (r["RAZAO_SOCIAL"] || r["RAZAOSOCIAL"] || "").trim()
    if (!nome) continue
    let e = map.get(nome)
    if (!e) {
      e = { razaoSocial: nome, cidade: r["CIDADE"] || "", uf: r["UF"] || "", totalVendas: 0, totalQtd: 0, count: 0, dates: [] }
      map.set(nome, e)
    }
    e.totalVendas += rowValor(r)
    e.totalQtd += rowQtd(r)
    e.count++
    const d = parseDataMovto(rowDataMov(r))
    if (d) e.dates.push(d.getTime())
  }

  const result: ClienteResumo[] = []
  for (const e of map.values()) {
    const unique = [...new Set(e.dates)].sort((a, b) => a - b)
    const primeira = unique[0]
    const ultima = unique[unique.length - 1]

    const intervalos: number[] = []
    for (let i = 1; i < unique.length; i++) intervalos.push((unique[i] - unique[i - 1]) / DAY)
    const intervaloMedio = intervalos.length > 0
      ? intervalos.reduce((s, x) => s + x, 0) / intervalos.length
      : null

    const diasDesdeUltima = ultima ? Math.floor((todayT - ultima) / DAY) : null
    const classificacao = classificarCurva(intervaloMedio, unique.length)
    const alerta = !!intervaloMedio && diasDesdeUltima !== null &&
      diasDesdeUltima > Math.max(intervaloMedio * 1.5, 14)

    const spanMeses = primeira && ultima ? Math.max(1, (ultima - primeira) / DAY / 30.44) : 1
    const proximaCompra = ultima && intervaloMedio ? new Date(ultima + intervaloMedio * DAY).toISOString() : null

    result.push({
      razaoSocial: e.razaoSocial,
      cidade: e.cidade,
      uf: e.uf,
      totalVendas: e.totalVendas,
      totalQtd: e.totalQtd,
      count: e.count,
      compras: unique.length,
      primeiraData: primeira ? new Date(primeira).toISOString() : "",
      ultimaData: ultima ? new Date(ultima).toISOString() : "",
      intervaloMedio,
      classificacao,
      comprasPorMes: Math.round((unique.length / spanMeses) * 100) / 100,
      diasDesdeUltima,
      proximaCompra,
      alerta,
      alertaMotivo: alerta && intervaloMedio && diasDesdeUltima !== null
        ? `Sem comprar há ${Math.round(diasDesdeUltima)} dias (frequência média de ${Math.round(intervaloMedio)} dias)`
        : null,
    })
  }

  result.sort((a, b) => (b.ultimaData || "").localeCompare(a.ultimaData || ""))
  return result
}

export function getPrevisao(sheet: BiSheet): Previsao {
  const empty: Previsao = {
    mediaDiaria: 0,
    diasCobertos: 0,
    primeiraData: null,
    ultimaData: null,
    projecaoMes: 0,
    projecaoProximos30: 0,
    mediaMensal3m: 0,
    projecaoProximoMes: 0,
  }

  const fatTab = getFatTab(sheet)
  if (!fatTab) return empty

  let totalVendas = 0
  let min: number | null = null
  let max: number | null = null
  const monthly = new Map<string, number>()

  for (const r of fatTab.rows) {
    const v = rowValor(r)
    totalVendas += v
    const d = parseDataMovto(rowDataMov(r))
    if (d) {
      const t = d.getTime()
      if (min === null || t < min) min = t
      if (max === null || t > max) max = t
      const mes = rowDataMov(r).slice(0, 7)
      if (mes) monthly.set(mes, (monthly.get(mes) || 0) + v)
    }
  }

  if (min === null || max === null) return empty

  const diasCobertos = Math.max(1, Math.round((max - min) / 86400000))
  const mediaDiaria = totalVendas / diasCobertos

  const now = new Date()
  const diasNoMes = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const projecaoMes = mediaDiaria * diasNoMes
  const projecaoProximos30 = mediaDiaria * 30

  const monthsSorted = [...monthly.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([mes, valor]) => ({ mes, valor }))
  const last3 = monthsSorted.slice(-3)
  const mediaMensal3m = last3.length > 0 ? last3.reduce((s, m) => s + m.valor, 0) / last3.length : 0
  const projecaoProximoMes = mediaMensal3m

  return {
    mediaDiaria,
    diasCobertos,
    primeiraData: new Date(min).toISOString(),
    ultimaData: new Date(max).toISOString(),
    projecaoMes,
    projecaoProximos30,
    mediaMensal3m,
    projecaoProximoMes,
  }
}

