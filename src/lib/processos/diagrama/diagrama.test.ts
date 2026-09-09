import { describe, expect, it } from "vitest"
import type { ModeloProcesso } from "./types"
import { FIM_ID, INICIO_ID } from "./types"
import { resumoModelo, novoIdAtividade, novoIdFluxo, novoIdDecisao } from "./modelo-semantico"
import { modeloParaMermaid, mermaidParaModelo } from "./mermaid"
import { modeloParaMarkdown } from "./markdown"
import { modeloParaBpmn } from "./bpmn"
import { modeloParaCanvasExcalidraw } from "./excalidraw"

const modeloExemplo = (): ModeloProcesso => ({
  schemaVersion: "1",
  nome: "Recebimento de matéria-prima",
  objetivo: "Receber e conferir a matéria-prima no estoque.",
  atividades: [
    { id: "A1", nome: "Receber matéria-prima", responsavel: "Almoxarife", sistema: "ERP" },
    { id: "A2", nome: "Armazenar no estoque", responsavel: "Almoxarife" },
  ],
  decisoes: [{ id: "D1", pergunta: "NF conferida?" }],
  fluxos: [
    { id: "F1", de: INICIO_ID, para: "A1" },
    { id: "F2", de: "A1", para: "D1" },
    { id: "F3", de: "D1", para: "A1", rotulo: "NÃO" },
    { id: "F4", de: "D1", para: "A2", rotulo: "SIM" },
    { id: "F5", de: "A2", para: FIM_ID },
  ],
})

describe("modelo-semantico", () => {
  it("gerencia ids incrementais por prefixo", () => {
    const m = modeloExemplo()
    expect(novoIdAtividade(m)).toBe("A3")
    expect(novoIdDecisao(m)).toBe("D2")
    expect(novoIdFluxo(m)).toBe("F6")
  })

  it("resume contagens do modelo", () => {
    const s = resumoModelo(modeloExemplo())
    expect(s).toEqual({ atividades: 2, decisoes: 1, fluxos: 5, nos: 3 })
  })
})

describe("mermaid", () => {
  it("gera flowchart com nós e fluxos a partir do modelo", () => {
    const texto = modeloParaMermaid(modeloExemplo(), "FLUXOGRAMA")
    expect(texto).toContain("flowchart TD")
    expect(texto).toContain(`${INICIO_ID}((`)
    expect(texto).toContain(`A1["Receber matéria-prima"]`)
    expect(texto).toContain(`D1{NF conferida?}`)
    expect(texto).toContain(`${FIM_ID}([`)
    expect(texto).toContain(`D1 -->|NÃO| A1`)
  })

  it("faz roundtrip modelo → mermaid → modelo preservando ids", () => {
    const original = modeloExemplo()
    const texto = modeloParaMermaid(original, "FLUXOGRAMA")
    const resultado = mermaidParaModelo(texto)
    expect(resultado.erro).toBeUndefined()
    const m = resultado.modelo!
    expect(m.atividades.map((a) => a.id)).toEqual(["A1", "A2"])
    expect(m.atividades.find((a) => a.id === "A1")?.nome).toBe("Receber matéria-prima")
    expect(m.decisoes).toEqual([{ id: "D1", pergunta: "NF conferida?" }])
    expect(m.fluxos.map((f) => `${f.de}->${f.para}`)).toEqual([
      "inicio->A1",
      "A1->D1",
      "D1->A1",
      "D1->A2",
      "A2->fim",
    ])
    const rotulo = m.fluxos.find((f) => f.de === "D1" && f.para === "A2")
    expect(rotulo?.rotulo).toBe("SIM")
  })

  it("interpreta mermaid em cadeia única", () => {
    const texto = "flowchart TD\n  X[Início do teste] --> Y[Processa]\n  Y --> Z{Confere?}"
    const r = mermaidParaModelo(texto)
    expect(r.erro).toBeUndefined()
    const m = r.modelo!
    expect(m.atividades.map((a) => a.nome)).toEqual(["Início do teste", "Processa"])
    expect(m.decisoes.map((d) => d.pergunta)).toEqual(["Confere?"])
    expect(m.fluxos).toHaveLength(2)
  })

  it("retorna erro quando não há conexões parseáveis", () => {
    const r = mermaidParaModelo("flowchart TD\n  something")
    expect(r.modelo).toBeNull()
    expect(r.erro).toBeDefined()
  })

  it("gera e interpreta mapa mental", () => {
    const m = modeloExemplo()
    const texto = modeloParaMermaid(m, "MAPAMENTAL")
    expect(texto).toContain("mindmap")
    expect(texto).toContain("Receber matéria-prima")
    const r = mermaidParaModelo(texto)
    expect(r.erro).toBeUndefined()
    expect(r.modelo!.atividades.some((a) => a.nome === "Receber matéria-prima")).toBe(true)
  })
})

describe("markdown", () => {
  it("gera resumo estruturado legível por IA", () => {
    const md = modeloParaMarkdown(modeloExemplo())
    expect(md).toContain("# Recebimento de matéria-prima")
    expect(md).toContain("**Objetivo:** Receber e conferir a matéria-prima no estoque.")
    expect(md).toContain("## Atividades")
    expect(md).toContain("Responsável:** Almoxarife")
    expect(md).toContain("## Decisões")
    expect(md).toContain("NF conferida?")
    expect(md).toContain("## Fluxos")
    expect(md).toContain("Início → Receber matéria-prima")
  })
})

describe("bpmn", () => {
  it("gera BPMN 2.0 válido com DI a partir do modelo", () => {
    const xml = modeloParaBpmn(modeloExemplo())
    expect(xml).toContain(`<?xml version="1.0"`)
    expect(xml).toContain(`<bpmn:process`)
    expect(xml).toContain(`<bpmn:startEvent id="${INICIO_ID}"`)
    expect(xml).toContain(`<bpmn:endEvent id="${FIM_ID}"`)
    expect(xml).toContain(`<bpmn:task id="A1"`)
    expect(xml).toContain(`<bpmn:exclusiveGateway id="D1"`)
    expect(xml).toContain(`<bpmn:sequenceFlow id="F5"`)
    expect(xml).toContain(`<bpmn:conditionExpression`)
    expect(xml).toContain(`<bpmndi:BPMNShape id="Shape_A1"`)
    expect(xml).toContain(`<bpmndi:BPMNEdge id="Edge_F4"`)
    expect(xml.trim().endsWith("</bpmn:definitions>")).toBe(true)
    const shapes = xml.match(/<bpmndi:BPMNShape/g)?.length ?? 0
    expect(shapes).toBe(5)
  })
})

describe("excalidraw", () => {
  it("gera elementos de canvas a partir do modelo", () => {
    const canvas = modeloParaCanvasExcalidraw(modeloExemplo())
    const rotulos = canvas.elements.filter(
      (el) => (el as { type?: string }).type === "text"
    )
    const flechas = canvas.elements.filter((el) => (el as { type?: string }).type === "arrow")
    expect(flechas.length).toBe(5)
    expect(rotulos.length).toBe(5 + 2)
    const textos = (rotulos as Array<{ text?: string }>).map((r) => r.text)
    expect(textos).toEqual(
      expect.arrayContaining(["Início", "Fim", "Receber matéria-prima", "NF conferida?", "SIM", "NÃO"])
    )
  })
})