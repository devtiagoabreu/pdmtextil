// @vitest-environment node
import { describe, it, expect } from "vitest"
import { rejeitarNome, extrairNomeDaResposta, ehSaudacao } from "./validation"

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

describe("ehSaudacao", () => {
  it("reconhece saudações simples", () => {
    expect(ehSaudacao("Olá")).toBe(true)
    expect(ehSaudacao("oi")).toBe(true)
    expect(ehSaudacao("Bom dia")).toBe(true)
    expect(ehSaudacao("Boa tarde!")).toBe(true)
    expect(ehSaudacao("Oi, tudo bem?")).toBe(true)
    expect(ehSaudacao("Olá, tudo bem")).toBe(true)
  })

  it("não reconhece respostas de conteúdo como saudação", () => {
    expect(ehSaudacao("sim")).toBe(false)
    expect(ehSaudacao("Tiago")).toBe(false)
    expect(ehSaudacao("Ola, qual linha te interessa")).toBe(false)
    expect(ehSaudacao("1,2")).toBe(false)
  })
})
