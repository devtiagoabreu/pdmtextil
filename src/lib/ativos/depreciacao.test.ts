import { describe, expect, it } from "vitest"
import {
  calcularDepreciacao,
  formatarMoeda,
  formatarPercentual,
  formatarDataISO,
} from "./depreciacao"

describe("calcularDepreciacao", () => {
  const REF = "2026-09-01"

  it("não deprecia quando falta vida útil", () => {
    const r = calcularDepreciacao({
      valorAquisicao: 12000,
      valorResidual: 2000,
      vidaUtilAnos: null,
      dataAquisicao: "2024-01-01",
      dataReferencia: REF,
    })
    expect(r.deprecia).toBe(false)
    expect(r.depreciacaoAcumulada).toBe(0)
    expect(r.valorContabil).toBe(12000)
    expect(r.lancamentos).toEqual([])
  })

  it("não deprecia quando não há data de aquisição", () => {
    const r = calcularDepreciacao({
      valorAquisicao: 12000,
      valorResidual: 2000,
      vidaUtilAnos: 5,
      dataAquisicao: null,
      dataReferencia: REF,
    })
    expect(r.deprecia).toBe(false)
  })

  it("não deprecia quando o valor depreciável é zero", () => {
    const r = calcularDepreciacao({
      valorAquisicao: 1000,
      valorResidual: 1000,
      vidaUtilAnos: 5,
      dataAquisicao: "2024-01-01",
      dataReferencia: REF,
    })
    expect(r.deprecia).toBe(false)
  })

  it("calcula valores mensais e acumulados corretamente", () => {
    const r = calcularDepreciacao({
      valorAquisicao: 12000,
      valorResidual: 2000,
      vidaUtilAnos: 5,
      dataAquisicao: "2024-01-01",
      dataReferencia: REF,
    })
    expect(r.deprecia).toBe(true)
    expect(r.baseDepreciavel).toBe(10000)
    expect(r.depreciacaoAnual).toBe(2000)
    expect(r.depreciacaoMensal).toBeCloseTo(166.67, 1)
    expect(r.mesesVidaUtil).toBe(60)
    // jan/2024 → set/2026 = 32 meses completos
    expect(r.mesesDecorridos).toBe(32)
    expect(r.depreciacaoAcumulada).toBeCloseTo(5333.33, 1)
    expect(r.valorContabil).toBeCloseTo(6666.67, 1)
    expect(r.faltanteDepreciar).toBeCloseTo(4666.67, 1)
    expect(r.percentualDepreciado).toBeCloseTo(53.3, 0)
    expect(r.totalmenteDepreciado).toBe(false)
    expect(r.dataInicio).toBe("2024-01-01")
    expect(r.dataFim).toBe("2028-12-31")
  })

  it("marca como totalmente depreciado após o fim da vida útil", () => {
    const r = calcularDepreciacao({
      valorAquisicao: 12000,
      valorResidual: 2000,
      vidaUtilAnos: 2,
      dataAquisicao: "2020-01-01",
      dataReferencia: REF,
    })
    expect(r.totalmenteDepreciado).toBe(true)
    expect(r.depreciacaoAcumulada).toBe(10000)
    expect(r.valorContabil).toBe(2000)
    expect(r.faltanteDepreciar).toBe(0)
    expect(r.percentualDepreciado).toBe(100)
  })

  it("não deprecia antes da data de aquisição (futura)", () => {
    const r = calcularDepreciacao({
      valorAquisicao: 12000,
      valorResidual: 2000,
      vidaUtilAnos: 5,
      dataAquisicao: "2027-01-01",
      dataReferencia: REF,
    })
    expect(r.mesesDecorridos).toBe(0)
    expect(r.depreciacaoAcumulada).toBe(0)
    expect(r.valorContabil).toBe(12000)
    expect(r.totalmenteDepreciado).toBe(false)
  })

  it("gera projeção anual respeitando pro-rata do 1º e último ano", () => {
    const r = calcularDepreciacao({
      valorAquisicao: 12000,
      valorResidual: 0,
      vidaUtilAnos: 2,
      dataAquisicao: "2024-03-01",
      dataReferencia: REF,
    })
    expect(r.lancamentos.map((l) => l.ano)).toEqual([2024, 2025, 2026])
    const [a2024, a2025, a2026] = r.lancamentos
    // mar/2024 → fev/2026: 10 meses em 2024, 12 em 2025, 2 em 2026
    expect(a2024.meses).toBe(10)
    expect(a2025.meses).toBe(12)
    expect(a2026.meses).toBe(2)
    expect(a2024.depreciacaoAcumulada).toBeCloseTo(5000, 0)
    expect(a2025.depreciacaoAcumulada).toBe(11000)
    expect(a2026.depreciacaoAcumulada).toBe(12000)
    expect(a2026.valorContabil).toBe(0)
    expect(a2026.percentualAcumulado).toBe(100)
    expect(r.lancamentos.reduce((s, l) => s + l.depreciacaoAno, 0)).toBeCloseTo(12000, 0)
  })

  it("aceita strings nos valores e referencia explícita", () => {
    const r = calcularDepreciacao({
      valorAquisicao: "12000",
      valorResidual: "2000",
      vidaUtilAnos: 5,
      dataAquisicao: new Date("2024-01-01"),
      dataReferencia: new Date("2026-09-01"),
    })
    expect(r.deprecia).toBe(true)
    expect(r.valorAquisicao).toBe(12000)
  })
})

describe("formatadores", () => {
  it("formata moeda em pt-BR", () => {
    expect(formatarMoeda(6666.67)).toBe("R$\u00A06.666,67")
  })

  it("formata percentual com vírgula", () => {
    expect(formatarPercentual(53.3)).toBe("53,3%")
  })

  it("formata data ISO", () => {
    expect(formatarDataISO("2024-01-01")).toBe("01/01/2024")
    expect(formatarDataISO(null)).toBe("—")
  })
})
