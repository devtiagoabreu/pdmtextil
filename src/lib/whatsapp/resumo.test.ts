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
import {
  prepararHistoricoIA,
  precisaGerarResumo,
  promptResumo,
  extrairResumoDoConteudo,
  gerarResumoIA,
  linhasAForaDaJanela,
} from "./resumo"

const chamarIA_mock = chamarIA as unknown as ReturnType<typeof vi.fn>

function historico(n: number): Array<{ role: "user" | "assistant"; content: string }> {
  const msgs: Array<{ role: "user" | "assistant"; content: string }> = []
  for (let i = 0; i < n; i++) {
    msgs.push({ role: i % 2 === 0 ? "user" : "assistant", content: `msg ${i}` })
  }
  return msgs
}

beforeEach(() => {
  chamarIA_mock.mockReset()
})

describe("prepararHistoricoIA", () => {
  it("conversa curta não gera resumo e envia histórico integral", () => {
    const res = prepararHistoricoIA(historico(10), {})
    expect(res.gerarResumo).toBe(false)
    expect(res.mensagens.length).toBe(10)
    expect(res.segmentoParaResumo).toEqual([])
  })

  it("conversa longa mantém janela e marca segmento para resumo", () => {
    const res = prepararHistoricoIA(historico(30), {})
    expect(res.gerarResumo).toBe(true)
    expect(res.mensagens.length).toBe(15)
    expect(res.segmentoParaResumo.length).toBe(15)
    expect(res.resumoAnterior).toBeUndefined()
  })

  it("com resumo anterior injeta prefácio e não re-resume antes do intervalo", () => {
    const dados = { _resumo: { resumo: "lead PJ, cnpj ok", turnos: 24, em: new Date().toISOString() } }
    const res = prepararHistoricoIA(historico(26), dados)
    expect(res.gerarResumo).toBe(false)
    expect(res.mensagens[0].content).toContain("[Resumo anterior]")
    expect(res.mensagens.length).toBe(16)
  })

  it("re-resume após novo intervalo de mensagens", () => {
    const dados = { _resumo: { resumo: "lead PJ", turnos: 24, em: new Date().toISOString() } }
    const res = prepararHistoricoIA(historico(34), dados)
    expect(res.gerarResumo).toBe(true)
    expect(res.resumoAnterior).toBe("lead PJ")
  })
})

describe("precisaGerarResumo", () => {
  it("não resume conversa pequena", () => {
    expect(precisaGerarResumo(historico(10), null)).toBe(false)
  })

  it("resume primeira vez ao passar do limiar", () => {
    expect(precisaGerarResumo(historico(24), null)).toBe(true)
  })

  it("resume quando ultrapassa o intervalo desde o último", () => {
    const resumo = { resumo: "x", turnos: 24 }
    expect(precisaGerarResumo(historico(32), resumo)).toBe(true)
    expect(precisaGerarResumo(historico(31), resumo)).toBe(false)
  })
})

describe("gerarResumoIA", () => {
  it("chama a IA e extrai o texto do resumo", async () => {
    chamarIA_mock.mockResolvedValue({
      conteudo: "Cliente PJ, nome 'Empresa X', CNPJ informado, interesse nas linhas 1 e 2.",
      provedor: "groq",
      modelo: "qwen/qwen3.8-27b",
      nomeChave: "DB key 1",
      tentativas: 1,
    })
    const res = await gerarResumoIA(historico(15), undefined)
    expect(res).toContain("Empresa X")
    expect(chamarIA_mock).toHaveBeenCalledTimes(1)
  })

  it("retorna undefined quando a IA falha", async () => {
    chamarIA_mock.mockRejectedValue(new Error("boom"))
    const res = await gerarResumoIA(historico(15), undefined)
    expect(res).toBeUndefined()
  })

  it("segmento vazio não chama a IA", async () => {
    const res = await gerarResumoIA([], undefined)
    expect(res).toBeUndefined()
    expect(chamarIA_mock).not.toHaveBeenCalled()
  })
})

describe("helpers", () => {
  it("linhasAForaDaJanela corta apenas o que sobra", () => {
    expect(linhasAForaDaJanela(historico(20)).length).toBe(5)
    expect(linhasAForaDaJanela(historico(10)).length).toBe(0)
  })

  it("extrairResumoDoConteudo remove markdown e limita", () => {
    expect(extrairResumoDoConteudo("```\nresumo\n```")).toBe("resumo")
    expect(extrairResumoDoConteudo("   ")).toBeUndefined()
  })

  it("promptResumo inclui resumo anterior quando houver", () => {
    const p = promptResumo(historico(3), "antigo")
    expect(p).toContain("Resumo anterior:\nantigo")
    expect(p).toContain("CONVERSA:")
  })
})