"use client"

import { useMemo } from "react"
import dynamic from "next/dynamic"
import type { ComponentProps } from "react"
import type { CanvasExcalidraw } from "@/lib/processos/diagrama/types"
import { Loader2 } from "lucide-react"

type ExcalidrawModule = typeof import("@excalidraw/excalidraw")
type ExcalidrawProps = ComponentProps<ExcalidrawModule["Excalidraw"]>
type OnChangeParams = Parameters<NonNullable<ExcalidrawProps["onChange"]>>

interface DadosIniciaisCanvas {
  elements: unknown[]
  files: Record<string, unknown>
}

const ExcalidrawLazy = dynamic(
  () => import("@excalidraw/excalidraw").then((mod) => mod.Excalidraw),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-56 items-center justify-center text-slate-400">
        <Loader2 className="mr-2 animate-spin" size={20} />
        Carregando canvas...
      </div>
    ),
  }
)

interface CanvasExcalidrawEditorProps {
  canvas: CanvasExcalidraw | null
  onChange: (canvas: CanvasExcalidraw) => void
}

export default function CanvasExcalidrawEditor({ canvas, onChange }: CanvasExcalidrawEditorProps) {
  const initialData = useMemo<DadosIniciaisCanvas>(() => {
    if (!canvas) return { elements: [], files: {} }
    return {
      elements: canvas.elements ?? [],
      files: canvas.files ?? {},
    }
  }, [canvas])

  const propExcalidraw: ExcalidrawProps = {
    initialData: initialData as unknown as NonNullable<ExcalidrawProps["initialData"]>,
    onChange: (elements, _appState, files) => {
      onChange({
        elements: elements as unknown[],
        files: files as Record<string, unknown>,
      })
    },
  }

  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white">
      <ExcalidrawLazy {...propExcalidraw} />
    </div>
  )
}