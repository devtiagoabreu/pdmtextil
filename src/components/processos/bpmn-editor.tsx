"use client"

import { useEffect, useRef } from "react"
import "bpmn-js/dist/assets/diagram-js.css"
import "bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css"
import "bpmn-js/dist/assets/bpmn-js.css"
import { Loader2 } from "lucide-react"

interface ModelerMinimo {
  importXML(xml: string): Promise<unknown>
  saveXML(opts: { format: boolean }): Promise<{ xml?: string }>
  destroy(): void
  on(event: string, callback: () => void): void
  get(servico: string): {
    zoom(acaoOuOpcoes: unknown): unknown
  }
}

interface BpmnEditorProps {
  xml: string
  readOnly?: boolean
  onChange: (xml: string) => void
  onWarning?: (mensagem: string) => void
}

export default function BpmnEditor({ xml, readOnly = false, onChange, onWarning }: BpmnEditorProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const modelerRef = useRef<ModelerMinimo | null>(null)
  const xmlAtualRef = useRef(xml)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  useEffect(() => {
    let ativo = true
    let modeler: ModelerMinimo | null = null

    async function montar() {
      if (!containerRef.current) return
      const mod = await import("bpmn-js/lib/Modeler")
      if (!ativo || !containerRef.current) return
      const BpmnModeler = (mod as { default?: new (opts: Record<string, unknown>) => unknown }).default
      if (!BpmnModeler) {
        onWarning?.("Não foi possível carregar o editor BPMN.")
        return
      }
      modeler = new BpmnModeler({ container: containerRef.current, keyboard: { bindTo: document } }) as ModelerMinimo
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
      })
      .catch(() => {
        onWarning?.("XML BPMN inválido ao atualizar o diagrama.")
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xml])

  return (
    <div className="relative">
      <div ref={containerRef} className="h-[560px] w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white" />
      <div className="pointer-events-none absolute left-3 top-3 text-xs text-slate-400">
        BPMN 2.0 (bpmn-js)
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