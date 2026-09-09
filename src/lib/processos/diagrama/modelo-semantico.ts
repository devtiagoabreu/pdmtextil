import type { ModeloProcesso } from "./types"
import { FIM_ID, INICIO_ID } from "./types"

export function modeloVazio(nome = ""): ModeloProcesso {
  return { schemaVersion: "1", nome, objetivo: "", atividades: [], decisoes: [], fluxos: [] }
}

function maxNumero(ids: string[], prefixo: string): number {
  let max = 0
  for (const id of ids) {
    const m = new RegExp(`^${prefixo}(\\d+)$`).exec(id)
    if (m) max = Math.max(max, Number(m[1]))
  }
  return max
}

export function novoIdAtividade(modelo: ModeloProcesso): string {
  return `A${maxNumero(modelo.atividades.map((a) => a.id), "A") + 1}`
}

export function novoIdDecisao(modelo: ModeloProcesso): string {
  return `D${maxNumero(modelo.decisoes.map((d) => d.id), "D") + 1}`
}

export function novoIdFluxo(modelo: ModeloProcesso): string {
  return `F${maxNumero(modelo.fluxos.map((f) => f.id), "F") + 1}`
}

export function nomeDoNo(modelo: ModeloProcesso, id: string): string {
  if (id === INICIO_ID) return "Início"
  if (id === FIM_ID) return "Fim"
  const ativ = modelo.atividades.find((a) => a.id === id)
  if (ativ) return ativ.nome
  const dec = modelo.decisoes.find((d) => d.id === id)
  if (dec) return dec.pergunta
  return id
}

export function resumoModelo(modelo: ModeloProcesso): {
  atividades: number
  decisoes: number
  fluxos: number
  nos: number
} {
  return {
    atividades: modelo.atividades.length,
    decisoes: modelo.decisoes.length,
    fluxos: modelo.fluxos.length,
    nos: modelo.atividades.length + modelo.decisoes.length,
  }
}

export function modeloValido(modelo: ModeloProcesso): boolean {
  return (
    modelo.atividades.every((a) => a.id && a.nome) &&
    modelo.decisoes.every((d) => d.id && d.pergunta) &&
    modelo.fluxos.every((f) => f.id && f.de && f.para)
  )
}