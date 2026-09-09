import type { ModeloProcesso } from "./types"
import { FIM_ID, INICIO_ID } from "./types"
import { resumoModelo } from "./modelo-semantico"
import { esc, xmlEscape } from "./texto"

interface NoCredencial {
  id: string
  tipo: "inicio" | "fim" | "atividade" | "decisao"
  x: number
  y: number
  w: number
  h: number
}

const LARGURA_TAREFA = 150
const ALTURA_TAREFA = 80
const LADO_EVENTO = 40
const LADO_GATEWAY = 50

function centro(n: { x: number; y: number; w: number; h: number }): { x: number; y: number } {
  return { x: n.x + n.w / 2, y: n.y + n.h / 2 }
}

function nosParaBpmn(modelo: ModeloProcesso): NoCredencial[] {
  const nos: NoCredencial[] = []
  let i = 0
  const posicao = () => {
    const col = i % 3
    const linha = Math.floor(i / 3)
    const x = 80 + col * 240
    const y = 80 + linha * 160
    i++
    return { x, y }
  }

  if (modelo.atividades.some((a) => a.id === INICIO_ID) || !modelo.fluxos.length || modelo.fluxos.some((f) => f.de === INICIO_ID)) {
    const p = posicao()
    nos.push({ id: INICIO_ID, tipo: "inicio", x: p.x, y: p.y, w: LADO_EVENTO, h: LADO_EVENTO })
  }

  for (const a of modelo.atividades) {
    const p = posicao()
    nos.push({ id: a.id, tipo: "atividade", x: p.x, y: p.y, w: LARGURA_TAREFA, h: ALTURA_TAREFA })
  }

  for (const d of modelo.decisoes) {
    const p = posicao()
    nos.push({ id: d.id, tipo: "decisao", x: p.x, y: p.y, w: LADO_GATEWAY, h: LADO_GATEWAY })
  }

  const temFim =
    modelo.atividades.some((a) => a.id === FIM_ID) ||
    !modelo.fluxos.length ||
    modelo.fluxos.some((f) => f.para === FIM_ID)
  if (temFim) {
    const p = posicao()
    nos.push({ id: FIM_ID, tipo: "fim", x: p.x, y: p.y, w: LADO_EVENTO, h: LADO_EVENTO })
  }

  return nos
}

function nomeDoNoBpmn(modelo: ModeloProcesso, id: string): string {
  if (id === INICIO_ID) return "Início"
  if (id === FIM_ID) return "Fim"
  const ativ = modelo.atividades.find((a) => a.id === id)
  if (ativ) return ativ.nome
  const dec = modelo.decisoes.find((d) => d.id === id)
  if (dec) return dec.pergunta
  return id
}

function elementoXml(modelo: ModeloProcesso, no: NoCredencial): string {
  const nome = esc(nomeDoNoBpmn(modelo, no.id))
  const nomeAttr = nome ? ` name="${xmlEscape(nome)}"` : ""
  switch (no.tipo) {
    case "inicio":
      return `      <bpmn:startEvent id="${no.id}"${nomeAttr} />`
    case "fim":
      return `      <bpmn:endEvent id="${no.id}"${nomeAttr} />`
    case "atividade":
      return `      <bpmn:task id="${no.id}"${nomeAttr} />`
    case "decisao":
      return `      <bpmn:exclusiveGateway id="${no.id}"${nomeAttr} />`
  }
}

export function modeloParaBpmn(modelo: ModeloProcesso): string {
  const nos = nosParaBpmn(modelo)
  const linhas: string[] = []

  linhas.push(`<?xml version="1.0" encoding="UTF-8"?>`)
  linhas.push(
    `<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:di="http://www.omg.org/spec/DD/20100524/DI" id="Definitions_${esc(
      resumoModelo(modelo).nos.toString()
    )}" targetNamespace="http://pdmtextil.com.br/processos">`
  )
  linhas.push(`  <bpmn:process id="Processo_1" name="${xmlEscape(esc(modelo.nome || "Processo"))}" isExecutable="false">`)
  for (const no of nos) {
    linhas.push(elementoXml(modelo, no))
  }
  for (const f of modelo.fluxos) {
    const nome = f.rotulo ? ` name="${xmlEscape(esc(f.rotulo))}"` : ""
    const condicao = f.rotulo
      ? `\n        <bpmn:conditionExpression xsi:type="bpmn:tFormalExpression">${xmlEscape(f.rotulo)}</bpmn:conditionExpression>`
      : ""
    linhas.push(
      `      <bpmn:sequenceFlow id="${f.id}"${nome} sourceRef="${f.de}" targetRef="${f.para}">${condicao}\n      </bpmn:sequenceFlow>`
    )
  }
  linhas.push(`  </bpmn:process>`)

  linhas.push(`  <bpmndi:BPMNDiagram id="BPMNDiagram_1">`)
  linhas.push(`    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Processo_1">`)
  for (const no of nos) {
    linhas.push(
      `      <bpmndi:BPMNShape id="Shape_${no.id}" bpmnElement="${no.id}"><dc:Bounds x="${no.x}" y="${no.y}" width="${no.w}" height="${no.h}" /></bpmndi:BPMNShape>`
    )
  }
  const porId = new Map(nos.map((n) => [n.id, n]))
  for (const f of modelo.fluxos) {
    const a = porId.get(f.de)
    const b = porId.get(f.para)
    if (!a || !b) continue
    const c1 = centro(a)
    const c2 = centro(b)
    linhas.push(
      `      <bpmndi:BPMNEdge id="Edge_${f.id}" bpmnElement="${f.id}"><di:waypoint x="${c1.x}" y="${c1.y}" /><di:waypoint x="${c2.x}" y="${c2.y}" /></bpmndi:BPMNEdge>`
    )
  }
  linhas.push(`    </bpmndi:BPMNPlane>`)
  linhas.push(`  </bpmndi:BPMNDiagram>`)
  linhas.push(`</bpmn:definitions>`)

  return linhas.join("\n")
}