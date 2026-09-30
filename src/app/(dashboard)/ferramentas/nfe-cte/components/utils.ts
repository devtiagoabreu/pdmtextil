import type { GrupoCte, LinhaCte, Periodo, Resumo } from "./types"

const CAMPOS_NUMERICOS = [
  "cte_numero",
  "cte_valor_total",
  "cte_valor_frete",
  "cte_natureza",
  "cte_tipo_conhecimento",
  "cte_cod_cidade_origem",
  "cte_cod_cidade_destino",
  "cte_situacao",
  "soma_nf_do_cte",
  "soma_rateio_do_cte",
  "pct_cte_sobre_total_nfs",
  "nf_numero",
  "nf_valor_total",
  "pct_nf_no_total_cte",
  "nf_frete_rateado",
  "nf_situacao",
  "nf_item_qtd",
  "nf_item_qtd_total",
  "nf_item_valor_total",
  "nf_item_icms",
  "nf_pct_rateio_no_cte",
  "nf_od_pedido",
  "nf_od_valor",
  "nf_od_qtde",
  "nf_od_cod_cidade",
  "nf_od_romaneio",
  "nf_od_qtde_rolos",
  "nf_od_peso_bruto",
  "nf_od_peso_liquido",
] as const

const CAMPOS_TEXTO = [
  "cte_serie",
  "cte_data",
  "cte_data_transacao",
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
  "nf_item_unidade",
  "nf_item_descricoes",
  "nf_valor_origem",
  "nf_od_data",
  "nf_od_cliente_razao",
  "nf_od_cliente_fantasia",
  "nf_od_cidade",
  "nf_od_regiao",
  "nf_od_representante",
  "nf_od_faturamento",
  "nf_od_cfop",
  "nf_od_natureza",
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

function arredondar2(valor: number): number {
  return Math.round(valor * 100) / 100
}

/**
 * A v3.2 do endpoint (docs/rel-nf-cte.sql) tirou do SQL as janelas de soma e
 * percentual (`soma_nf_do_cte`, `soma_rateio_do_cte`, `pct_cte_sobre_total_nfs`,
 * `pct_nf_no_total_cte`, `nf_pct_rateio_no_cte`) e o LISTAGG das descrições —
 * os cálculos passaram para o PDM. Esta função recalcula no cliente exatamente
 * as mesmas fórmulas (ROUND 2, mesmo agrupamento por cte_numero + cte_serie) e
 * só preenche quando a API não devolveu o campo (não sobrescreve valores).
 */
export function calcularDerivadosPorCte(itens: LinhaCte[]): LinhaCte[] {
  const porCte = new Map<string, LinhaCte[]>()
  for (const linha of itens) {
    const chave = chaveCte(linha)
    const grupo = porCte.get(chave)
    if (grupo) grupo.push(linha)
    else porCte.set(chave, [linha])
  }
  for (const linhas of porCte.values()) {
    const temValorNf = linhas.some((l) => l.nf_valor_total != null)
    const temRateio = linhas.some((l) => l.nf_item_valor_total != null)
    let somaNf = 0
    let somaRateio = 0
    for (const l of linhas) {
      if (l.nf_valor_total != null) somaNf += l.nf_valor_total
      if (l.nf_item_valor_total != null) somaRateio += l.nf_item_valor_total
    }
    for (const l of linhas) {
      if (l.soma_nf_do_cte == null && temValorNf) l.soma_nf_do_cte = somaNf
      if (l.soma_rateio_do_cte == null && temRateio) l.soma_rateio_do_cte = somaRateio
      if (
        l.pct_nf_no_total_cte == null &&
        temValorNf &&
        somaNf > 0 &&
        l.nf_valor_total != null
      ) {
        l.pct_nf_no_total_cte = arredondar2((l.nf_valor_total / somaNf) * 100)
      }
      if (
        l.pct_cte_sobre_total_nfs == null &&
        temValorNf &&
        somaNf > 0 &&
        l.cte_valor_total != null
      ) {
        l.pct_cte_sobre_total_nfs = arredondar2((l.cte_valor_total / somaNf) * 100)
      }
      if (
        l.nf_pct_rateio_no_cte == null &&
        l.cte_valor_total != null &&
        l.cte_valor_total > 0 &&
        l.nf_item_valor_total != null
      ) {
        l.nf_pct_rateio_no_cte = arredondar2((l.nf_item_valor_total / l.cte_valor_total) * 100)
      }
    }
  }
  return itens
}

export function normalizarResposta(body: unknown): LinhaCte[] {
  return calcularDerivadosPorCte(extrairItems(body).map(normalizarLinha))
}

export const LIMITE_PAGINA = 100
export const MAX_PAGINAS = 20

export class ApiRelatorioError extends Error {
  status: number
  constructor(status: number) {
    super(`API retornou erro: ${status}`)
    this.name = "ApiRelatorioError"
    this.status = status
  }
}

/**
 * O endpoint pagina por limit/offset (a ferramenta Apex aplica o ROWNUM
 * internamente). Medido no endpoint real em 30/09/2026: sem `limit` volta o
 * relatório inteiro (198 linhas), e `limit=100` em duas páginas reproduz
 * exatamente o mesmo conjunto, na mesma ordem e sem sobreposição.
 *
 * Este helper busca até MAX_PAGINAS páginas de LIMITE_PAGINA linhas, acumula
 * os itens BRUTOS de todas e só normaliza no final — assim os cálculos por
 * CT-e (calcularDerivadosPorCte) veem o conjunto completo, mesmo que um CT-e
 * seja cortado entre duas páginas. Para quando uma página volta com menos
 * linhas que o limite (última página).
 */
export async function buscarTodasPaginas(
  buscar: (offset: number) => Promise<unknown>
): Promise<LinhaCte[]> {
  const brutos: Record<string, unknown>[] = []
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const offset = pagina * LIMITE_PAGINA
    const body = await buscar(offset)
    const itens = extrairItems(body)
    brutos.push(...itens)
    if (itens.length < LIMITE_PAGINA) break
  }
  return normalizarResposta(brutos)
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
    linha.nf_od_cliente_fantasia ||
    linha.nf_od_cliente_razao ||
    linha.nf_fornecedor_fantasia ||
    linha.nf_fornecedor_razao ||
    null
  )
}

