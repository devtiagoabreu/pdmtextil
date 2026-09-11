export interface EstilosTextoBpmn {
  textFill?: string
  fontFamily?: string
  fontSize?: number
  fontWeight?: string
  fontStyle?: string
}

export interface EstilosBpmnElemento {
  fill?: string
  stroke?: string
  texto?: EstilosTextoBpmn
}

export const FONT_FAMILIAS = [
  "Arial",
  "Helvetica",
  "Verdana",
  "Tahoma",
  "Times New Roman",
  "Georgia",
  "Courier New",
  "Trebuchet MS",
] as const

export const FONT_TAMANHOS = [10, 11, 12, 13, 14, 15, 16, 18, 20] as const

export const FONT_WEIGHTS = ["normal", "bold"] as const

export const FONT_STYLES = ["normal", "italic"] as const

const PREFIXO = "pdm:"

const CHAVES: Record<keyof EstilosTextoBpmn, string> = {
  textFill: `${PREFIXO}textFill`,
  fontFamily: `${PREFIXO}fontFamily`,
  fontSize: `${PREFIXO}fontSize`,
  fontWeight: `${PREFIXO}fontWeight`,
  fontStyle: `${PREFIXO}fontStyle`,
}

export interface DiComAttrs {
  $attrs?: Record<string, unknown>
}

export function lerEstilosTexto(di: unknown): EstilosTextoBpmn {
  if (!di || typeof di !== "object") return {}
  const attrs = (di as DiComAttrs).$attrs ?? {}
  const out: EstilosTextoBpmn = {}
  const textFill = attrs[CHAVES.textFill]
  if (typeof textFill === "string") out.textFill = textFill
  const fontFamily = attrs[CHAVES.fontFamily]
  if (typeof fontFamily === "string") out.fontFamily = fontFamily
  const fontSize = attrs[CHAVES.fontSize]
  if (typeof fontSize === "number") out.fontSize = fontSize
  const fontWeight = attrs[CHAVES.fontWeight]
  if (typeof fontWeight === "string") out.fontWeight = fontWeight
  const fontStyle = attrs[CHAVES.fontStyle]
  if (typeof fontStyle === "string") out.fontStyle = fontStyle
  return out
}

export function salvarEstilosTexto(di: unknown, estilos: EstilosTextoBpmn): boolean {
  if (!di || typeof di !== "object") return false
  const alvo = di as DiComAttrs
  alvo.$attrs = alvo.$attrs ?? {}
  let mudou = false
  alvo.$attrs[CHAVES.textFill] = estilos.textFill
  alvo.$attrs[CHAVES.fontFamily] = estilos.fontFamily
  alvo.$attrs[CHAVES.fontSize] = estilos.fontSize
  alvo.$attrs[CHAVES.fontWeight] = estilos.fontWeight
  alvo.$attrs[CHAVES.fontStyle] = estilos.fontStyle
  mudou = Object.keys(estilos).length > 0
  return mudou
}

export function limparEstilosTexto(di: unknown) {
  if (!di || typeof di !== "object") return
  const alvo = di as DiComAttrs
  if (!alvo.$attrs) return
  for (const chave of Object.keys(alvo.$attrs)) {
    if (chave.startsWith(PREFIXO)) delete alvo.$attrs[chave]
  }
}

export function estilosTextoParaCss(estilos: EstilosTextoBpmn): Record<string, string> {
  const css: Record<string, string> = {}
  if (estilos.textFill) css.fill = estilos.textFill
  if (estilos.fontFamily) css.fontFamily = estilos.fontFamily
  if (estilos.fontSize) css.fontSize = `${estilos.fontSize}px`
  if (estilos.fontWeight) css.fontWeight = estilos.fontWeight
  if (estilos.fontStyle) css.fontStyle = estilos.fontStyle
  return css
}