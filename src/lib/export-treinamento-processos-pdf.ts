"use client"

import { exportTreinamentoCompletoPdf as exportarCompleto, exportLicaoPdf as exportarLicao } from "./export-treinamento-pdf"
import type { TreinamentoContexto } from "./export-treinamento-pdf"

export const contextoProcessos: TreinamentoContexto = {
  titulo: "Engenharia de Processos",
  brand: "PDM Têxtil — Treinamento Engenharia de Processos",
  descricao: "Documento completo de treinamento do modulo de Engenharia de Processos.",
  citacao: "Processos bem documentados transformam conhecimento em resultado.",
  citacao2: "Cada atividade mapeada é um passo rumo à melhoria contínua.",
  areaTag: "Treinamento Engenharia de Processos",
  filenameBase: "Treinamento_Processos_Completo.pdf",
  moduloTituloHeader: "Treinamento Engenharia de Processos",
}

export async function exportTreinamentoCompletoPdf(modulos: Parameters<typeof exportarCompleto>[0]) {
  return exportarCompleto(modulos, contextoProcessos)
}

export async function exportLicaoPdf(
  licao: Parameters<typeof exportarLicao>[0],
  moduloTitulo: Parameters<typeof exportarLicao>[1],
  moduloIndex: Parameters<typeof exportarLicao>[2],
  licaoIndex: Parameters<typeof exportarLicao>[3]
) {
  return exportarLicao(licao, moduloTitulo, moduloIndex, licaoIndex, contextoProcessos)
}