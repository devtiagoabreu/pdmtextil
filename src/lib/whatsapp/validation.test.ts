// @vitest-environment node
import { describe, it, expect } from "vitest"
import { rejeitarNome, extrairNomeDaResposta, ehSaudacao, parseLinhas } from "./validation"

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

describe("parseLinhas", () => {
  it("parseia números separados por vírgula", () => {
    expect(parseLinhas("1,2,4", 10)).toEqual([1, 2, 4])
    expect(parseLinhas("1, 3", 10)).toEqual([1, 3])
  })

  it("parseia números multiusados como uma linha só (não dígito a dígito)", () => {
    expect(parseLinhas("12", 15)).toEqual([12])
    expect(parseLinhas("linha 12", 15)).toEqual([12])
  })

  it("não mistura dígitos de números grandes (telefone/CPF) como linhas", () => {
    expect(parseLinhas("5519999999999", 15)).toEqual([])
    expect(parseLinhas("12345678900", 15)).toEqual([])
  })

  it("filtra números fora do intervalo e remove duplicados, ordenado", () => {
    expect(parseLinhas("2, 99, 2, 0, 7", 15)).toEqual([2, 7])
  })

  it("retorna vazio sem números", () => {
    expect(parseLinhas("quero a linha azul", 10)).toEqual([])
  })
})
