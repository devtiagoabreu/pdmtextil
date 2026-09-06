// @vitest-environment node
import { describe, expect, it } from "vitest"
import { calcularTrajeto, haversineKm } from "./roteiro-geo"

describe("haversineKm", () => {
  it("calcula a distância geodésica entre dois pontos", () => {
    const km = haversineKm(
      { latitude: -23.5505, longitude: -46.6333 },
      { latitude: -22.9035, longitude: -43.1729 }
    )
    expect(km).toBeGreaterThan(340)
    expect(km).toBeLessThan(380)
  })

  it("retorna 0 para pontos idênticos", () => {
    const km = haversineKm({ latitude: -23.55, longitude: -46.63 }, { latitude: -23.55, longitude: -46.63 })
    expect(km).toBe(0)
  })
})

describe("calcularTrajeto", () => {
  it("soma as distâncias entre pontos consecutivos", () => {
    const pontos = [
      { id: 1, latitude: -23.5505, longitude: -46.6333 },
      { id: 2, latitude: -22.9035, longitude: -43.1729 },
      { id: 3, latitude: -22.9068, longitude: -43.1729 },
    ]
    const { kmEntrePontos, totalKm } = calcularTrajeto(pontos)
    expect(kmEntrePontos).toHaveLength(2)
    expect(totalKm).toBeCloseTo(kmEntrePontos[0] + kmEntrePontos[1], 6)
    expect(totalKm).toBeGreaterThan(kmEntrePontos[1])
  })

  it("retorna vazio e zero para ponto único", () => {
    const { kmEntrePontos, totalKm } = calcularTrajeto([{ id: 1, latitude: -23.55, longitude: -46.63 }])
    expect(kmEntrePontos).toEqual([])
    expect(totalKm).toBe(0)
  })
})