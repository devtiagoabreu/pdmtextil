// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/ai", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/lib/ai")>()
  return {
    ...original,
    chamarIA: vi.fn(),
  }
})

import { chamarIA } from "@/lib/ai"
import { analisarEscalacao, analisarLinhas, parecePedidoEscalacao, temIndicioDeLinhas } from "./intencao"

const chamarIA_mock = chamarIA as unknown as ReturnType<typeof vi.fn>

function respostaIA(conteudo: string) {
  return { conteudo, provedor: "groq", modelo: "qwen/qwen3.8-27b", nomeChave: "DB key 1", tentativas: 1 }
}

beforeEach(() => {
  chamarIA_mock.mockReset()
})

describe("analisarEscalacao", () => {
  it("sem indício de pedido não chama a IA e mantém o resultado do regex", async () => {
    const res = await analisarEscalacao("Oi, tudo bem?", "SAUDACAO")
    expect(chamarIA_mock).not.toHaveBeenCalled()
    expect(res).toEqual({ querAtendente: false, querReiniciar: false, via: "regex" })
  })

  it("usa a classificação da IA quando o gate dispara", async () => {
    chamarIA_mock.mockResolvedValue(respostaIA('{"querAtendente":true,"querReiniciar":false}'))
    const res = await analisarEscalacao("queria conversar com vocês", "COLETANDO_NOME")
    expect(res).toEqual({ querAtendente: true, querReiniciar: false, via: "llm" })
    expect(chamarIA_mock).toHaveBeenCalledTimes(1)
  })

  it("corrige falso positivo: 'pessoa física' em COLETANDO_DOC não vira pedido de atendente", async () => {
    chamarIA_mock.mockResolvedValue(respostaIA('{"querAtendente":false,"querReiniciar":false}'))
    const res = await analisarEscalacao("sou pessoa física", "COLETANDO_DOC")
    expect(res.querAtendente).toBe(false)
  })

  it("volta ao regex quando a IA não devolve JSON válido", async () => {
    chamarIA_mock.mockResolvedValue(respostaIA("não entendi"))
    const res = await analisarEscalacao("quero falar com um atendente", "COLETANDO_NOME")
    expect(res.querAtendente).toBe(true)
    expect(res.via).toBe("regex")
  })

  it("volta ao regex quando a IA lança erro", async () => {
    chamarIA_mock.mockRejectedValue(new Error("timeout"))
    const res = await analisarEscalacao("quero reiniciar do zero", "COLETANDO_NOME")
    expect(res.querReiniciar).toBe(true)
    expect(res.via).toBe("regex")
  })
})

describe("analisarLinhas", () => {
  it("mapeia nome de linha citado para o número", async () => {
    chamarIA_mock.mockResolvedValue(respostaIA('{"linhas":[1]}'))
    const res = await analisarLinhas("quero a linha azul", { 1: "Azul", 2: "Vermelho" }, 10)
    expect(res).toEqual([1])
  })

  it("filtra números fora do intervalo e ordena", async () => {
    chamarIA_mock.mockResolvedValue(respostaIA('{"linhas":[5,1,99,0,-2]}'))
    const res = await analisarLinhas("quero 1 e 5", { 1: "Azul" }, 5)
    expect(res).toEqual([1, 5])
  })

  it("retorna undefined quando a IA responde sem JSON", async () => {
    chamarIA_mock.mockResolvedValue(respostaIA("desculpe"))
    const res = await analisarLinhas("quero a linha azul", { 1: "Azul" }, 5)
    expect(res).toBeUndefined()
  })

  it("retorna undefined quando a IA lança erro", async () => {
    chamarIA_mock.mockRejectedValue(new Error("boom"))
    const res = await analisarLinhas("quero a linha azul", { 1: "Azul" }, 5)
    expect(res).toBeUndefined()
  })
})

describe("gates", () => {
  it("parecePedidoEscalacao reconhece pedidos explícitos", () => {
    expect(parecePedidoEscalacao("quero falar com um atendente")).toBe(true)
    expect(parecePedidoEscalacao("quero voltar ao início")).toBe(true)
    expect(parecePedidoEscalacao("bom dia")).toBe(false)
  })

  it("temIndicioDeLinhas reconhece mensagens com referência a linhas", () => {
    expect(temIndicioDeLinhas("quero a linha azul")).toBe(true)
    expect(temIndicioDeLinhas("gostaria de ver o catálogo")).toBe(true)
    expect(temIndicioDeLinhas("bom dia")).toBe(false)
  })
})