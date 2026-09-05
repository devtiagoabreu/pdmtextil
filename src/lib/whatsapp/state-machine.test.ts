// @vitest-environment node
import { describe, it, expect } from "vitest"
import { maquinaEstados } from "./state-machine"

function rodar(curEstado: string, curDados: Record<string, any>, msg: string) {
  return maquinaEstados(curEstado, curDados, msg, "", {}, 10)
}

describe("maquinaEstados — captura de nome", () => {
  it("COLETANDO_NOME: rejeita saudação 'Olá' como nome", () => {
    const res = rodar("COLETANDO_NOME", {}, "Olá")
    expect(res.dados.nome).toBeUndefined()
    expect(res.nextEstado).toBe("COLETANDO_NOME")
  })

  it("COLETANDO_NOME: captura nome real 'Tiago'", () => {
    const res = rodar("COLETANDO_NOME", {}, "Tiago")
    expect(res.dados.nome).toBe("Tiago")
    expect(res.nextEstado).toBe("COLETANDO_DOC")
  })

  it("COLETANDO_DOC: não captura saudação como nome quando falta nome", () => {
    const res = rodar("COLETANDO_DOC", {}, "Olá")
    expect(res.dados.nome).toBeUndefined()
  })

  it("COLETANDO_DOC: captura nome real quando falta nome", () => {
    const res = rodar("COLETANDO_DOC", {}, "Tiago")
    expect(res.dados.nome).toBe("Tiago")
  })
})

describe("maquinaEstados — saudação em etapa de coleta não bloqueia", () => {
  it("COLETANDO_INTERESSE: 'Olá' mantém o estado e não conta tentativa", () => {
    const res = rodar("COLETANDO_INTERESSE", { _tentativas: 2 }, "Olá")
    expect(res.nextEstado).toBe("COLETANDO_INTERESSE")
    expect(res.dados._tentativas).toBe(2)
  })

  it("CONFIRMANDO_DADOS_CNPJ: 'Bom dia' mantém o estado e não conta tentativa", () => {
    const res = rodar("CONFIRMANDO_DADOS_CNPJ", { _tentativas: 2 }, "Bom dia")
    expect(res.nextEstado).toBe("CONFIRMANDO_DADOS_CNPJ")
    expect(res.dados._tentativas).toBe(2)
  })

  it("COLETANDO_INTERESSE: resposta real ainda avança e zera tentativas", () => {
    const res = rodar("COLETANDO_INTERESSE", { _tentativas: 2 }, "1,2")
    expect(res.nextEstado).toBe("CONFIRMACAO")
    expect(res.dados.linhasInteresse).toEqual([1, 2])
    expect(res.dados._tentativas).toBe(0)
  })

  it("COLETANDO_INTERESSE: linhas sugeridas pela intenção avançam sem números", () => {
    const res = maquinaEstados("COLETANDO_INTERESSE", { _tentativas: 2 }, "quero a linha azul", "", { 1: "Azul", 2: "Vermelho" }, 10, [1])
    expect(res.nextEstado).toBe("CONFIRMACAO")
    expect(res.dados.linhasInteresse).toEqual([1])
    expect(res.dados.linhasInteresseNomes).toBe("1 - Azul")
    expect(res.dados._tentativas).toBe(0)
  })

  it("COLETANDO_INTERESSE: números explícitos vencem as linhas sugeridas", () => {
    const res = maquinaEstados("COLETANDO_INTERESSE", {}, "2", "", { 1: "Azul", 2: "Vermelho" }, 10, [1])
    expect(res.dados.linhasInteresse).toEqual([2])
  })
})
