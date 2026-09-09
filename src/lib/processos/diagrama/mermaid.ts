import type {
  AtividadeSemantica,
  DecisaoSemantica,
  FluxoSemantico,
  ModeloProcesso,
  ResultadoParseMermaid,
} from "./types"
import { FIM_ID, INICIO_ID } from "./types"
import { modeloVazio, novoIdFluxo } from "./modelo-semantico"
import { esc } from "./texto"

type TipoNo = "inicio" | "fim" | "atividade" | "decisao"

interface SpecNo {
  id: string
  tipo: TipoNo
  label: string
  declarado: boolean
}

const TAMANHO_INDENTE = 2

function parseNodeSpec(parte: string): SpecNo | null {
  const t = parte.trim()
  if (!t) return null
  const label = (s: string) => s.replace(/^"+|"+$/g, "").trim()
  let m = /^([A-Za-z0-9_]+)\(\[([^\]]*)\]\)$/.exec(t)
  if (m) return { id: m[1], tipo: "fim", label: label(m[2]), declarado: true }
  m = /^([A-Za-z0-9_]+)\(\(([^)]*)\)\)$/.exec(t)
  if (m) return { id: m[1], tipo: "inicio", label: label(m[2]), declarado: true }
  m = /^([A-Za-z0-9_]+)\{([^}]*)\}$/.exec(t)
  if (m) return { id: m[1], tipo: "decisao", label: label(m[2]), declarado: true }
  m = /^([A-Za-z0-9_]+)\[([^\]]*)\]$/.exec(t)
  if (m) return { id: m[1], tipo: "atividade", label: label(m[2]), declarado: true }
  m = /^([A-Za-z0-9_]+)$/.exec(t)
  if (m) return { id: m[1], tipo: "atividade", label: m[1], declarado: false }
  return null
}

function aplicarNo(modelo: ModeloProcesso, spec: SpecNo): void {
  if (spec.id === INICIO_ID || spec.id === FIM_ID) return
  if (spec.tipo === "decisao") {
    if (!modelo.decisoes.some((d) => d.id === spec.id)) {
      const dec: DecisaoSemantica = { id: spec.id, pergunta: spec.label || spec.id }
      modelo.decisoes.push(dec)
    }
    return
  }
  if (modelo.decisoes.some((d) => d.id === spec.id)) return
  if (!modelo.atividades.some((a) => a.id === spec.id)) {
    const ativ: AtividadeSemantica = { id: spec.id, nome: spec.label || spec.id }
    modelo.atividades.push(ativ)
  }
}

function criarFluxo(modelo: ModeloProcesso, de: string, para: string, rotulo: string): void {
  if (de === para) return
  const existente = modelo.fluxos.find((f) => f.de === de && f.para === para)
  if (existente) {
    if (rotulo && !existente.rotulo) existente.rotulo = rotulo
    return
  }
  const fluxo: FluxoSemantico = { id: novoIdFluxo(modelo), de, para }
  if (rotulo) fluxo.rotulo = rotulo
  modelo.fluxos.push(fluxo)
}

