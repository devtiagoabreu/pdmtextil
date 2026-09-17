import { describe, it, expect } from "vitest"
import {
  addWorkingHours,
  addCalendarHours,
  prazoPrimeiraResposta,
  prazoResolucao,
  prazoEstourado,
  calcularSLA,
  SLA_CONFIG,
} from "./sla"

describe("sla", () => {
  it("configura prazos por prioridade", () => {
    expect(SLA_CONFIG.URGENTE).toEqual({ primeiraRespostaHoras: 4, resolucaoHoras: 24 })
    expect(SLA_CONFIG.ALTA).toEqual({ primeiraRespostaHoras: 8, resolucaoHoras: 48 })
    expect(SLA_CONFIG.MEDIA).toEqual({ primeiraRespostaHoras: 24, resolucaoHoras: 96 })
    expect(SLA_CONFIG.BAIXA).toEqual({ primeiraRespostaHoras: 72, resolucaoHoras: 168 })
  })

  it("soma horas corridas em addCalendarHours", () => {
    const base = new Date("2026-09-17T10:00:00.000Z")
    expect(addCalendarHours(base, 24).toISOString()).toBe("2026-09-18T10:00:00.000Z")
  })

  it("addWorkingHours respeita a janela 08-18 no mesmo dia", () => {
    const base = new Date(2026, 8, 17, 9, 0) // quinta-feira, 09:00
    const resultado = addWorkingHours(base, 4)
    expect(resultado.getHours()).toBe(13)
  })

  it("addWorkingHours avança para o próximo dia útil quando estoura a janela", () => {
    const base = new Date(2026, 8, 17, 16, 0) // quinta-feira 16:00 (2h restantes)
    const resultado = addWorkingHours(base, 4)
    expect(resultado.getDate()).toBe(18) // sexta-feira
    expect(resultado.getHours()).toBe(10)
  })

  it("addWorkingHours pula o fim de semana", () => {
    const base = new Date(2026, 8, 18, 16, 0) // sexta-feira 16:00
    const resultado = addWorkingHours(base, 4)
    expect(resultado.getDate()).toBe(21) // segunda-feira
    expect(resultado.getHours()).toBe(10)
  })

  it("prazoPrimeiraResposta e prazoResolucao derivam da prioridade", () => {
    const base = new Date(2026, 8, 17, 9, 0)
    const resposta = prazoPrimeiraResposta("MEDIA", base)
    const resolucao = prazoResolucao("MEDIA", base)
    expect(resposta.getTime()).toBeGreaterThan(base.getTime())
    expect(resolucao.getTime()).toBeGreaterThan(base.getTime())
  })

  it("calcularSLA retorna os dois prazos", () => {
    const base = new Date(2026, 8, 17, 9, 0)
    const sla = calcularSLA("URGENTE", base)
    expect(sla.primeiraRespostaPrazo.getTime()).toBeGreaterThan(base.getTime())
    expect(sla.resolucaoPrazo.getTime()).toBeGreaterThan(base.getTime())
  })

  it("prazoEstourado detecta prazo vencido e ignora null", () => {
    const agora = new Date(2026, 8, 17, 12, 0)
    expect(prazoEstourado(new Date(2026, 8, 17, 10, 0), agora)).toBe(true)
    expect(prazoEstourado(new Date(2026, 8, 17, 14, 0), agora)).toBe(false)
    expect(prazoEstourado(null, agora)).toBe(false)
    expect(prazoEstourado(undefined, agora)).toBe(false)
  })
})