// @vitest-environment node
import { describe, expect, it, vi, beforeEach } from "vitest"

const mockSelect = vi.fn().mockResolvedValue([])
const mockInsert = vi.fn().mockResolvedValue([])
const mockUpdate = vi.fn().mockResolvedValue([])
const mockLimit = vi.fn().mockResolvedValue([])

vi.mock("@/lib/db", () => ({
  db: {
    select: () => {
      const chain = {
        from: () => chain,
        where: () => ({
          limit: () => mockLimit(),
          then: (resolve: (v: unknown) => void) => Promise.resolve(mockSelect()).then(resolve),
        }),
      }
      return chain
    },
    insert: (...args: unknown[]) => ({
      values: (...vals: unknown[]) => {
        mockInsert(args[0], vals[0])
        return Promise.resolve([])
      },
    }),
    update: (...args: unknown[]) => ({
      set: (...setArgs: unknown[]) => ({
        where: (...whereArgs: unknown[]) => {
          mockUpdate(args[0], setArgs[0], whereArgs[0])
          return Promise.resolve([])
        },
      }),
    }),
  },
}))

import { diasDaPeriodicidade, gerarOcorrencias, avancarPlano } from "./agendamento"

beforeEach(() => {
  vi.clearAllMocks()
  mockSelect.mockResolvedValue([])
  mockLimit.mockResolvedValue([])
})

describe("diasDaPeriodicidade", () => {
  it("retorna dias corretos para cada periodicidade", () => {
    expect(diasDaPeriodicidade("DIARIA")).toBe(1)
    expect(diasDaPeriodicidade("SEMANAL")).toBe(7)
    expect(diasDaPeriodicidade("MENSAL")).toBe(30)
    expect(diasDaPeriodicidade("TRIMESTRAL")).toBe(90)
    expect(diasDaPeriodicidade("SEMESTRAL")).toBe(180)
    expect(diasDaPeriodicidade("ANUAL")).toBe(365)
    expect(diasDaPeriodicidade("BIENAL")).toBe(730)
    expect(diasDaPeriodicidade("TRIENAL")).toBe(1095)
    expect(diasDaPeriodicidade("QUINQUENAL")).toBe(1825)
  })

  it("usa override de dias quando fornecido", () => {
    expect(diasDaPeriodicidade("MENSAL", 15)).toBe(15)
    expect(diasDaPeriodicidade("ANUAL", 30)).toBe(30)
  })

  it("cai no default 30 para periodicidade desconhecida", () => {
    expect(diasDaPeriodicidade("OUTRA")).toBe(30)
  })
})

describe("gerarOcorrencias", () => {
  it("gera ocorrências mensais para janela de 12 meses sem duplicatas", async () => {
    mockLimit.mockResolvedValue([])

    const count = await gerarOcorrencias(1, {
      proximaData: "2026-01-15",
      periodicidade: "MENSAL",
      ativoId: 10,
      tipoVistoriaId: 5,
    })

    expect(count).toBe(13)
    expect(mockInsert).toHaveBeenCalledTimes(1)
  })

  it("pula datas que já existem", async () => {
    mockSelect.mockResolvedValue([
      { dataProgramada: "2026-01-15" },
      { dataProgramada: "2026-03-16" },
    ])

    const count = await gerarOcorrencias(1, {
      proximaData: "2026-01-15",
      periodicidade: "MENSAL",
      ativoId: 10,
      tipoVistoriaId: 5,
    })

    expect(count).toBe(11)
  })
})

describe("avancarPlano", () => {
  it("atualiza proximaData e cria próxima ocorrência", async () => {
    mockLimit
      .mockResolvedValueOnce([
        { id: 1, tipoVistoriaId: 5, diasIntervalo: null, responsavelId: null },
      ])
      .mockResolvedValueOnce([{ periodicidade: "MENSAL", diasIntervalo: null }])
      .mockResolvedValueOnce([])

    await avancarPlano(1, "2026-01-15")

    expect(mockUpdate).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalled()
  })
})