const LINHAS_MERMAID = /^(flowchart|graph|mindmap|%%|#|er$|classDef|click)/

function parseFlowchart(modelo: ModeloProcesso, linhas: string[]): string | null {
  const RE_ARROW = /-->[|]([^|]*)[|]|-->/g
  let achou = false
  for (const linhaBruta of linhas) {
    const linha = linhaBruta.trim()
    if (!linha || LINHAS_MERMAID.test(linha)) continue
    const itens: { texto: string; rotulo: string }[] = []
    let last = 0
    let m: RegExpExecArray | null
    RE_ARROW.lastIndex = 0
    while ((m = RE_ARROW.exec(linha)) !== null) {
      itens.push({ texto: linha.slice(last, m.index), rotulo: m[1] ? m[1].trim() : "" })
      last = m.index + m[0].length
    }
    itens.push({ texto: linha.slice(last), rotulo: "" })

    const specs = itens.map((i) => parseNodeSpec(i.texto))
    const temArrow = itens.length >= 2
    const temDecl = specs.some((s) => s !== null && s.declarado)
    if (!temArrow && !temDecl) continue
    achou = true
    for (const s of specs) {
      if (s && (s.declarado || temArrow)) aplicarNo(modelo, s)
    }
    for (let i = 0; i < specs.length - 1; i++) {
      const de = specs[i]
      const para = specs[i + 1]
      if (de && para) criarFluxo(modelo, de.id, para.id, itens[i].rotulo)
    }
  }
  return achou ? null : "Nenhuma conexão (-->) encontrada no texto Mermaid."
}

function parseMindmap(modelo: ModeloProcesso, linhas: string[]): string | null {
  let rootIndent: number | null = null
  for (const linhaBruta of linhas) {
    const linha = linhaBruta.replace(/\t/g, "  ").trimEnd()
    const conteudo = linha.trim()
    if (!conteudo || LINHAS_MERMAID.test(linha)) continue
    const indent = linha.length - linha.trimStart().length
    if (rootIndent === null || indent < rootIndent) rootIndent = indent
  }
  if (rootIndent === null) return "Nenhum elemento encontrado no mapa mental."

  let anteriorAtividade: AtividadeSemantica | null = null
  let achou = false
  for (const linhaBruta of linhas) {
    const linha = linhaBruta.replace(/\t/g, "  ").trimEnd()
    const conteudo = linha.trim()
    if (!conteudo || LINHAS_MERMAID.test(linha)) continue
    const indent = linha.length - linha.trimStart().length
    if (indent <= rootIndent) continue
    if (/^raiz\s*\(\(/.test(conteudo) || /^\(\(/.test(conteudo)) continue
    const nivel = Math.max(1, Math.round((indent - rootIndent) / TAMANHO_INDENTE))
    if (nivel === 1) {
      achou = true
      const ativ: AtividadeSemantica = {
        id: `A${modelo.atividades.length + 1}`,
        nome: conteudo,
      }
      modelo.atividades.push(ativ)
      anteriorAtividade = ativ
    } else if (anteriorAtividade) {
      const m = /^(Responsável|Sistema):\s*(.+)$/.exec(conteudo)
      if (m) {
        if (m[1] === "Responsável") anteriorAtividade.responsavel = m[2]
        else anteriorAtividade.sistema = m[2]
      } else if (!anteriorAtividade.descricao) {
        anteriorAtividade.descricao = conteudo
      }
    }
  }
  return achou ? null : "Nenhum elemento encontrado no mapa mental."
}

export function mermaidParaModelo(texto: string): ResultadoParseMermaid {
  const linhas = texto
    .split("\n")
    .map((l) => l.replace(/\t/g, "  "))
  const ehMindmap = linhas.some((l) => /^\s*mindmap/.test(l))
  const modelo = modeloVazio()
  const erro = ehMindmap ? parseMindmap(modelo, linhas) : parseFlowchart(modelo, linhas)
  if (erro) return { modelo: null, erro }
  return { modelo }
}

function modeloParaMindmap(modelo: ModeloProcesso): string {
  const linhas = ["mindmap"]
  const raiz = (modelo.nome && modelo.nome.trim()) || "Processo"
  linhas.push(`  raiz((${esc(raiz)}))`)
  for (const a of modelo.atividades) {
    const extras = [a.responsavel ? `Responsável: ${a.responsavel}` : "", a.sistema ? `Sistema: ${a.sistema}` : ""]
      .filter(Boolean)
      .join(" · ")
    linhas.push(`    ${esc(a.nome)}`)
    if (extras) linhas.push(`      ${esc(extras)}`)
  }
  for (const d of modelo.decisoes) {
    linhas.push(`    ${esc(d.pergunta)}`)
  }
  return linhas.join("\n")
}

export function modeloParaMermaid(modelo: ModeloProcesso, tipo?: string): string {
  if (tipo === "MAPAMENTAL") return modeloParaMindmap(modelo)

  const linhas: string[] = ["flowchart TD"]
  linhas.push(`    ${INICIO_ID}((${esc("Início")}))`)
  for (const a of modelo.atividades) {
    linhas.push(`    ${a.id}["${esc(a.nome)}"]`)
  }
  for (const d of modelo.decisoes) {
    linhas.push(`    ${d.id}{${esc(d.pergunta)}}`)
  }
  linhas.push(`    ${FIM_ID}([${esc("Fim")}])`)
  for (const f of modelo.fluxos) {
    if (f.rotulo) linhas.push(`    ${f.de} -->|${esc(f.rotulo)}| ${f.para}`)
    else linhas.push(`    ${f.de} --> ${f.para}`)
  }
  return linhas.join("\n")
}