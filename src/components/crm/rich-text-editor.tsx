"use client"

import { useRef, useCallback, useState } from "react"
import { sanitizeHtml } from "@/lib/sanitize"
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Link, Palette, Type,
} from "lucide-react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

const FONT_SIZES = [
  { label: "Pequeno", value: "1" },
  { label: "Normal", value: "3" },
  { label: "Grande", value: "4" },
  { label: "M. Grande", value: "5" },
  { label: "Enorme", value: "6" },
]

const FONT_FAMILIES = [
  "Arial", "Times New Roman", "Courier New", "Georgia", "Verdana", "Tahoma", "Trebuchet MS",
  "Roboto", "Open Sans", "Lato", "Montserrat", "Poppins", "Inter", "Nunito",
]

interface RichTextEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
}

export function RichTextEditor({ value, onChange, placeholder, minHeight = "300px" }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRange = useRef<Range | null>(null)

  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("https://")
  const [colorDialogOpen, setColorDialogOpen] = useState(false)
  const [colorMode, setColorMode] = useState<"fore" | "back">("fore")
  const [colorValue, setColorValue] = useState("#000000")

  const saveSelection = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0 && editorRef.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0)
    }
  }, [])

  const exec = useCallback((cmd: string, val?: string) => {
    if (savedRange.current) {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(savedRange.current)
      }
    }
    document.execCommand(cmd, false, val)
    if (editorRef.current) editorRef.current.focus()
    savedRange.current = null
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }, [onChange])

  const insertList = useCallback((ordered: boolean) => {
    const tag = ordered ? "ol" : "ul"
    exec("insertHTML", `<${tag} style="padding-left:24px"><li>Item</li></${tag}>`)
  }, [exec])

  const openLinkDialog = useCallback(() => {
    setLinkUrl("https://")
    setLinkDialogOpen(true)
  }, [])

  const confirmLink = useCallback(() => {
    if (linkUrl) {
      exec("createLink", linkUrl)
      setLinkDialogOpen(false)
    }
  }, [linkUrl, exec])

  const openColorPicker = useCallback((mode: "fore" | "back") => {
    setColorMode(mode)
    setColorValue("#000000")
    setColorDialogOpen(true)
  }, [])

  const confirmColor = useCallback(() => {
    const cmd = colorMode === "fore" ? "foreColor" : "hiliteColor"
    exec(cmd, colorValue)
    setColorDialogOpen(false)
  }, [colorMode, colorValue, exec])

  function handleEditorInput() {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  return (
    <div className="w-full border rounded-lg border-slate-300 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-700">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700" onMouseDown={saveSelection}>
        <div className="flex items-center gap-1 px-1 border-r border-slate-200 dark:border-slate-700">
          <button type="button" onClick={() => exec("bold")} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center" title="Negrito"><Bold size={16} /></button>
          <button type="button" onClick={() => exec("italic")} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center" title="Itálico"><Italic size={16} /></button>
          <button type="button" onClick={() => exec("underline")} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center" title="Sublinhado"><Underline size={16} /></button>
          <button type="button" onClick={() => exec("strikeThrough")} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center" title="Tachado"><Strikethrough size={16} /></button>
        </div>

        <div className="flex items-center gap-1 px-1 border-r border-slate-200 dark:border-slate-700">
          <button type="button" onClick={() => exec("justifyLeft")} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center" title="Alinhar Esquerda"><AlignLeft size={16} /></button>
          <button type="button" onClick={() => exec("justifyCenter")} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center" title="Centralizar"><AlignCenter size={16} /></button>
          <button type="button" onClick={() => exec("justifyRight")} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center" title="Alinhar Direita"><AlignRight size={16} /></button>
        </div>

        <div className="flex items-center gap-1 px-1 border-r border-slate-200 dark:border-slate-700">
          <button type="button" onClick={() => insertList(false)} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center" title="Lista Marcadores"><List size={16} /></button>
          <button type="button" onClick={() => insertList(true)} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center" title="Lista Numerada"><ListOrdered size={16} /></button>
        </div>

        <div className="flex items-center gap-1 px-1 border-r border-slate-200 dark:border-slate-700">
          <select onChange={e => exec("fontName", e.target.value)} className="text-xs p-1.5 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 w-20 sm:w-28 min-h-[36px]" title="Fonte">
            {FONT_FAMILIES.map(f => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </select>
          <select onChange={e => exec("fontSize", e.target.value)} className="text-xs p-1.5 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 w-16 sm:w-20 min-h-[36px]" title="Tamanho">
            {FONT_SIZES.map(s => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 px-1 border-r border-slate-200 dark:border-slate-700">
          <button type="button" onClick={() => openColorPicker("fore")} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center" title="Cor do Texto">
            <Palette size={16} />
          </button>
          <button type="button" onClick={() => openColorPicker("back")} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center relative" title="Cor de Fundo">
            <div className="relative">
              <Type size={16} />
              <span className="absolute -bottom-0.5 left-0 right-0 h-1 bg-yellow-400 rounded" />
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1 px-1">
          <button type="button" onClick={openLinkDialog} className="p-2 rounded hover:bg-slate-200 dark:hover:bg-slate-700 min-h-[36px] min-w-[36px] flex items-center justify-center" title="Inserir Link"><Link size={16} /></button>
        </div>
      </div>

      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleEditorInput}
        onMouseUp={saveSelection}
        className="w-full p-4 bg-white dark:bg-slate-700 text-slate-950 dark:text-white focus:outline-none overflow-y-auto"
        style={{ fontFamily: "Arial, sans-serif", lineHeight: "1.8", fontSize: "15px", minHeight }}
        data-placeholder={placeholder}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }}
      />

      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Inserir Link</DialogTitle></DialogHeader>
          <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." />
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmLink}>Inserir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{colorMode === "fore" ? "Cor do Texto" : "Cor de Fundo"}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={colorValue}
              onChange={e => setColorValue(e.target.value)}
              className="w-12 h-10 p-0.5 rounded border cursor-pointer"
            />
            <span className="text-sm text-slate-500">{colorValue}</span>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setColorDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmColor}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
