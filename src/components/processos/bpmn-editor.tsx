"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import "bpmn-js/dist/assets/diagram-js.css"
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css"
import "bpmn-js/dist/assets/bpmn-js.css"
import { Loader2, Palette, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  FONT_FAMILIAS,
  FONT_TAMANHOS,
  estilosTextoParaCss,
  limparEstilosTexto,
  lerEstilosTexto,
  salvarEstilosTexto,
} from "@/lib/processos/diagrama/estilos-bpmn"
import type { EstilosTextoBpmn } from "@/lib/processos/diagrama/estilos-bpmn"

interface ServicoCanvas {
  getContainer(): HTMLElement
  zoom(acaoOuOpcoes: unknown): unknown
}

interface ServicoSelection {
  get(): BpmnElement[]
  on(event: string, cb: () => void): void
  off(event: string, cb: () => void): void
}

interface ServicoModeling {
  setColor(element: BpmnElement, opts: { fill?: string; stroke?: string }): void
}

interface ServicoElementRegistry {
  getAll(): BpmnElement[]
}

interface BpmnElement {
  id: string
  businessObject: { di?: { $attrs?: Record<string, unknown>; fill?: string; stroke?: string } }
  label?: { id: string; businessObject: { di?: unknown } } | null
}

interface ModelerCompleto {
  importXML(xml: string): Promise<unknown>
  saveXML(opts: { format: boolean }): Promise<{ xml?: string }>
  destroy(): void
  on(event: string, callback: () => void): void
  off(event: string, callback: () => void): void
  get(servico: "canvas"): ServicoCanvas
  get(servico: "selection"): ServicoSelection
  get(servico: "modeling"): ServicoModeling
  get(servico: "elementRegistry"): ServicoElementRegistry
  get(servico: string): unknown
}

interface BpmnEditorProps {
  xml: string
  readOnly?: boolean
  onChange: (xml: string) => void
  onWarning?: (mensagem: string) => void
}

function getLabelNode(container: HTMLElement, elementId: string): SVGTextElement | null {
  return container.querySelector(`[data-element-id="${elementId}"] .djs-label`)
}

function aplicarNoLabel(container: HTMLElement, elementId: string, estilos: EstilosTextoBpmn) {
  const node = getLabelNode(container, elementId)
  if (!node) return
  const css = estilosTextoParaCss(estilos)
  node.style.fill = css.fill || ""
  node.style.fontFamily = css.fontFamily || ""
  node.style.fontSize = css.fontSize || ""
  node.style.fontWeight = css.fontWeight || ""
  node.style.fontStyle = css.fontStyle || ""
}

function reaplicarTodosEstilos(container: HTMLElement, elementRegistry: ServicoElementRegistry) {
  for (const el of elementRegistry.getAll()) {
    const di = el.businessObject.di
    if (!di) continue
    const estilos = lerEstilosTexto(di)
    if (Object.keys(estilos).length > 0) aplicarNoLabel(container, el.id, estilos)
  }
}

const DEFAULT_COR = "#ffffff"

