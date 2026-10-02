import type {
  ContagemFaixas,
  FaixaFrete,
  GrupoCte,
  LinhaCte,
  NotaDespacho,
  OrdemDespacho,
  Periodo,
  Resumo,
  ResumoDespacho,
  ResumoFrete,
} from "./types"

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

/**
 * Chave de uma linha do relatório: o par CT-e + NF-e. O endpoint agrega os
 * itens por esse par (o subselect `it` da SQL agrupa por conhecimento +
 * número-série da NF), então duas linhas com a mesma chave são a MESMA NF do
 * MESMO CT-e — nunca duas NFs distintas.
 */
function chaveCteNf(linha: LinhaCte): string {
  return `${chaveCte(linha)}|${linha.nf_numero ?? "?"}-${linha.nf_serie ?? "?"}`
}

/**
 * Remove linhas repetidas de NF-e dentro do mesmo CT-e.
 *
 * Medido no endpoint real em 01/10/2026: o CT-e 351348-1 volta com a NF
 * 35653-1 DUAS vezes, byte a byte igual (rateio 199,99, valor 4.655,20). A
 * duplicata vem do `obrf_016` ter dois vínculos iguais para o mesmo
 * conhecimento — não do `dsp`, que é agregado por NF e não repete linha. Como
 * a SQL já agrega por CT-e+NF, a segunda linha é ruído.
 *
 * Sem isso a tela mostra a mesma NF duas vezes e o `pct_nf_no_total_cte` vira
 * 50%/50% num caso que deveria ter uma linha só.
 *
 * Mantém a PRIMEIRA ocorrência de cada chave e devolve os demais campos intactos
 * (inclusive os derivados, que ainda nem foram calculados neste ponto).
 */
export function deduplicarPorCteNf(itens: LinhaCte[]): LinhaCte[] {
  const vistas = new Set<string>()
  const saida: LinhaCte[] = []
  for (const linha of itens) {
    const chave = chaveCteNf(linha)
    if (vistas.has(chave)) continue
    vistas.add(chave)
    saida.push(linha)
  }
  return saida
}

export function normalizarResposta(body: unknown): LinhaCte[] {
  const linhas = extrairItems(body).map(normalizarLinha)
  return calcularDerivadosPorCte(deduplicarPorCteNf(linhas))
}

export const LIMITE_PAGINA = 100
/**
 * 100 páginas × 100 linhas = 10.000 linhas. A janela padrão são 12 meses
 * (~1.100 NF-e), então o teto só seria tocado em um ano atípico — e, mesmo
 * assim, é preferível truncar avisando do que truncar calado.
 */
export const MAX_PAGINAS = 100

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
 *
 * Se o teto for atingido sem página curta, `aoTruncar` é chamado: sem isso a
 * tela mostraria totais de um recorte parcial sem nenhum aviso.
 */