/**
 * A ordem de despacho é a origem operacional da NF-e. O `PEDIDO = 0` não é um
 * pedido real: é o placeholder que a base usa quando a NF-e não entrou em
 * nenhuma ordem, e nesse caso os dados de despacho não descrevem nada. Por isso
 * o corte é `> 0`, e não apenas "não nulo".
 */
export function nfTemDespacho(linha: LinhaCte): boolean {
  return linha.nf_od_pedido != null && linha.nf_od_pedido > 0
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

/**
 * O endpoint v3 traz os itens do CT-e (`OBRF_015`) rateados por NF-e. Uma NF
 * prevista — que não tem cabeçalho na `OBRF_010` — ainda tem valor de frete
 * rateado, então ela não está "sem dado": está com dado de outra origem.
 */
export function nfTemRateio(linha: LinhaCte): boolean {
  return linha.nf_item_valor_total != null || linha.nf_item_descricoes != null
}

/**
 * As descrições chegam agregadas em uma coluna, separadas por ` | `, porque a
 * SQL agrupa por CT-e+NF. Aqui viram linhas de verdade para a tabela de itens.
 */
export function descricoesItem(linha: LinhaCte): string[] {
  const bruto = linha.nf_item_descricoes
  if (!bruto) return []
  return bruto
    .split("|")
    .map((d) => d.trim())
    .filter(Boolean)
}

/**
 * O rateio dos itens deveria fechar com o total do CT-e. Quando não fecha, é
 * cadastro inconsistente no ERP (item com valor maior que o total do
 * conhecimento) — a tela precisa apontar em vez de esconder.
 */
export function rateioFechaComCte(linha: LinhaCte): boolean {
  if (linha.cte_valor_total == null || linha.soma_rateio_do_cte == null) return true
  return Math.abs(linha.soma_rateio_do_cte - linha.cte_valor_total) <= 0.01
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
        dataTransacao: linha.cte_data_transacao,
        dataIso: parseDataBr(linha.cte_data),
        valorTotal: linha.cte_valor_total,
        valorFrete: linha.cte_valor_frete,
        natureza: linha.cte_natureza,
        tipoConhecimento: linha.cte_tipo_conhecimento,
        codCidadeOrigem: linha.cte_cod_cidade_origem,
        codCidadeDestino: linha.cte_cod_cidade_destino,
        situacao: linha.cte_situacao,
        transportadora:
          linha.cte_transportadora_fantasia || linha.cte_transportadora_razao || "—",
        tomador: linha.cte_tomador_fantasia || linha.cte_tomador_razao || "—",
        somaNf: linha.soma_nf_do_cte,
        somaRateio: linha.soma_rateio_do_cte,
        pctSobreNf: linha.pct_cte_sobre_total_nfs,
        somaNfCalculada: 0,
        somaRateioCalculada: 0,
        pctCalculado: null,
        rateioDivergente: false,
        nfs: [],
      }
      mapa.set(chave, grupo)
    }
    grupo.nfs.push(linha)
    grupo.somaNfCalculada += linha.nf_valor_total || 0
    grupo.somaRateioCalculada += linha.nf_item_valor_total || 0
    if (linha.soma_nf_do_cte != null) grupo.somaNf = linha.soma_nf_do_cte
    if (linha.soma_rateio_do_cte != null) grupo.somaRateio = linha.soma_rateio_do_cte
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
    g.rateioDivergente = g.nfs.some((n) => !rateioFechaComCte(n))
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
  let comDespacho = 0
  let totalFrete = 0
  let totalNf = 0
  let totalRateio = 0
  const ctes = new Set<string>()
  const nfs = new Set<string>()
  const ctesDivergentes = new Set<string>()

  for (const linha of itens) {
    ctes.add(chaveCte(linha))
    nfs.add(`${linha.nf_numero ?? "?"}-${linha.nf_serie ?? "?"}-${nomeClienteNf(linha) ?? ""}`)
    if (!dataReferencia(linha)) semData++
    if (linha.nf_valor_total != null) comValorNf++
    if (nfSemCabecalho(linha)) semCabecalho++
    if (nfTemDespacho(linha)) comDespacho++
    totalFrete += linha.cte_valor_total || 0
    totalNf += linha.nf_valor_total || 0
    totalRateio += linha.nf_item_valor_total || 0
    if (!rateioFechaComCte(linha)) ctesDivergentes.add(chaveCte(linha))
  }

  return {
    linhas: itens.length,
    ctes: ctes.size,
    nfs: nfs.size,
    semData,
    comValorNf,
    semCabecalho,
    comDespacho,
    totalFrete,
    totalNf,
    totalRateio,
    ctesRateioDivergente: ctesDivergentes.size,
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