export default function BpmnEditor({ xml, readOnly = false, onChange, onWarning }: BpmnEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const modelerRef = useRef<ModelerCompleto | null>(null)
  const xmlAtualRef = useRef(xml)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const [elementoSel, setElementoSel] = useState<BpmnElement | null>(null)
  const [fill, setFill] = useState(DEFAULT_COR)
  const [stroke, setStroke] = useState("#333333")
  const [textFill, setTextFill] = useState("#000000")
  const [fontFamily, setFontFamily] = useState("Arial")
  const [fontSize, setFontSize] = useState(14)
  const [fontWeight, setFontWeight] = useState<string>("normal")
  const [fontStyle, setFontStyle] = useState<string>("normal")
  const [painelAberto, setPainelAberto] = useState(false)

  const atualizarPainel = useCallback(
    (el: BpmnElement | null) => {
      if (!el) {
        setElementoSel(null)
        return
      }
      setElementoSel(el)
      const di = el.businessObject.di
      setFill(di?.fill ?? DEFAULT_COR)
      setStroke(di?.stroke ?? "#333333")
      const txt = di ? lerEstilosTexto(di) : {}
      setTextFill(txt.textFill ?? "#000000")
      setFontFamily(txt.fontFamily ?? "Arial")
      setFontSize(txt.fontSize ?? 14)
      setFontWeight(txt.fontWeight ?? "normal")
      setFontStyle(txt.fontStyle ?? "normal")
    },
    []
  )

  const persistir = useCallback(async () => {
    const modeler = modelerRef.current
    if (!modeler || readOnly) return
    try {
      const { xml: novo } = await modeler.saveXML({ format: true })
      if (novo && novo !== xmlAtualRef.current) {
        xmlAtualRef.current = novo
        onChangeRef.current(novo)
      }
    } catch {
      // ignora erros temporários
    }
  }, [readOnly])

  const aplicarCorForma = useCallback(
    (el: BpmnElement, novaFill: string, novaStroke: string) => {
      const modeler = modelerRef.current
      if (!modeler) return
      modeler.get("modeling").setColor(el, {
        fill: novaFill === DEFAULT_COR ? undefined : novaFill,
        stroke: novaStroke === "#333333" ? undefined : novaStroke,
      })
    },
    []
  )

  const aplicarTexto = useCallback(
    (el: BpmnElement, estilos: EstilosTextoBpmn) => {
      const di = el.businessObject.di
      const container = containerRef.current
      if (!di || !container) return
      salvarEstilosTexto(di, estilos)
      aplicarNoLabel(container, el.id, estilos)
      persistir()
    },
    [persistir]
  )

  useEffect(() => {
    let ativo = true
    let modeler: ModelerCompleto | null = null

    async function montar() {
      if (!containerRef.current) return
      const mod = await import("bpmn-js/lib/Modeler")
      if (!ativo || !containerRef.current) return
      const BpmnModeler = (mod as { default?: new (opts: Record<string, unknown>) => unknown }).default
      if (!BpmnModeler) {
        onWarning?.("Não foi possível carregar o editor BPMN.")
        return
      }
      modeler = new BpmnModeler({
        container: containerRef.current,
        keyboard: { bindTo: document },
      }) as unknown as ModelerCompleto
      modelerRef.current = modeler

      modeler.on("commandStack.changed", async () => {
        if (!modeler || readOnly) return
        try {
          const { xml: novo } = await modeler.saveXML({ format: true })
          if (novo && novo !== xmlAtualRef.current) {
            xmlAtualRef.current = novo
            onChangeRef.current(novo)
          }
        } catch {
          // ignora alterações inválidas no meio do arraste
        }
      })

      try {
        await modeler.importXML(xml)
        modeler.get("canvas").zoom("fit-viewport")
      } catch (e) {
        onWarning?.(e instanceof Error ? e.message : "XML BPMN inválido.")
      }

      const selection = modeler.get("selection")
      const onSelectionChanged = () => {
        const sel = selection.get()
        if (sel.length === 1 && sel[0].id !== "canvas") {
          atualizarPainel(sel[0])
        } else {
          atualizarPainel(null)
        }
      }
      selection.on("selection.changed", onSelectionChanged)
    }

    montar()
    return () => {
      ativo = false
      modeler?.destroy()
      modelerRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (xml === xmlAtualRef.current) return
    xmlAtualRef.current = xml
    const modeler = modelerRef.current
    if (!modeler) return
    modeler
      .importXML(xml)
      .then(() => {
        modeler.get("canvas").zoom("fit-viewport")
        if (containerRef.current) {
          reaplicarTodosEstilos(containerRef.current, modeler.get("elementRegistry"))
        }
      })
      .catch(() => {
        onWarning?.("XML BPMN inválido ao atualizar o diagrama.")
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xml])

  function toggleBold() {
    const novo = fontWeight === "bold" ? "normal" : "bold"
    setFontWeight(novo)
    if (elementoSel) aplicarTexto(elementoSel, { textFill, fontFamily, fontSize, fontWeight: novo, fontStyle })
  }

  function toggleItalic() {
    const novo = fontStyle === "italic" ? "normal" : "italic"
    setFontStyle(novo)
    if (elementoSel) aplicarTexto(elementoSel, { textFill, fontFamily, fontSize, fontWeight, fontStyle: novo })
  }

  function limparEstilos() {
    if (!elementoSel) return
    const di = elementoSel.businessObject.di
    if (!di) return
    const modeler = modelerRef.current
    if (!modeler) return

    modeler.get("modeling").setColor(elementoSel, { fill: undefined, stroke: undefined })
    limparEstilosTexto(di)
    setFill(DEFAULT_COR)
    setStroke("#333333")
    setTextFill("#000000")
    setFontFamily("Arial")
    setFontSize(14)
    setFontWeight("normal")
    setFontStyle("normal")
    setElementoSel(null)
    persistir()
  }

  return (
    <div className="relative flex gap-3">
      <div className="relative flex-1">
        <div
          ref={containerRef}
          className="h-[560px] w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white"
        />
        <div className="pointer-events-none absolute left-3 top-3 text-xs text-slate-400">
          BPMN 2.0 (bpmn-js)
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Button
          type="button"
          variant={painelAberto ? "default" : "outline"}
          size="sm"
          className="gap-1 self-end"
          onClick={() => setPainelAberto(!painelAberto)}
          aria-label="Painel de estilos"
        >
          <Palette size={14} />
          {painelAberto ? "Fechar estilos" : "Estilos"}
        </Button>

        {painelAberto && (
          <div className="w-56 space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 text-sm shadow-lg">
            {!elementoSel ? (
              <p className="text-xs text-slate-400">Selecione uma forma ou conexão para editar seus estilos.</p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-slate-400">{elementoSel.id}</span>
                  <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={limparEstilos} aria-label="Limpar estilos">
                    <RotateCcw size={12} />
                  </Button>
                </div>

                <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <Label className="text-xs text-slate-500">Preenchimento</Label>
                  <input
                    type="color"
                    value={fill}
                    onChange={(e) => {
                      setFill(e.target.value)
                      if (elementoSel) aplicarCorForma(elementoSel, e.target.value, stroke)
                    }}
                    className="h-8 w-full cursor-pointer rounded border-0 p-0"
                  />
                </div>

                <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <Label className="text-xs text-slate-500">Borda</Label>
                  <input
                    type="color"
                    value={stroke}
                    onChange={(e) => {
                      setStroke(e.target.value)
                      if (elementoSel) aplicarCorForma(elementoSel, fill, e.target.value)
                    }}
                    className="h-8 w-full cursor-pointer rounded border-0 p-0"
                  />
                </div>

                <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <Label className="text-xs text-slate-500">Cor do texto</Label>
                  <input
                    type="color"
                    value={textFill}
                    onChange={(e) => {
                      setTextFill(e.target.value)
                      if (elementoSel)
                        aplicarTexto(elementoSel, { textFill: e.target.value, fontFamily, fontSize, fontWeight, fontStyle })
                    }}
                    className="h-8 w-full cursor-pointer rounded border-0 p-0"
                  />
                </div>

                <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <Label className="text-xs text-slate-500">Família</Label>
                  <select
                    value={fontFamily}
                    onChange={(e) => {
                      setFontFamily(e.target.value)
                      if (elementoSel)
                        aplicarTexto(elementoSel, { textFill, fontFamily: e.target.value, fontSize, fontWeight, fontStyle })
                    }}
                    className="w-full rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 p-1.5 text-xs"
                  >
                    {FONT_FAMILIAS.map((f) => (
                      <option key={f} value={f}>
                        {f}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <Label className="text-xs text-slate-500">Tamanho</Label>
                  <select
                    value={fontSize}
                    onChange={(e) => {
                      const val = Number(e.target.value)
                      setFontSize(val)
                      if (elementoSel)
                        aplicarTexto(elementoSel, { textFill, fontFamily, fontSize: val, fontWeight, fontStyle })
                    }}
                    className="w-full rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 p-1.5 text-xs"
                  >
                    {FONT_TAMANHOS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={toggleBold}
                    className={`flex-1 rounded border p-1.5 text-xs font-bold transition-colors ${
                      fontWeight === "bold"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    N
                  </button>
                  <button
                    type="button"
                    onClick={toggleItalic}
                    className={`flex-1 rounded border p-1.5 text-xs italic transition-colors ${
                      fontStyle === "italic"
                        ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                    }`}
                  >
                    I
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function Placeholder() {
  return (
    <div className="flex h-56 items-center justify-center text-slate-400">
      <Loader2 className="mr-2 animate-spin" size={20} />
      Carregando editor...
    </div>
  )
}

export { Placeholder }