export async function buscarTodasPaginas(
  buscar: (offset: number) => Promise<unknown>,
  aoTruncar?: (linhas: number) => void
): Promise<LinhaCte[]> {
  const brutos: Record<string, unknown>[] = []
  for (let pagina = 0; pagina < MAX_PAGINAS; pagina++) {
    const offset = pagina * LIMITE_PAGINA
    const body = await buscar(offset)
    const itens = extrairItems(body)
    brutos.push(...itens)
    if (itens.length < LIMITE_PAGINA) return normalizarResposta(brutos)
  }
  aoTruncar?.(MAX_PAGINAS * LIMITE_PAGINA)
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

export type ChavePeriodo =
  | "12m"
  | "6m"
  | "3m"
  | "ano"
  | "mes"
  | "mes_anterior"
  | "7d"
  | "ontem"
  | "hoje"
  | "personalizado"

export interface PresetPeriodo {
  chave: ChavePeriodo
  rotulo: string
}

/**
 * Atalhos do filtro de período, na ordem em que aparecem no select.
 *
 * `personalizado` não é um atalho: é o estado que a tela entra quando alguém
 * digita as datas na mão, para o select não mentir mostrando "Últimos 12 meses"
 * com um período que o usuário montou.
 */
export const PRESETAS_PERIODO: PresetPeriodo[] = [
  { chave: "12m", rotulo: "Últimos 12 meses" },
  { chave: "6m", rotulo: "Últimos 6 meses" },
  { chave: "3m", rotulo: "Último trimestre" },
  { chave: "ano", rotulo: "Ano atual" },
  { chave: "mes", rotulo: "Mês atual" },
  { chave: "mes_anterior", rotulo: "Mês anterior" },
  { chave: "7d", rotulo: "Últimos 7 dias" },
  { chave: "ontem", rotulo: "Ontem" },
  { chave: "hoje", rotulo: "Hoje" },
  { chave: "personalizado", rotulo: "Personalizado" },
]

function ultimoDiaDoMes(base: Date): Date {
  return new Date(base.getFullYear(), base.getMonth() + 1, 0, 12)
}

/**
 * Converte um atalho em intervalo de datas.
 *
 * `de` sempre começa no dia 1 do mês inicial e `ate` vai até hoje (ou o fim do
 * mês, nos atalhos de mês fechado). Isso casa com a janela do relatório, que é
 * `ADD_MONTHS(TRUNC(SYSDATE,'MM'), -12)` até o fim do mês corrente.
 */
export function periodoDePreset(chave: ChavePeriodo, hoje: Date = new Date()): Periodo | null {
  switch (chave) {
    case "hoje":
      return { de: paraIso(hoje), ate: paraIso(hoje) }
    case "ontem": {
      const ontem = somarDias(hoje, -1)
      return { de: paraIso(ontem), ate: paraIso(ontem) }
    }
    case "7d":
      return { de: paraIso(somarDias(hoje, -6)), ate: paraIso(hoje) }
    case "mes":
      return periodoMesCorrente(hoje)
    case "mes_anterior": {
      const primeiro = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1, 12)
      return { de: paraIso(primeiro), ate: paraIso(ultimoDiaDoMes(primeiro)) }
    }
    case "3m":
      return { de: paraIso(primeiroDoMes(somarMeses(hoje, -2))), ate: paraIso(hoje) }
    case "6m":
      return { de: paraIso(primeiroDoMes(somarMeses(hoje, -5))), ate: paraIso(hoje) }
    case "ano":
      return { de: paraIso(new Date(hoje.getFullYear(), 0, 1, 12)), ate: paraIso(hoje) }
    case "12m":
      return periodoPadrao(hoje)
    default:
      return null
  }
}

/** Atalho cujo intervalo bate com o período informado, ou `null` se for digitado à mão. */
export function presetQueCombinaCom(
  periodo: Periodo,
  hoje: Date = new Date()
): ChavePeriodo | null {
  for (const { chave } of PRESETAS_PERIODO) {
    if (chave === "personalizado") continue
    const esperado = periodoDePreset(chave, hoje)
    if (esperado && esperado.de === periodo.de && esperado.ate === periodo.ate) return chave
  }
  return null
}

/**
 * Período padrão da tela: os últimos 12 meses.
 *
 * É a janela que o endpoint entrega, então é a única que não deixa linha de
 * fora na primeira consulta. Antes eram 2 meses (`somarMeses(hoje, -2)`).
 */
export function periodoPadrao(hoje: Date = new Date()): Periodo {
  return { de: paraIso(primeiroDoMes(somarMeses(hoje, -12))), ate: paraIso(hoje) }
}

export function periodoMesCorrente(hoje: Date = new Date()): Periodo {
  return { de: paraIso(new Date(hoje.getFullYear(), hoje.getMonth(), 1, 12)), ate: paraIso(hoje) }
}

function primeiroDoMes(base: Date): Date {
  return new Date(base.getFullYear(), base.getMonth(), 1, 12)
}

