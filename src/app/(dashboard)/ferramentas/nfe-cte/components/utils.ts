import type { GrupoCte, LinhaCte, Periodo, Resumo } from "./types"

const CAMPOS_NUMERICOS = [
  "cte_numero",
  "cte_valor_total",
  "cte_valor_frete",
  "cte_situacao",
  "soma_nf_do_cte",
  "pct_cte_sobre_total_nfs",
  "nf_numero",
  "nf_valor_total",
  "pct_nf_no_total_cte",
  "nf_frete_rateado",
  "nf_situacao",
] as const

const CAMPOS_TEXTO = [
  "cte_serie",
  "cte_data",
  "cte_transportadora_razao",
  "cte_transportadora_fantasia",
  "cte_tomador_razao",
  "cte_tomador_fantasia",
  "nf_serie",
  "nf_data",
  "nf_cliente_razao",
  "nf_cliente_fantasia",
  "nf_fornecedor_razao",
  "nf_fornecedor_fantasia",
  "nf_cab_origem",
] as const

function toNumero(valor: unknown): number | null {
  if (valor === null || valor === undefined || valor === "") return null
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null
  const limpo = String(valor).replace(/[^0-9.,-]/g, "").replace(/\.(?=\d{3}(\D|$))/, "").replace(",", ".")
  const n = Number.parseFloat(limpo)
  return Number.isFinite(n) ? n : null
}

function toTexto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null
  const s = String(valor).trim()
  return s === "" ? null : s
}

export function normalizarLinha(raw: Record<string, unknown>): LinhaCte {
  const fonte: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(raw || {})) {
    fonte[k.toLowerCase()] = v
  }

  const linha = {} as Record<string, unknown>
  for (const campo of CAMPOS_NUMERICOS) {
    linha[campo] = toNumero(fonte[campo])
  }
  for (const campo of CAMPOS_TEXTO) {
    linha[campo] = toTexto(fonte[campo])
  }
  return linha as unknown as LinhaCte
}

export function extrairItems(body: unknown): Record<string, unknown>[] {
  if (Array.isArray(body)) return body as Record<string, unknown>[]
  if (body && typeof body === "object") {
    const b = body as Record<string, unknown>
    for (const chave of ["items", "data", "rows", "result"]) {
      if (Array.isArray(b[chave])) return b[chave] as Record<string, unknown>[]
    }
  }
  return []
}

export function normalizarResposta(body: unknown): LinhaCte[] {
  return extrairItems(body).map(normalizarLinha)
}

export function paraIso(d: Date): string {
  const mes = String(d.getMonth() + 1).padStart(2, "0")
  const dia = String(d.getDate()).padStart(2, "0")
  return `${d.getFullYear()}-${mes}-${dia}`
}

export function isoParaData(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12)
}

export function somarMeses(base: Date, meses: number): Date {
  const ano = base.getFullYear()
  const mes = base.getMonth() + meses
  const ultimoDia = new Date(ano, mes + 1, 0).getDate()
  return new Date(
    ano,
    mes,
    Math.min(base.getDate(), ultimoDia),
    base.getHours(),
    base.getMinutes(),
    base.getSeconds()
  )
}

export function periodoPadrao(hoje: Date = new Date()): Periodo {
  return { de: paraIso(somarMeses(hoje, -2)), ate: paraIso(hoje) }
}

export function periodoMesCorrente(hoje: Date = new Date()): Periodo {
  return { de: paraIso(new Date(hoje.getFullYear(), hoje.getMonth(), 1, 12)), ate: paraIso(hoje) }
}

export function parseDataBr(valor: string | null | undefined): string | null {
  if (!valor) return null
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(valor.trim())
  if (!m) return null
  return `${m[3]}-${m[2]}-${m[1]}`
}

export function dataReferencia(linha: LinhaCte): string | null {
  return parseDataBr(linha.nf_data) || parseDataBr(linha.cte_data)
}

/**
 * Nome que identifica quem é da NF-e. O endpoint v2 traz a razão social do
 * cliente da nota (`NF_CLIENTE_*`); enquanto ele não estiver publicado, o
 * emissor (`NF_FORNECEDOR_*`) é o único nome que existe — daí o fallback.
 */
export function nomeClienteNf(linha: LinhaCte): string | null {
  return (
    linha.nf_cliente_fantasia ||
    linha.nf_cliente_razao ||
    linha.nf_fornecedor_fantasia ||
    linha.nf_fornecedor_razao ||
    null
  )
}

