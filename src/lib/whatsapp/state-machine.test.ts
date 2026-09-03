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