export function somarDias(base: Date, dias: number): Date {
  return new Date(base.getFullYear(), base.getMonth(), base.getDate() + dias, 12)
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
        regiao: "—",
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
    // A região é do cliente/atendente da ordem de despacho, então vem da NF-e
    // e não do CT-e. Um CT-e pode ter NFs de clientes diferentes: fica com a
    // primeira região preenchida, mesmo tratamento de transportadora/tomador.
    g.regiao = g.nfs.find((n) => n.nf_od_regiao)?.nf_od_regiao || "Sem região"
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
  const fretePorCte = new Map<string, number>()

  for (const linha of itens) {
    const chave = chaveCte(linha)
    ctes.add(chave)
    nfs.add(`${linha.nf_numero ?? "?"}-${linha.nf_serie ?? "?"}-${nomeClienteNf(linha) ?? ""}`)
    if (!dataReferencia(linha)) semData++
    if (linha.nf_valor_total != null) comValorNf++
    if (nfSemCabecalho(linha)) semCabecalho++
    if (nfTemDespacho(linha)) comDespacho++
    // `cte_valor_total` é o total DO CT-e, não da NF-e: somar por linha
    // contaria o mesmo frete uma vez por NF-e do CT-e. Medido em 01/10/2026 com
    // 183 CT-es / 184 NFs: a soma por linha dava R$ 48.086,99 contra R$
    // 45.048,85 correto — 6,7% inflado. Guardar só a primeira ocorrência por
    // CT-e resolve. Já o rateio abaixo é por NF-e, e a soma segue correta.
    if (!fretePorCte.has(chave)) fretePorCte.set(chave, linha.cte_valor_total || 0)
    totalNf += linha.nf_valor_total || 0
    totalRateio += linha.nf_item_valor_total || 0
    if (!rateioFechaComCte(linha)) ctesDivergentes.add(chave)
  }
  for (const frete of fretePorCte.values()) totalFrete += frete

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

/** `2026-09-01` → `01/09/2026`. Evita `new Date()` para não deslocar o dia por fuso. */
export function formatarDataBr(iso: string | null | undefined): string {
  if (!iso) return "—"
  const partes = iso.slice(0, 10).split("-")
  if (partes.length !== 3) return iso
  return `${partes[2]}/${partes[1]}/${partes[0]}`
}

/** Nome da transportadora do CT-e; a ordem de despacho herda a do conhecimento. */
function nomeTransportadora(linha: LinhaCte): string {
  return linha.cte_transportadora_fantasia || linha.cte_transportadora_razao || ""
}

/**
 * Chave da ordem de despacho: pedido + romaneio.
 *
 * Medido no endpoint em 02/10/2026 (500 linhas da janela de 12 meses): 483 com
 * `nf_od_pedido > 0` formavam 470 grupos, sendo 463 com uma única NF, 5 com duas
 * e 2 com cinco. Ou seja, pedido+romaneio é a granularidade que o romaneio
 * realmente tem — agrupar só por pedido misturaria expedições diferentes.
 */
export function chaveOrdemDespacho(linha: LinhaCte): string {
  return `${linha.nf_od_pedido ?? "?"}|${linha.nf_od_romaneio ?? "?"}`
}

/**
 * Agrupa as NF-e em ordens de despacho.
 *
 * Só entram as linhas com `nf_od_pedido > 0` (ver `nfTemDespacho`): `PEDIDO = 0`
 * é o placeholder da base para NF-e que não entrou em ordem nenhuma, e os dados
 * de despacho dessas linhas não descrevem documento nenhum.
 *
 * Os campos do cabeçalho da ordem (cliente, cidade, região, representante,
 * rolos, pesos) vêm da primeira linha preenchida, porque o endpoint repete os
 * mesmos valores em todas as NFs do mesmo pedido — e nem sempre em todas.
 * Peças e valor são **somados** por nota: `nf_od_qtde` é a quantidade da ordem
 * para aquela NF-e, não do pedido inteiro.
 */
export function agruparOrdensDespacho(itens: LinhaCte[]): OrdemDespacho[] {
  const mapa = new Map<string, OrdemDespacho>()
  for (const linha of itens) {
    if (!nfTemDespacho(linha)) continue
    const chave = chaveOrdemDespacho(linha)
    let ordem = mapa.get(chave)
    if (!ordem) {
      ordem = {
        chave,
        pedido: linha.nf_od_pedido,
        romaneio: linha.nf_od_romaneio,
        data: linha.nf_od_data,
        dataIso: linha.nf_od_data ? parseDataBr(linha.nf_od_data) : null,
        transportadora: "",
        cliente: "",
        cidade: "",
        regiao: "",
        representante: "",
        faturamento: linha.nf_od_faturamento,
        natureza: linha.nf_od_natureza,
        cfop: linha.nf_od_cfop,
        notas: [],
        pecas: 0,
        valor: 0,
        rolos: linha.nf_od_qtde_rolos,
        pesoBruto: linha.nf_od_peso_bruto,
        pesoLiquido: linha.nf_od_peso_liquido,
      }
      mapa.set(chave, ordem)
    }
    // Cabeçalho: primeira linha que traga o campo preenchido.
    if (!ordem.transportadora) ordem.transportadora = nomeTransportadora(linha)
    if (!ordem.cliente) {
      ordem.cliente = linha.nf_od_cliente_fantasia || linha.nf_od_cliente_razao || ""
    }
    if (!ordem.cidade) ordem.cidade = linha.nf_od_cidade || ""
    if (!ordem.regiao) ordem.regiao = linha.nf_od_regiao || ""
    if (!ordem.representante) ordem.representante = linha.nf_od_representante || ""
    if (ordem.rolos == null && linha.nf_od_qtde_rolos != null) ordem.rolos = linha.nf_od_qtde_rolos
    if (ordem.pesoBruto == null && linha.nf_od_peso_bruto != null) ordem.pesoBruto = linha.nf_od_peso_bruto
    if (ordem.pesoLiquido == null && linha.nf_od_peso_liquido != null) {
      ordem.pesoLiquido = linha.nf_od_peso_liquido
    }
    if (!ordem.data && linha.nf_od_data) {
      ordem.data = linha.nf_od_data
      ordem.dataIso = parseDataBr(linha.nf_od_data)
    }

    const pecas = linha.nf_od_qtde ?? 0
    ordem.pecas += pecas
    ordem.valor += linha.nf_od_valor ?? 0
    ordem.notas.push({
      chave: chaveCteNf(linha),
      nfNumero: linha.nf_numero,
      nfSerie: linha.nf_serie,
      nfData: linha.nf_data,
      cteNumero: linha.cte_numero,
      cteSerie: linha.cte_serie,
      transportadora: nomeTransportadora(linha),
      pecas,
      valor: linha.nf_od_valor,
      rateio: linha.nf_item_valor_total,
    })
  }
  const lista = [...mapa.values()]
  for (const ordem of lista) {
    ordem.notas.sort(compararNotaDespacho)
    if (!ordem.transportadora) ordem.transportadora = ordem.notas[0]?.transportadora || ""
  }
  // Mais recentes primeiro; sem data, no fim.
  lista.sort((a, b) => (b.dataIso ?? "").localeCompare(a.dataIso ?? ""))
  return lista
}

function compararNotaDespacho(a: NotaDespacho, b: NotaDespacho): number {
  const na = a.nfNumero ?? 0
  const nb = b.nfNumero ?? 0
  return na - nb
}

/** Contagens e somas da aba de ordens de despacho. */
export function resumoOrdensDespacho(
  ordens: OrdemDespacho[],
  semDespacho: number
): ResumoDespacho {
  let pecas = 0
  let valor = 0
  let notas = 0
  let rolos = 0
  let algumaOrdemComRolos = false
  const pedidos = new Set<number>()
  const romaneios = new Set<number>()
  const transportadoras = new Set<string>()
  for (const ordem of ordens) {
    pecas += ordem.pecas
    valor += ordem.valor
    notas += ordem.notas.length
    if (ordem.pedido != null) pedidos.add(ordem.pedido)
    if (ordem.romaneio != null) romaneios.add(ordem.romaneio)
    if (ordem.transportadora) transportadoras.add(ordem.transportadora)
    if (ordem.rolos != null) {
      rolos += ordem.rolos
      algumaOrdemComRolos = true
    }
  }
  return {
    notas,
    ordens: ordens.length,
    pedidos: pedidos.size,
    romaneios: romaneios.size,
    pecas,
    valor,
    rolos: algumaOrdemComRolos ? rolos : null,
    semDespacho,
    transportadoras: transportadoras.size,
  }
}

export function nomeTranspDistinct(grupos: GrupoCte[]): string[] {
  return [...new Set(grupos.map((g) => g.transportadora))].sort((a, b) => a.localeCompare(b, "pt-BR"))
}

/** Regiões presentes nos CT-es, para o filtro da toolbar. */
export function nomeRegiaoDistinct(grupos: GrupoCte[]): string[] {
  return [...new Set(grupos.map((g) => g.regiao))].sort((a, b) => a.localeCompare(b, "pt-BR"))
}

/**
 * Intervalo de datas realmente coberto pelo relatório que foi carregado.
 *
 * O endpoint do Systêxtil tem a janela **fixa no SQL** (dois meses fechados), e
 * o PDM filtra em cima do que veio. Isso significa que o filtro "De/Até" só
 * consegue reduzir o período — nunca ampliá-lo. Sem mostrar esse alcance, um
 * período fora da janela devolve "nenhuma NF-e" sem explicar por quê.
 */
export function alcanceCarregado(itens: LinhaCte[]): { de: string | null; ate: string | null } {
  const datas = itens.map(dataReferencia).filter((d): d is string => d != null).sort()
  return { de: datas[0] ?? null, ate: datas[datas.length - 1] ?? null }
}

/**
 * Filtro por região do cliente (`nf_od_regiao`), usando a MESMA regra da
 * grade e do dashboard: a primeira região preenchida entre as NF-e do CT-e.
 * O filtro é por CT-e, não por linha — se o CT-e caiu na região, todas as suas
 * NF-e ficam, senão o card do CT-e apareceria pela metade.
 */
export function filtrarPorRegiao(itens: LinhaCte[], regiao: string): LinhaCte[] {
  if (!regiao) return itens
  const chaves = new Set(
    agruparPorCte(itens)
      .filter((g) => g.regiao === regiao)
      .map((g) => g.chave)
  )
  return itens.filter((l) => chaves.has(chaveCte(l)))
}

// ---------------------------------------------------------------------------
// Frete sobre a mercadoria (regra 1,5% a 2,0%)
// ---------------------------------------------------------------------------

/** Limite inferior da faixa esperada de frete sobre a mercadoria. */
export const FRETE_PCT_MINIMO = 1.5
/** Limite superior da faixa esperada de frete sobre a mercadoria. */
export const FRETE_PCT_MAXIMO = 2

/**
 * Frete (total do CT-e) sobre a mercadoria (soma das NF-e do CT-e), em %.
 *
 * O numerador é `cte_valor_total` e não `cte_valor_frete`: o campo de frete do
 * cabeçalho (`cte_vl_frete`) chega em 0/null no endpoint, enquanto o total do
 * CT-e está preenchido em todas as linhas e já é o valor exibido como "Frete"
 * na tela e no CSV.
 *
 * Devolve `null` quando falta qualquer um dos dois — assim o chamador consegue
 * distinguir "zero" de "sem dado" e cair na faixa `indefinido`.
 */
export function freteSobreMercadoria(
  frete: number | null | undefined,
  mercadoria: number | null | undefined
): number | null {
  if (frete == null || !Number.isFinite(frete)) return null
  if (mercadoria == null || !Number.isFinite(mercadoria) || mercadoria <= 0) return null
  return arredondar2((frete / mercadoria) * 100)
}

/**
 * Frete do CT-e, na única fonte que a tela inteira usa.
 *
 * `cte_valor_frete` **não vem preenchido** do endpoint: medido em 01/10/2026 na
 * janela publicada, 0 de 70 linhas com valor maior que zero. O frete deste
 * relatório é o total do conhecimento (`cte_valor_total`) — é o que
 * `calcularResumo` soma uma vez por CT-e e o que `pct_cte_sobre_total_nfs`
 * usa no numerador.
 *
 * Ler `GrupoCte.valorFrete` direto mostra R$ 0,00 em todos os CT-es; por isso
 * tela, PDF e testes passam por aqui.
 */
export function freteCte(grupo: GrupoCte): number | null {
  return grupo.valorTotal
}

/**
 * Classifica o frete % na regra do negócio:
 *
 * - até 1,5% → `abaixo` (verde)
 * - acima de 1,5% até 2,0% → `na_faixa` (laranja) — é o intervalo esperado
 * - acima de 2,0% → `acima` (vermelho)
 * - sem valor calculável → `indefinido` (cinza)
 *
 * Os limites são INCLUSIVOS no lado de cima: 1,5% exato é `abaixo` e 2,0%
 * exato ainda é `na_faixa`, porque a regra é "passou de 1,5" e "passou de 2".
 */
export function classificarFaixaFrete(pct: number | null | undefined): FaixaFrete {
  if (pct == null || !Number.isFinite(pct)) return "indefinido"
  if (pct <= FRETE_PCT_MINIMO) return "abaixo"
  if (pct <= FRETE_PCT_MAXIMO) return "na_faixa"
  return "acima"
}

/**
 * Contagem de faixas dos CT-es informados.
 */
export function contarFaixas(grupos: GrupoCte[]): ContagemFaixas {
  const contagem: ContagemFaixas = { avaliados: 0, abaixo: 0, naFaixa: 0, acima: 0, indefinido: 0 }
  const destino: Record<Exclude<FaixaFrete, "indefinido">, "abaixo" | "naFaixa" | "acima"> = {
    abaixo: "abaixo",
    na_faixa: "naFaixa",
    acima: "acima",
  }
  for (const g of grupos) {
    const faixa = classificarFaixaFrete(g.pctCalculado)
    if (faixa === "indefinido") contagem.indefinido++
    else {
      contagem.avaliados++
      contagem[destino[faixa]]++
    }
  }
  return contagem
}

/**
 * Agrupa os CT-es por uma chave (transportadora, região) e calcula o resumo de
 * frete de cada grupo.
 *
 * `mediaPct` é a média do frete % POR CT-e, não `Σfrete ÷ Σmercadoria`. As duas
 * medidas discordam bastante: medido em 01/10/2026, a SORRISO dava 0,29% pelo
 * ratio agregado e 1,47% pela média por CT-e, porque uma única NF-e de R$ 2
 * milhões puxa o ratio para baixo e mascara 25 CT-es acima de 2%. Como a regra
 * é avaliada CT-e a CT-e, a média é a medida comparável.
 *
 * Ordena por volume de CT-es (maior primeiro) e devolve o total geral no fim.
 */
export function resumirFretePor(
  grupos: GrupoCte[],
  chaveDe: (g: GrupoCte) => string
): ResumoFrete[] {
  const mapa = new Map<string, GrupoCte[]>()
  for (const g of grupos) {
    const chave = chaveDe(g)
    const atual = mapa.get(chave)
    if (atual) atual.push(g)
    else mapa.set(chave, [g])
  }

  const saida: ResumoFrete[] = []
  for (const [chave, ctes] of mapa) {
    const contagem = contarFaixas(ctes)
    const avaliados = ctes.filter((g) => classificarFaixaFrete(g.pctCalculado) !== "indefinido")
    const somaPct = avaliados.reduce((t, g) => t + (g.pctCalculado ?? 0), 0)
    saida.push({
      chave,
      ctes: ctes.length,
      ...contagem,
      mediaPct: avaliados.length ? arredondar2(somaPct / avaliados.length) : null,
      freteTotal: ctes.reduce((t, g) => t + (g.valorTotal || 0), 0),
      mercadoriaTotal: ctes.reduce((t, g) => t + (g.somaNf ?? g.somaNfCalculada), 0),
    })
  }

  return saida.sort((a, b) => b.ctes - a.ctes || a.chave.localeCompare(b.chave, "pt-BR"))
}

/** Resumo de frete por transportadora do CT-e. */
export function resumirFretePorTransportadora(grupos: GrupoCte[]): ResumoFrete[] {
  return resumirFretePor(grupos, (g) => g.transportadora)
}

/** Resumo de frete por região do cliente da ordem de despacho (`nf_od_regiao`). */
export function resumirFretePorRegiao(grupos: GrupoCte[]): ResumoFrete[] {
  return resumirFretePor(grupos, (g) => g.regiao)
}

/**
 * Faixa "atual" de um CT-e, já combinando o cálculo e a classificação.
 * Devolve `indefinido` quando não dá para calcular o percentual.
 */
export function faixaFreteDoCte(g: GrupoCte): FaixaFrete {
  return classificarFaixaFrete(g.pctCalculado)
}