/**
 * O endpoint responde `SEM_CABECALHO` quando o número que o CT-e declara não
 * existe na `OBRF_010` — normalmente nota prevista, ainda não emitida. Nesse
 * caso não é "NF-e sem valor": é NF-e que não existe, e a tela precisa dizer
 * isso em vez de deixar a célula vazia.
 */
export function nfSemCabecalho(linha: LinhaCte): boolean {
  return linha.nf_cab_origem === "SEM_CABECALHO"
}

export function filtrarPorPeriodo(itens: LinhaCte[], periodo: Periodo): LinhaCte[] {
  const de = periodo.de || ""
  const ate = periodo.ate || ""
  if (!de && !ate) return itens
  return itens.filter((linha) => {
    const iso = dataReferencia(linha)
    if (!iso) return true
    if (de && iso < de) return false
    if (ate && iso > ate) return false
    return true
  })
}

function chaveCte(linha: LinhaCte): string {
  return `${linha.cte_numero ?? "?"}-${linha.cte_serie ?? "?"}`
}

export function agruparPorCte(itens: LinhaCte[]): GrupoCte[] {
  const mapa = new Map<string, GrupoCte>()
  for (const linha of itens) {
    const chave = chaveCte(linha)
    let grupo = mapa.get(chave)
    if (!grupo) {
      grupo = {
        chave,
        numero: linha.cte_numero,
        serie: linha.cte_serie,
        data: linha.cte_data,
        dataIso: parseDataBr(linha.cte_data),
        valorTotal: linha.cte_valor_total,
        valorFrete: linha.cte_valor_frete,
        situacao: linha.cte_situacao,
        transportadora:
          linha.cte_transportadora_fantasia || linha.cte_transportadora_razao || "—",
        tomador: linha.cte_tomador_fantasia || linha.cte_tomador_razao || "—",
        somaNf: linha.soma_nf_do_cte,
        pctSobreNf: linha.pct_cte_sobre_total_nfs,
        somaNfCalculada: 0,
        pctCalculado: null,
        nfs: [],
      }
      mapa.set(chave, grupo)
    }
    grupo.nfs.push(linha)
    grupo.somaNfCalculada += linha.nf_valor_total || 0
    if (linha.soma_nf_do_cte != null) grupo.somaNf = linha.soma_nf_do_cte
    if (linha.pct_cte_sobre_total_nfs != null) grupo.pctSobreNf = linha.pct_cte_sobre_total_nfs
  }

  const grupos = [...mapa.values()]
  for (const g of grupos) {
    g.nfs.sort(
      (a, b) =>
        (a.nf_numero ?? 0) - (b.nf_numero ?? 0) ||
        String(a.nf_serie ?? "").localeCompare(String(b.nf_serie ?? ""))
    )
    const base = g.somaNf ?? g.somaNfCalculada
    g.pctCalculado = base && g.valorTotal != null ? (g.valorTotal / base) * 100 : null
  }

  return grupos.sort((a, b) => {
    if (a.dataIso && b.dataIso && a.dataIso !== b.dataIso) return b.dataIso.localeCompare(a.dataIso)
    if (a.dataIso && !b.dataIso) return -1
    if (!a.dataIso && b.dataIso) return 1
    return (b.numero ?? 0) - (a.numero ?? 0)
  })
}

export function calcularResumo(itens: LinhaCte[]): Resumo {
  let semData = 0
  let comValorNf = 0
  let semCabecalho = 0
  let totalFrete = 0
  let totalNf = 0
  const ctes = new Set<string>()
  const nfs = new Set<string>()

  for (const linha of itens) {
    ctes.add(chaveCte(linha))
    nfs.add(`${linha.nf_numero ?? "?"}-${linha.nf_serie ?? "?"}-${nomeClienteNf(linha) ?? ""}`)
    if (!dataReferencia(linha)) semData++
    if (linha.nf_valor_total != null) comValorNf++
    if (nfSemCabecalho(linha)) semCabecalho++
    totalFrete += linha.cte_valor_total || 0
    totalNf += linha.nf_valor_total || 0
  }

  return {
    linhas: itens.length,
    ctes: ctes.size,
    nfs: nfs.size,
    semData,
    comValorNf,
    semCabecalho,
    totalFrete,
    totalNf,
  }
}

export function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return "—"
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
}

export function formatarPercentual(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return "—"
  return `${valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

export function formatarNumero(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || !Number.isFinite(valor)) return "—"
  return valor.toLocaleString("pt-BR")
}

export function nomeTranspDistinct(grupos: GrupoCte[]): string[] {
  return [...new Set(grupos.map((g) => g.transportadora))].sort((a, b) => a.localeCompare(b, "pt-BR"))
}
