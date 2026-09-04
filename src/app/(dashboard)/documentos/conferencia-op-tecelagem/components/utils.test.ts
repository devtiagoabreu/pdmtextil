// @vitest-environment node
import { describe, it, expect } from "vitest"
import { buildGrupos, montarProduto, normalizeRolo } from "./utils"

describe("montarProduto", () => {
  it("concatena nivel.grupo.sub.item separados por ponto", () => {
    expect(
      montarProduto({ nivel: "3", grupo: "1", sub: "2", item: "SARJA 1001" }),
    ).toBe("3.1.2.SARJA 1001")
  })

  it("ignora partes vazias", () => {
    expect(
      montarProduto({ nivel: "2", grupo: "4", sub: "", item: "Brim 2002" }),
    ).toBe("2.4.Brim 2002")
    expect(montarProduto({ nivel: "1", grupo: "", sub: "3", item: "ITEM" })).toBe("1.3.ITEM")
  })

  it("retorna string vazia quando não há nenhuma parte", () => {
    expect(montarProduto({ nivel: "", grupo: null, sub: null, item: "" })).toBe("")
    expect(montarProduto(null)).toBe("")
    expect(montarProduto(undefined)).toBe("")
  })
})

describe("normalizeRolo", () => {
  it("extrai nivel, grupo e sub mesmo com chaves em maiúsculas", () => {
    const rolo = normalizeRolo({
      OP: 99999,
      NIVEL: "2",
      GRUPO: "4",
      SUB: "0",
      CODIGO_ROLO: 2001,
    })
    expect(rolo.nivel).toBe("2")
    expect(rolo.grupo).toBe("4")
    expect(rolo.sub).toBe("0")
  })
})

describe("buildGrupos", () => {
  const rolos = [
    { ...normalizeRolo({ OP: 111, NIVEL: "1", GRUPO: "1", SUB: "1", ITEM: "A" }) },
    { ...normalizeRolo({ OP: 222, NIVEL: "2", GRUPO: "2", SUB: "2", ITEM: "B" }) },
  ]

  it("preenche o produto do grupo a partir da capa", () => {
    const grupos = buildGrupos(rolos, "asc")
    expect(grupos[0].produto).toBe("1.1.1.A")
    expect(grupos[1].produto).toBe("2.2.2.B")
  })

  it("ordena decrescente por padrão e crescente quando pedido", () => {
    expect(buildGrupos(rolos).map((g) => g.op)).toEqual(["222", "111"])
    expect(buildGrupos(rolos, "asc").map((g) => g.op)).toEqual(["111", "222"])
  })
})