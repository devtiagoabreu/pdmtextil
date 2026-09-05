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
import { extrairDadosLead } from "./groq"

const chamarIA_mock = chamarIA as unknown as ReturnType<typeof vi.fn>

const historico = [
  { role: "user" as const, content: "Ola" },
  { role: "assistant" as const, content: "Ola! Qual o seu nome?" },
  { role: "user" as const, content: "Tiago" },
  { role: "assistant" as const, content: "Prazer, Tiago! Voce e PF ou PJ?" },
  { role: "user" as const, content: "PF" },
  { role: "assistant" as const, content: "Me informe seu CPF:" },
  { role: "user" as const, content: "123.456.789-00" },
  { role: "assistant" as const, content: "Qual linha de interesse?" },
  { role: "user" as const, content: "1 e 2" },
  { role: "assistant" as const, content: "Perfeito, confirmando..." },
  { role: "user" as const, content: "Sim" },
]

beforeEach(() => {
  chamarIA_mock.mockReset()
})

describe("extrairDadosLead", () => {
  it("extrai nome real, tipoPessoa, documento e linhas da conversa", async () => {
    chamarIA_mock.mockResolvedValue({
      conteudo: '{"nome":"Tiago","tipoPessoa":"PF","documento":"12345678900","email":null,"empresa":null,"telefone":null,"linhasInteresse":[1,2]}',
      provedor: "groq",
      modelo: "qwen/qwen3.8-27b",
      nomeChave: "DB key 1",
      tentativas: 1,
    })

    const res = await extrairDadosLead(historico, "Tiago Abreu")

    expect(res.nome).toBe("Tiago")
    expect(res.tipoPessoa).toBe("PF")
    expect(res.documento).toBe("12345678900")
    expect(res.linhasInteresse).toEqual([1, 2])
    expect(chamarIA_mock).toHaveBeenCalledTimes(1)
  })

  it("nunca devolve saudacao como nome (valida e rejeita)", async () => {
    chamarIA_mock.mockResolvedValue({
      conteudo: '{"nome":"Ola","tipoPessoa":null,"documento":null,"email":null,"empresa":null,"telefone":null,"linhasInteresse":null}',
      provedor: "groq",
      modelo: "qwen/qwen3.8-27b",
      nomeChave: "DB key 1",
      tentativas: 1,
    })

    const res = await extrairDadosLead(historico, "Tiago Abreu")

    expect(res.nome).toBeUndefined()
  })

  it("tolera JSON com bloco markdown", async () => {
    chamarIA_mock.mockResolvedValue({
      conteudo: '```json\n{"nome":"Maria","tipoPessoa":"PJ","documento":"12345678000199"}\n```',
      provedor: "groq",
      modelo: "qwen/qwen3.8-27b",
      nomeChave: "DB key 1",
      tentativas: 1,
    })

    const res = await extrairDadosLead(historico, "Maria")

    expect(res.nome).toBe("Maria")
    expect(res.tipoPessoa).toBe("PJ")
    expect(res.documento).toBe("12345678000199")
  })

  it("retorna objetos vazios quando a IA nao devolve JSON valido", async () => {
    chamarIA_mock.mockResolvedValue({
      conteudo: "desculpe nao entendi",
      provedor: "groq",
      modelo: "qwen/qwen3.8-27b",
      nomeChave: "DB key 1",
      tentativas: 1,
    })

    const res = await extrairDadosLead(historico, "Tiago")

    expect(res.nome).toBeUndefined()
    expect(res.documento).toBeUndefined()
  })

  it("valida nome numerico e tipoPessoa fora de PF/PJ", async () => {
    chamarIA_mock.mockResolvedValue({
      conteudo: '{"nome":"12345","tipoPessoa":"fisica","documento":"00000000000","linhasInteresse":null}',
      provedor: "groq",
      modelo: "qwen/qwen3.8-27b",
      nomeChave: "DB key 1",
      tentativas: 1,
    })

    const res = await extrairDadosLead(historico, "Tiago")

    expect(res.nome).toBeUndefined()
    expect(res.documento).toBeUndefined()
  })

  it("rejeita documento com tamanho invalido e normaliza linhas string", async () => {
    chamarIA_mock.mockResolvedValue({
      conteudo: '{"nome":"Joao","documento":"123","linhasInteresse":"1, 2"}',
      provedor: "groq",
      modelo: "qwen/qwen3.8-27b",
      nomeChave: "DB key 1",
      tentativas: 1,
    })

    const res = await extrairDadosLead(historico, "Joao")

    expect(res.documento).toBeUndefined()
    expect(res.linhasInteresse).toEqual([1, 2])
  })

  it("aceita documento de 14 digitos (CNPJ) e tipo juridica", async () => {
    chamarIA_mock.mockResolvedValue({
      conteudo: '{"nome":"Empresa X","tipoPessoa":"juridica","documento":"12.345.678/0001-99"}',
      provedor: "groq",
      modelo: "qwen/qwen3.8-27b",
      nomeChave: "DB key 1",
      tentativas: 1,
    })

    const res = await extrairDadosLead(historico, "Empresa X")

    expect(res.tipoPessoa).toBe("PJ")
    expect(res.documento).toBe("12345678000199")
  })
})
