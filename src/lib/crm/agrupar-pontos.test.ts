import { describe, expect, it } from "vitest"
import { agruparPontos } from "./agrupar-pontos"

describe("agruparPontos", () => {
  it("mantém pontos distintos e agrupa os que caem na mesma célula", () => {
    const grupos = agruparPontos([
      { id: 1, latitude: -16.681, longitude: -49.253, rotulo: "A" },
      { id: 2, latitude: -16.681, longitude: -49.253, rotulo: "B" },
      { id: 3, latitude: -22.217, longitude: -49.95, rotulo: "C" },
      { id: 4, latitude: -16.681, longitude: -49.253, rotulo: "D" },
    ])
    expect(grupos).toHaveLength(2)
    const [grupo, sozinho] = grupos
    expect(grupo.ids).toEqual([1, 2, 4])
    expect(grupo.rotulos).toEqual(["A", "B", "D"])
    expect(grupo.ordem).toEqual([1, 2, 4])
    expect(grupo.latitude).toBe(-16.681)
    expect(sozinho.ids).toEqual([3])
    expect(sozinho.ordem).toEqual([3])
  })

  it("agrupa pontos próximos com precisão menor", () => {
    const grupos = agruparPontos(
      [
        { id: 1, latitude: -16.6814, longitude: -49.2534, rotulo: "A" },
        { id: 2, latitude: -16.6816, longitude: -49.2536, rotulo: "B" },
      ],
      2
    )
    expect(grupos).toHaveLength(1)
    expect(grupos[0].ids).toEqual([1, 2])
  })

  it("retorna lista vazia sem pontos", () => {
    expect(agruparPontos([])).toEqual([])
  })
})