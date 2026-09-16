export type MetodoDepreciacao = "LINEAR"

export type ReformaDepreciacao = {
  data: string | Date | null
  valor?: number | string | null
  extensaoVidaUtilAnos?: number | null
}

export type ParametrosDepreciacao = {
  valorAquisicao?: number | string | null
  valorResidual?: number | string | null
  vidaUtilAnos?: number | null
  dataAquisicao?: string | Date | null
  dataReferencia?: string | Date | null
  reformas?: ReformaDepreciacao[]
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
  custoTotal: number
  valorReformas: number
  vidaUtilAnosTotal: number
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

function fimMes(data: Date): Date {
  return new Date(Date.UTC(data.getUTCFullYear(), data.getUTCMonth() + 1, 0))
}

export function calcularDepreciacao(param: ParametrosDepreciacao): ResultadoDepreciacao {
  const valorAquisicao = paraNumero(param.valorAquisicao)
  const valorResidual = paraNumero(param.valorResidual)
  const vidaUtilAnos = Math.max(0, Math.floor(paraNumero(param.vidaUtilAnos)))
  const dataInicio = param.dataAquisicao ? parseDataUTC(param.dataAquisicao) : null
  const dataRef = parseDataUTC(param.dataReferencia ?? new Date()) ?? new Date()

  const reformasRaw = (param.reformas ?? [])
    .filter((r) => {
      const d = parseDataUTC(r.data)
      if (!d || !dataInicio) return false
      return d >= dataInicio && paraNumero(r.extensaoVidaUtilAnos) > 0
    })
    .map((r) => ({
      data: parseDataUTC(r.data)!,
      valor: Math.max(0, paraNumero(r.valor)),
      ext: Math.max(0, Math.floor(paraNumero(r.extensaoVidaUtilAnos))),
    }))
    .sort((a, b) => a.data.getTime() - b.data.getTime())

  const reformasRef = reformasRaw.filter((r) => r.data <= dataRef)
  const sumReformas = reformasRef.reduce((s, r) => s + r.valor, 0)
  const sumExtensions = reformasRef.reduce((s, r) => s + r.ext, 0)
  const custoTotal = valorAquisicao + sumReformas
  const vidaUtilAnosTotal = vidaUtilAnos + sumExtensions
  const baseDepreciavel = Math.max(custoTotal - valorResidual, 0)
  const mesesVidaUtilOriginal = vidaUtilAnos * 12

  const deprecia = vidaUtilAnosTotal > 0 && baseDepreciavel > 0 && dataInicio !== null

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
    mesesVidaUtil: mesesVidaUtilOriginal,
    mesesDecorridos: 0,
    depreciacaoAcumulada: 0,
    percentualDepreciado: 0,
    valorContabil: dois(valorAquisicao),
    faltanteDepreciar: dois(baseDepreciavel),
    totalmenteDepreciado: false,
    lancamentos: [],
    custoTotal: dois(custoTotal),
    valorReformas: dois(sumReformas),
    vidaUtilAnosTotal,
  }

  if (!deprecia || !dataInicio) return vazio

  const reformMeses = reformasRaw.map((r) => diffMeses(dataInicio, r.data))
  let reformIdx = 0
  const mesesAlvo = Math.min(Math.max(diffMeses(dataInicio, dataRef), 0), 2400)

  let cv = valorAquisicao
  let mr = mesesVidaUtilOriginal
  let acum = 0
  let lastRate = 0
  let cvRef = valorAquisicao
  let mrRef = mr
  let acumRef = 0
  let mesesDecorridosRef = 0
  let dataFimDate: Date | null = null

  const porAno = new Map<number, { meses: number; depreciacao: number; cvFim: number }>()

  for (let mes = 0; mes < 2400; mes++) {
    const atual = addMesesUTC(dataInicio, mes)

    while (reformIdx < reformasRaw.length && reformMeses[reformIdx] === mes) {
      cv += reformasRaw[reformIdx].valor
      mr += reformasRaw[reformIdx].ext * 12
      reformIdx++
    }

    const baseRestante = cv - valorResidual
    if ((mr <= 0 || baseRestante <= 0.005) && reformIdx >= reformasRaw.length) break
    if (mr <= 0 || baseRestante <= 0.005) continue

    const dep = baseRestante / mr
    cv -= dep
    acum += dep
    mr -= 1
    if (dep > 0) lastRate = dep

    if (mes < mesesAlvo) {
      cvRef = cv
      mrRef = mr
      acumRef = acum
      mesesDecorridosRef++
    }

    const ano = anoDe(atual)
    const registro = porAno.get(ano) ?? { meses: 0, depreciacao: 0, cvFim: 0 }
    registro.meses += 1
    registro.depreciacao += dep
    registro.cvFim = cv
    porAno.set(ano, registro)

    dataFimDate = fimMes(atual)
  }

  const mesesDecorridos = mesesDecorridosRef
  const totalmenteDepreciado = mrRef <= 0 && cvRef <= valorResidual + 0.005
  const depreciacaoAcumulada = dois(acumRef)
  const valorContabil = dois(cvRef)
  const faltanteDepreciar = dois(Math.max(baseDepreciavel - acumRef, 0))
  const percentualDepreciado = baseDepreciavel > 0 ? um((acumRef / baseDepreciavel) * 100) : 0
  const depreciacaoMensal = lastRate
  const depreciacaoAnual = dois(lastRate * 12)
  const dataFim = dataFimDate ? dataFimDate.toISOString().slice(0, 10) : null
  const mesesVidaUtil = vidaUtilAnosTotal * 12

  const lancamentos: AnoLancamentoDepreciacao[] = []
  let acumuladoFim = 0
  for (const [ano, { meses, depreciacao, cvFim }] of [...porAno.entries()].sort(
    (a, b) => a[0] - b[0]
  )) {
    acumuladoFim = Math.min(baseDepreciavel, dois(acumuladoFim + depreciacao))
    lancamentos.push({
      ano,
      meses,
      depreciacaoAno: dois(depreciacao),
      depreciacaoAcumulada: dois(acumuladoFim),
      valorContabil: dois(cvFim),
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
    dataInicio: dataInicio.toISOString().slice(0, 10),
    dataFim,
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
    custoTotal: dois(custoTotal),
    valorReformas: dois(sumReformas),
    vidaUtilAnosTotal,
  }
}
