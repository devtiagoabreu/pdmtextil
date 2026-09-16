// @vitest-environment node
import { describe, expect, it } from "vitest"
import { BpmnModdle } from "bpmn-moddle"
import { PDM_MODDLE_EXTENSION, salvarEstilosTexto, lerEstilosTexto } from "./estilos-bpmn"

const XML = `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:task id="Task_1" name="Conferir NF" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="100" y="100" width="100" height="80" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`

async function importarXml(moddle: BpmnModdle, xml: string) {
  const resultado = await moddle.fromXML(xml, "bpmn:Definitions")
  return { rootElement: resultado.rootElement as unknown as Record<string, unknown> }
}

async function exportarXml(moddle: BpmnModdle, root: Record<string, unknown>) {
  const resultado = await moddle.toXML(root, { format: true })
  return resultado.xml
}

function acharShape(root: Record<string, unknown>): Record<string, unknown> {
  const diagrams = (root.diagrams ?? []) as Array<Record<string, unknown>>
  const diagram = diagrams[0]
  if (!diagram) throw new Error("BPMNDiagram não encontrado")
  const plane = diagram.plane as Record<string, unknown> | undefined
  const shapes = ((plane?.planeElement ?? []) as Array<Record<string, unknown>>) ?? []
  const bpmnShape = shapes.find((l) => l.$type === "bpmndi:BPMNShape")
  if (!bpmnShape) throw new Error("BPMNShape não encontrado")
  return bpmnShape
}

describe("estilos BPMN round-trip (bpmn-moddle)", () => {
  it("$attrs pdm: NÃO sobrevivem sem o namespace registrado", async () => {
    const moddle: BpmnModdle = new BpmnModdle()
    const { rootElement } = await importarXml(moddle, XML)
    const shape = acharShape(rootElement)
    salvarEstilosTexto(shape, { textFill: "#ff0000", fontSize: 16 })

    const saida = await exportarXml(moddle, rootElement)
    expect(saida.includes("pdm:textFill")).toBe(false)
  })

  it("$attrs pdm: sobrevivem com extensão de moddle registrada", async () => {
    const moddle: BpmnModdle = new BpmnModdle({ pdm: PDM_MODDLE_EXTENSION })
    const { rootElement } = await importarXml(moddle, XML)
    const shape = acharShape(rootElement)
    salvarEstilosTexto(shape, { textFill: "#ff0000", fontSize: 16, fontWeight: "bold" })

    const saida = await exportarXml(moddle, rootElement)
    expect(saida).toContain('pdm:textFill="#ff0000"')
    expect(saida).toContain('pdm:fontSize="16"')
    expect(saida).toContain("xmlns:pdm=")

    const { rootElement: lido } = await importarXml(moddle, saida)
    expect(lerEstilosTexto(acharShape(lido))).toEqual({
      textFill: "#ff0000",
      fontSize: 16,
      fontWeight: "bold",
    })
  })
})
