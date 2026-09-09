import type { CanvasExcalidraw, ModeloProcesso } from "./types"
import { FIM_ID, INICIO_ID } from "./types"
import { nomeDoNo } from "./modelo-semantico"

interface NoCanvas {
  id: string
  nome: string
  x: number
  y: number
  w: number
  h: number
}

interface ItemCanvas {
  type: "text" | "arrow"
  id: string
  x: number
  y: number
  width: number
  height: number
  angle: number
  strokeColor: string
  backgroundColor: string
  fillStyle: string
  strokeWidth: number
  roughness: number
  opacity: number
  groupIds: unknown[]
  frameId: null
  seed: number
  version: number
  versionNonce: number
  isDeleted: boolean
  boundElements: null
  updated: number
  link: null
  locked: boolean
  text?: string
  fontSize?: number
  fontFamily?: number
  textAlign?: string
  verticalAlign?: string
  containerId?: null
  originalText?: string
  points?: number[][]
  startBinding?: null
  endBinding?: null
  startArrowhead?: string | null
  endArrowhead?: string | null
}

let incremento = 0

function seed(): number {
  incremento = (incremento + 1) % 2147483647
  return incremento
}

function posicaoNos(modelo: ModeloProcesso): NoCanvas[] {
  const nos: NoCanvas[] = []
  let i = 0
  const pos = () => {
    const col = i % 3
    const linha = Math.floor(i / 3)
    i++
    return { x: 40 + col * 260, y: 20 + linha * 140 }
  }

  const comInicio = modelo.fluxos.some((f) => f.de === INICIO_ID) || !modelo.fluxos.length
  const comFim = modelo.fluxos.some((f) => f.para === FIM_ID) || !modelo.fluxos.length

  if (comInicio) {
    const p = pos()
    nos.push({ id: INICIO_ID, nome: nomeDoNo(modelo, INICIO_ID), x: p.x, y: p.y, w: 120, h: 60 })
  }
  for (const a of modelo.atividades) {
    const p = pos()
    nos.push({ id: a.id, nome: a.nome, x: p.x, y: p.y, w: 200, h: 60 })
  }
  for (const d of modelo.decisoes) {
    const p = pos()
    nos.push({ id: d.id, nome: d.pergunta, x: p.x, y: p.y, w: 200, h: 60 })
  }
  if (comFim) {
    const p = pos()
    nos.push({ id: FIM_ID, nome: nomeDoNo(modelo, FIM_ID), x: p.x, y: p.y, w: 120, h: 60 })
  }
  return nos
}

function elementoTexto(id: string, texto: string, x: number, y: number, w: number): ItemCanvas {
  return {
    type: "text",
    id,
    x,
    y,
    width: w,
    height: 60,
    angle: 0,
    strokeColor: "#334155",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    seed: seed(),
    version: 1,
    versionNonce: seed(),
    isDeleted: false,
    boundElements: null,
    updated: seed(),
    link: null,
    locked: false,
    text: texto,
    fontSize: 20,
    fontFamily: 1,
    textAlign: "center",
    verticalAlign: "middle",
    containerId: null,
    originalText: texto,
  }
}

function elementoFlecha(id: string, x1: number, y1: number, x2: number, y2: number): ItemCanvas {
  return {
    type: "arrow",
    id,
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
    angle: 0,
    strokeColor: "#94a3b8",
    backgroundColor: "transparent",
    fillStyle: "solid",
    strokeWidth: 1,
    roughness: 1,
    opacity: 100,
    groupIds: [],
    frameId: null,
    seed: seed(),
    version: 1,
    versionNonce: seed(),
    isDeleted: false,
    boundElements: null,
    updated: seed(),
    link: null,
    locked: false,
    points: [
      [0, 0],
      [x2 - x1, y2 - y1],
    ],
    startBinding: null,
    endBinding: null,
    startArrowhead: null,
    endArrowhead: "arrow",
  }
}

export function modeloParaCanvasExcalidraw(modelo: ModeloProcesso): CanvasExcalidraw {
  const nos = posicaoNos(modelo)
  const elementos: unknown[] = []
  const centro = new Map<string, { x: number; y: number }>()

  for (const no of nos) {
    elementos.push(elementoTexto(`texto_${no.id}`, no.nome, no.x, no.y, no.w))
    centro.set(no.id, { x: no.x + no.w / 2, y: no.y + 30 })
  }

  const rotuloIds = new Set<string>()
  for (const f of modelo.fluxos) {
    const a = centro.get(f.de)
    const b = centro.get(f.para)
    if (!a || !b) continue
    elementos.push(elementoFlecha(`flecha_${f.id}`, a.x, a.y, b.x, b.y))
    if (f.rotulo) {
      const mx = (a.x + b.x) / 2
      const my = (a.y + b.y) / 2
      const rid = `rotulo_${f.id}`
      elementos.push(elementoTexto(rid, f.rotulo, mx - 40, my - 20, 80))
      rotuloIds.add(rid)
    }
  }

  void rotuloIds
  return { elements: elementos, files: {} }
}