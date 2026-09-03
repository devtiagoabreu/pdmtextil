// @vitest-environment node
import { describe, it, expect } from "vitest"
import { rejeitarNome, extrairNomeDaResposta } from "./validation"

describe("rejeitarNome — saudações acentuadas", () => {
  it("rejeita 'Olá' como nome", () => {
    expect(rejeitarNome("Olá")).not.toBeNull()
  })

  it("rejeita 'oi' como nome", () => {
    expect(rejeitarNome("oi")).not.toBeNull()
  })

  it("rejeita 'Bom dia' como nome", () => {
    expect(rejeitarNome("Bom dia")).not.toBeNull()
  })

  it("extrairNomeDaResposta retorna null para saudação acentuada", () => {
    expect(extrairNomeDaResposta("Olá")).toBeNull()
  })

  it("aceita nome real 'Tiago'", () => {
    expect(rejeitarNome("Tiago")).toBeNull()
    expect(extrairNomeDaResposta("Tiago")).toBe("Tiago")
  })
})
