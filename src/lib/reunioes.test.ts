// @vitest-environment node
import { describe, expect, it } from "vitest"
import {
  validarReuniao,
  labelProjeto,
  labelStatusReuniao,
  labelStatusEncaminhamento,
  podeEscreverReuniao,
  podeExcluirReuniao,
} from "./reunioes"

describe("validarReuniao", () => {
  it("normaliza payload completo válido", () => {
    const resultado = validarReuniao({
      titulo: "  Rodada 15 — release notes 2026  ",
      projeto: "SYSTEXTIL",
      data: "2026-09-11T15:00:00.000Z",
      local: "Meet",
      status: "REALIZADA",
      resumoCurto: "  ",
      videoUrl: "https://meet.google.com/abc",
      pautas: [{ descricao: "Item 1" }],
      participantes: [{ nome: "Fulano", empresa: "X", papel: "Dev" }],
      encaminhamentos: [{ descricao: "Tarefa", responsavel: "Jean", prazo: "2026-10-01T12:00:00.000Z" }],
      links: [{ url: "https://x.com" }],
    })

    expect("error" in resultado).toBe(false)
    if ("error" in resultado) return
    expect(resultado.data.titulo).toBe("Rodada 15 — release notes 2026")
    expect(resultado.data.projeto).toBe("SYSTEXTIL")
    expect(resultado.data.local).toBe("Meet")
    expect(resultado.data.status).toBe("REALIZADA")
    expect(resultado.data.resumoCurto).toBeNull()
    expect(resultado.data.videoUrl).toBe("https://meet.google.com/abc")
    expect(resultado.data.pautas).toEqual([{ descricao: "Item 1" }])
    expect(resultado.data.links).toEqual([{ rotulo: "Link", url: "https://x.com", descricao: null }])
    expect(resultado.data.encaminhamentos[0].responsavel).toBe("Jean")
    expect(resultado.data.encaminhamentos[0].status).toBe("PENDENTE")
    expect(resultado.data.encaminhamentos[0].prazo).toBeInstanceOf(Date)
  })

  it("aplica defaults projeto INTERNA e status AGENDADA", () => {
    const resultado = validarReuniao({ titulo: "Reunião", data: "2026-09-11T15:00:00.000Z" })
    expect("error" in resultado).toBe(false)
    if ("error" in resultado) return
    expect(resultado.data.projeto).toBe("INTERNA")
    expect(resultado.data.status).toBe("AGENDADA")
  })

  it("rejeita sem título", () => {
    const resultado = validarReuniao({ data: "2026-09-11T15:00:00.000Z" })
    expect(resultado).toEqual({ error: "O título da reunião é obrigatório." })
  })

  it("rejeita projeto inválido", () => {
    const resultado = validarReuniao({ titulo: "R", data: "2026-09-11T15:00:00.000Z", projeto: "FOO" })
    expect(resultado).toEqual({ error: "Projeto inválido." })
  })

  it("rejeita data inválida", () => {
    const resultado = validarReuniao({ titulo: "R", data: "não é data" })
    expect(resultado).toEqual({ error: "Data da reunião inválida." })
  })

  it("rejeita status de reunião inválido", () => {
    const resultado = validarReuniao({ titulo: "R", data: "2026-09-11T15:00:00.000Z", status: "FEITA" })
    expect(resultado).toEqual({ error: "Status de reunião inválido." })
  })

  it("rejeita vídeo sem protocolo https", () => {
    const resultado = validarReuniao({
      titulo: "R",
      data: "2026-09-11T15:00:00.000Z",
      videoUrl: "meet.google.com/abc",
    })
    expect(resultado).toEqual({ error: "Link inválido." })
  })

  it("descarta pautas e participantes vazios e arrays nulos", () => {
    const resultado = validarReuniao({
      titulo: "R",
      data: "2026-09-11T15:00:00.000Z",
      pautas: null,
      participantes: [{ nome: "  " }, { nome: "Fulano" }],
      encaminhamentos: undefined,
      links: [],
    })
    expect("error" in resultado).toBe(false)
    if ("error" in resultado) return
    expect(resultado.data.pautas).toEqual([])
    expect(resultado.data.participantes).toEqual([{ nome: "Fulano", empresa: null, papel: null }])
    expect(resultado.data.encaminhamentos).toEqual([])
    expect(resultado.data.links).toEqual([])
  })

  it("rejeita status de encaminhamento inválido", () => {
    const resultado = validarReuniao({
      titulo: "R",
      data: "2026-09-11T15:00:00.000Z",
      encaminhamentos: [{ descricao: "Tarefa", status: "FEITA" }],
    })
    expect(resultado).toEqual({ error: "Status de encaminhamento inválido." })
  })

  it("rejeita link útil com URL inválida", () => {
    const resultado = validarReuniao({
      titulo: "R",
      data: "2026-09-11T15:00:00.000Z",
      links: [{ rotulo: "Docs", url: "www.exemplo.com" }],
    })
    expect(resultado).toEqual({ error: "Link inválido." })
  })

  it("descarta encaminhamento sem descrição", () => {
    const resultado = validarReuniao({
      titulo: "R",
      data: "2026-09-11T15:00:00.000Z",
      encaminhamentos: [{ descricao: "  " }, { descricao: "Tarefa válida", prazo: "2026-10-01T12:00:00.000Z" }],
    })
    expect("error" in resultado).toBe(false)
    if ("error" in resultado) return
    expect(resultado.data.encaminhamentos).toHaveLength(1)
    expect(resultado.data.encaminhamentos[0].descricao).toBe("Tarefa válida")
  })
})

describe("labels", () => {
  it("formata labels com fallback para a chave", () => {
    expect(labelProjeto("SYSTEXTIL")).toBe("Systêxtil")
    expect(labelProjeto("DESCONHECIDO")).toBe("DESCONHECIDO")
    expect(labelStatusReuniao("REALIZADA")).toBe("Realizada")
    expect(labelStatusReuniao("X")).toBe("X")
    expect(labelStatusEncaminhamento("EM_ANDAMENTO")).toBe("Em andamento")
    expect(labelStatusEncaminhamento("X")).toBe("X")
  })
})

describe("permissões", () => {
  it("permite escrita para ADMIN, SUDO, DESENVOLVIMENTO, COMERCIAL e CRM", () => {
    expect(podeEscreverReuniao("ADMIN")).toBe(true)
    expect(podeEscreverReuniao("SUDO")).toBe(true)
    expect(podeEscreverReuniao("DESENVOLVIMENTO")).toBe(true)
    expect(podeEscreverReuniao("COMERCIAL")).toBe(true)
    expect(podeEscreverReuniao("CRM")).toBe(true)
    expect(podeEscreverReuniao("QUALIDADE")).toBe(false)
    expect(podeEscreverReuniao(null)).toBe(false)
  })

  it("restringe exclusão a ADMIN e SUDO", () => {
    expect(podeExcluirReuniao("ADMIN")).toBe(true)
    expect(podeExcluirReuniao("SUDO")).toBe(true)
    expect(podeExcluirReuniao("COMERCIAL")).toBe(false)
  })
})