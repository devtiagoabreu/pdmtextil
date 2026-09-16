export type MetodoDepreciacao = "LINEAR"

export type ParametrosDepreciacao = {
  valorAquisicao?: number | string | null
  valorResidual?: number | string | null
  vidaUtilAnos?: number | null
  dataAquisicao?: string | Date | null
  dataReferencia?: string | Date | null
}

export type AnoLancamentoDepreciacao = {
  ano: number
  meses: number
  depreciacaoAno: number
  depreciacaoAcumulada: number
  valorContabil: number
  percentualAcumulado: number
}

export type ResultadoDepreciacao = {
  metodo: MetodoDepreciacao
  deprecia: boolean
  valorAquisicao: number
  valorResidual: number
  vidaUtilAnos: number
  baseDepreciavel: number
  dataInicio: string | null
  dataFim: string | null
  depreciacaoAnual: number
  depreciacaoMensal: number
  mesesVidaUtil: number
  mesesDecorridos: number
  depreciacaoAcumulada: number
  percentualDepreciado: number
  valorContabil: number
  faltanteDepreciar: number
  totalmenteDepreciado: boolean
  lancamentos: AnoLancamentoDepreciacao[]
}

const formatadorMoeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

export function formatarMoeda(valor: number): string {
  return formatadorMoeda.format(valor)
}

export function formatarPercentual(valor: number): string {
  return `${valor.toFixed(1).replace(".", ",")}%`
}

export function formatarDataISO(iso: string | null | undefined): string {
  if (!iso) return "—"
  const [ano, mes, dia] = iso.slice(0, 10).split("-")
  if (!ano || !mes || !dia) return "—"
  return `${dia}/${mes}/${ano}`
}

function paraNumero(valor: number | string | null | undefined): number {
  if (valor === null || valor === undefined || valor === "") return 0
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

function dois(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}

function um(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 10) / 10
}

function parseDataUTC(valor: string | Date | null | undefined): Date | null {
  if (valor === null || valor === undefined || valor === "") return null
  const texto =
    valor instanceof Date ? valor.toISOString().slice(0, 10) : String(valor).slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null
  const d = new Date(`${texto}T00:00:00.000Z`)
  return Number.isNaN(d.getTime()) ? null : d
}

function addMesesUTC(data: Date, meses: number): Date {
  const d = new Date(data)
  d.setUTCMonth(d.getUTCMonth() + meses)
  return d
}

function diffMeses(inicio: Date, fim: Date): number {
  const anos = fim.getUTCFullYear() - inicio.getUTCFullYear()
  const meses = fim.getUTCMonth() - inicio.getUTCMonth()
  return anos * 12 + meses
}

function anoDe(data: Date): number {
  return data.getUTCFullYear()
}

export function calcularDepreciacao(param: ParametrosDepreciacao): ResultadoDepreciacao {
  const valorAquisicao = paraNumero(param.valorAquisicao)
  const valorResidual = paraNumero(param.valorResidual)
  const vidaUtilAnos = Math.max(0, Math.floor(paraNumero(param.vidaUtilAnos)))
  const baseDepreciavel = Math.max(valorAquisicao - valorResidual, 0)
  const dataInicio = param.dataAquisicao ? parseDataUTC(param.dataAquisicao) : null
  const dataRef = parseDataUTC(param.dataReferencia ?? new Date()) ?? new Date()
  const deprecia = vidaUtilAnos > 0 && baseDepreciavel > 0 && dataInicio !== null

  const vazio: ResultadoDepreciacao = {
    metodo: "LINEAR",
    deprecia: false,
    valorAquisicao,
    valorResidual,
    vidaUtilAnos,
    baseDepreciavel,
    dataInicio: dataInicio ? dataInicio.toISOString().slice(0, 10) : null,
    dataFim: null,
    depreciacaoAnual: 0,
    depreciacaoMensal: 0,
    mesesVidaUtil: 0,
    mesesDecorridos: 0,
    depreciacaoAcumulada: 0,
    percentualDepreciado: 0,
    valorContabil: dois(valorAquisicao),
    faltanteDepreciar: dois(baseDepreciavel),
    totalmenteDepreciado: false,
    lancamentos: [],
  }

  if (!deprecia || !dataInicio) return vazio

  const inicio = dataInicio
  const mesesVidaUtil = vidaUtilAnos * 12
  const ultimoMes = addMesesUTC(inicio, mesesVidaUtil - 1)
  const fim = new Date(Date.UTC(ultimoMes.getUTCFullYear(), ultimoMes.getUTCMonth() + 1, 0))
    .toISOString()
    .slice(0, 10)
  const depreciacaoAnual = dois(baseDepreciavel / vidaUtilAnos)
  const depreciacaoMensal = baseDepreciavel / mesesVidaUtil
  const mesesDecorridos = Math.min(Math.max(diffMeses(inicio, dataRef), 0), mesesVidaUtil)
  const depreciacaoAcumulada = Math.min(baseDepreciavel, dois(depreciacaoMensal * mesesDecorridos))
  const totalmenteDepreciado = mesesDecorridos >= mesesVidaUtil
  const faltanteDepreciar = dois(baseDepreciavel - depreciacaoAcumulada)
  const valorContabil = dois(valorAquisicao - depreciacaoAcumulada)
  const percentualDepreciado =
    baseDepreciavel > 0 ? um((depreciacaoAcumulada / baseDepreciavel) * 100) : 0

  const porAno = new Map<number, { meses: number; depreciacao: number }>()
  let acumulado = 0
  for (let mes = 0; mes < mesesVidaUtil; mes++) {
    const atual = addMesesUTC(inicio, mes)
    const ano = anoDe(atual)
    const ultimoDoPeriodo = mes === mesesVidaUtil - 1
    const depreciacaoDoMes = ultimoDoPeriodo ? dois(baseDepreciavel - acumulado) : depreciacaoMensal
    const registro = porAno.get(ano) ?? { meses: 0, depreciacao: 0 }
    registro.meses += 1
    registro.depreciacao += depreciacaoDoMes
    porAno.set(ano, registro)
    acumulado = Math.min(baseDepreciavel, dois(acumulado + depreciacaoDoMes))
  }

  const lancamentos: AnoLancamentoDepreciacao[] = []
  let acumuladoFim = 0
  for (const [ano, { meses, depreciacao }] of [...porAno.entries()].sort((a, b) => a[0] - b[0])) {
    acumuladoFim = Math.min(baseDepreciavel, dois(acumuladoFim + depreciacao))
    lancamentos.push({
      ano,
      meses,
      depreciacaoAno: dois(depreciacao),
      depreciacaoAcumulada: dois(acumuladoFim),
      valorContabil: dois(valorAquisicao - acumuladoFim),
      percentualAcumulado: baseDepreciavel > 0 ? um((acumuladoFim / baseDepreciavel) * 100) : 0,
    })
  }

  return {
    metodo: "LINEAR",
    deprecia: true,
    valorAquisicao,
    valorResidual,
    vidaUtilAnos,
    baseDepreciavel: dois(baseDepreciavel),
    dataInicio: inicio.toISOString().slice(0, 10),
    dataFim: fim,
    depreciacaoAnual,
    depreciacaoMensal,
    mesesVidaUtil,
    mesesDecorridos,
    depreciacaoAcumulada,
    percentualDepreciado,
    valorContabil,
    faltanteDepreciar,
    totalmenteDepreciado,
    lancamentos,
  }
}
