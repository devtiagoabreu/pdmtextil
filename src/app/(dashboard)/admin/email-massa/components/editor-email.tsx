"use client"

import { useState, useRef, useCallback, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { SanitizedHtml } from "@/components/ui/sanitized-html"
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Link, List, Copy, X, Eye, ImageIcon, Type, Strikethrough, ListOrdered, Palette, Code,
  Loader2, ChevronUp, ChevronDown, Move3D, FileText,
} from "lucide-react"
import { exportPDF } from "@/lib/export-utils"
import { FONT_SIZES, FONT_FAMILIES } from "../types"

export interface EditorEmailHandle {
  getHtml: () => string
  setHtml: (html: string) => void
  openPreview: () => void
}

interface EditorEmailProps {
  assunto?: string
}

export const EditorEmail = forwardRef<EditorEmailHandle, EditorEmailProps>(function EditorEmail({ assunto }, ref) {
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRange = useRef<Range | null>(null)

  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewSize, setPreviewSize] = useState({ w: "80vw", h: "85vh" })

  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("https://")

  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [imageUploading, setImageUploading] = useState(false)
  const imageFileRef = useRef<HTMLInputElement>(null)

  const [htmlCodeDialogOpen, setHtmlCodeDialogOpen] = useState(false)
  const [htmlCodeValue, setHtmlCodeValue] = useState("")
  const [selectedImageEl, setSelectedImageEl] = useState<HTMLElement | null>(null)
  const [imageToolbarPos, setImageToolbarPos] = useState({ top: 0, left: 0 })

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
  }, [])

  const insertList = useCallback((ordered: boolean) => {
    const tag = ordered ? "ol" : "ul"
    exec("insertHTML", `<${tag} style="padding-left:24px"><li>Item</li></${tag}>`)
  }, [exec])

  const insertLinkHandler = useCallback(() => {
    setLinkUrl("https://")
    setLinkDialogOpen(true)
  }, [])

  const confirmLink = useCallback(() => {
    if (linkUrl) {
      exec("createLink", linkUrl)
      setLinkDialogOpen(false)
    }
  }, [linkUrl, exec])

  const insertImageHandler = useCallback(() => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0)
    setImageUrl("")
    setImageDialogOpen(true)
  }, [])

  const uploadImageToCloudinary = useCallback(async (file: File) => {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ""
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""
    if (!cloudName || !uploadPreset) { toast.error("Cloudinary não configurado"); return }

    setImageUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("upload_preset", uploadPreset)
      formData.append("folder", "email-massa")

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: formData })
      if (!res.ok) throw new Error("Erro no upload")
      const data = await res.json()
      setImageUrl(data.secure_url)
      toast.success("Imagem enviada!")
    } catch { toast.error("Erro ao enviar imagem") }
    finally { setImageUploading(false) }
  }, [])

  const confirmImage = useCallback(() => {
    if (imageUrl && editorRef.current) {
      editorRef.current.focus()
      document.execCommand("insertHTML", false,
        `<div contenteditable="false" class="resizable-image" ` +
        `style="display:inline-block;overflow:visible;max-width:100%;` +
        `border:1px dashed #94a3b8;padding:3px;margin:4px 0;line-height:0;position:relative">` +
        `<img src="${imageUrl}" style="display:block;width:100%;height:auto;pointer-events:none" alt="" />` +
        `<span class="resize-handle" style="position:absolute;bottom:-4px;right:-4px;width:14px;height:14px;background:#3b82f6;border:2px solid white;border-radius:2px;cursor:nwse-resize;display:block;z-index:10;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></span>` +
        `</div>`
      )
      setImageDialogOpen(false)
      setImageUrl("")
    }
  }, [imageUrl])

  const insertHtmlCode = useCallback(() => {
    if (htmlCodeValue && editorRef.current) {
      editorRef.current.focus()
      if (savedRange.current) {
        const sel = window.getSelection()
        if (sel) { sel.removeAllRanges(); sel.addRange(savedRange.current) }
      }
      document.execCommand("insertHTML", false, htmlCodeValue)
      setHtmlCodeDialogOpen(false)
      setHtmlCodeValue("")
    }
  }, [htmlCodeValue])

  const handleEditorMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.closest(".resize-handle")) return
    const container = target.closest(".resizable-image") as HTMLElement | null
    if (container && editorRef.current) {
      setSelectedImageEl(container)
      const editorRect = editorRef.current.getBoundingClientRect()
      const imgRect = container.getBoundingClientRect()
      setImageToolbarPos({
        top: imgRect.bottom - editorRect.top + 4,
        left: imgRect.left - editorRect.left,
      })
    } else {
      setSelectedImageEl(null)
    }
  }, [])

  const applyWrapMode = useCallback((mode: "inline" | "float-left" | "float-right" | "free") => {
    if (!selectedImageEl) return
    selectedImageEl.style.removeProperty("float")
    selectedImageEl.style.removeProperty("position")
    selectedImageEl.style.removeProperty("zIndex")
    selectedImageEl.style.removeProperty("left")
    selectedImageEl.style.removeProperty("top")
    selectedImageEl.style.removeProperty("cursor")
    if (mode === "inline") {
      selectedImageEl.style.display = "inline-block"
      selectedImageEl.style.margin = "4px 0"
    } else if (mode === "float-left") {
      selectedImageEl.style.float = "left"
      selectedImageEl.style.margin = "4px 12px 8px 0"
    } else if (mode === "float-right") {
      selectedImageEl.style.float = "right"
      selectedImageEl.style.margin = "4px 0 8px 12px"
    } else if (mode === "free") {
      selectedImageEl.style.position = "absolute"
      selectedImageEl.style.cursor = "grab"
      selectedImageEl.style.margin = "0"
      const rect = selectedImageEl.getBoundingClientRect()
      const editorRect = editorRef.current?.getBoundingClientRect()
      if (editorRect) {
        const maxW = editorRect.width * 0.6
        const curW = rect.width
        if (curW > maxW) {
          selectedImageEl.style.width = `${maxW}px`
        }
        const newRect = selectedImageEl.getBoundingClientRect()
        selectedImageEl.style.left = `${newRect.left - editorRect.left}px`
        selectedImageEl.style.top = `${newRect.top - editorRect.top}px`
      }
    }
  }, [selectedImageEl])

  const adjustImageZIndex = useCallback((dir: "front" | "back") => {
    if (!selectedImageEl) return
    if (selectedImageEl.style.position !== "absolute") {
      selectedImageEl.style.position = "absolute"
      selectedImageEl.style.cursor = "grab"
      selectedImageEl.style.margin = "0"
      const rect = selectedImageEl.getBoundingClientRect()
      const editorRect = editorRef.current?.getBoundingClientRect()
      if (editorRect) {
        selectedImageEl.style.left = `${rect.left - editorRect.left}px`
        selectedImageEl.style.top = `${rect.top - editorRect.top}px`
      }
    }
    const current = parseInt(selectedImageEl.style.zIndex) || 0
    selectedImageEl.style.zIndex = String(dir === "front" ? current + 1 : current - 1)
  }, [selectedImageEl])

  useEffect(() => {
    const el = selectedImageEl
    if (!el || el.style.position !== "absolute") return

    const onMouseDown = (e: MouseEvent) => {
      if (el.style.position !== "absolute") return
      e.preventDefault()
      const rect = el.getBoundingClientRect()
      const offset = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      el.style.cursor = "grabbing"

      const onMove = (ev: MouseEvent) => {
        const editorRect = editorRef.current?.getBoundingClientRect()
        if (!editorRect) return
        el.style.left = `${ev.clientX - editorRect.left - offset.x}px`
        el.style.top = `${ev.clientY - editorRect.top - offset.y}px`
      }

      const onUp = () => {
        el.style.cursor = "grab"
        document.removeEventListener("mousemove", onMove)
        document.removeEventListener("mouseup", onUp)
      }

      document.addEventListener("mousemove", onMove)
      document.addEventListener("mouseup", onUp)
    }

    el.addEventListener("mousedown", onMouseDown)
    return () => el.removeEventListener("mousedown", onMouseDown)
  }, [selectedImageEl])

  const handleEditorMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    const handle = target.closest?.(".resize-handle") as HTMLElement | null
    if (!handle) return
    const container = handle.closest(".resizable-image") as HTMLElement | null
    if (!container) return
    e.preventDefault()
    e.stopPropagation()
    e.nativeEvent.stopImmediatePropagation()

    const img = container.querySelector("img") as HTMLImageElement | null
    const startW = container.offsetWidth
    const startX = e.clientX

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX
      const newW = Math.max(40, startW + dx)
      container.style.width = `${newW}px`
      if (img) {
        img.style.width = "100%"
        img.style.height = "auto"
      }
    }

    const onUp = () => {
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }

    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }, [])

  const openColorPicker = useCallback((mode: "fore" | "back") => {
    const sel = window.getSelection()
    if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0)
    setColorMode(mode)
    setColorDialogOpen(true)
  }, [])

  const applyColor = useCallback(() => {
    if (savedRange.current && editorRef.current) {
      const sel = window.getSelection()
      if (sel) {
        sel.removeAllRanges()
        sel.addRange(savedRange.current)
      }
    }
    exec(colorMode === "fore" ? "foreColor" : "hiliteColor", colorValue)
    setColorDialogOpen(false)
    savedRange.current = null
  }, [colorMode, colorValue, exec])

  const getContentHtml = useCallback(() => editorRef.current?.innerHTML || "", [])

  const setContentHtml = useCallback((html: string) => {
    if (editorRef.current) editorRef.current.innerHTML = html
  }, [])

  useImperativeHandle(ref, () => ({
    getHtml: getContentHtml,
    setHtml: setContentHtml,
    openPreview: () => setPreviewDialogOpen(true),
  }), [getContentHtml, setContentHtml])

  useEffect(() => {
    const link = document.createElement("link")
    link.href = "https://fonts.googleapis.com/css2?" + [
      "family=Roboto:wght@400;700",
      "family=Open+Sans:wght@400;700",
      "family=Lato:wght@400;700",
      "family=Montserrat:wght@400;700",
      "family=Poppins:wght@400;700",
      "family=Inter:wght@400;700",
      "family=Nunito:wght@400;700",
      "family=Raleway:wght@400;700",
      "family=Ubuntu:wght@400;700",
      "family=Playfair+Display:wght@400;700",
      "family=Merriweather:wght@400;700",
      "family=Oswald:wght@400;700",
      "family=Noto+Sans:wght@400;700",
      "family=Source+Sans+Pro:wght@400;700",
      "family=PT+Sans:wght@400;700",
      "family=Quicksand:wght@400;700",
      "family=Work+Sans:wght@400;700",
    ].join("&") + "&display=swap"
    link.rel = "stylesheet"
    document.head.appendChild(link)
    return () => { if (link.parentNode) link.parentNode.removeChild(link) }
  }, [])

  return (
    <>
      <div className="w-full border rounded-lg border-slate-300 dark:border-slate-600 overflow-hidden bg-white dark:bg-slate-700 relative">
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700" onMouseDown={saveSelection}>
          {/* Text formatting */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-700">
            <button type="button" onClick={() => exec("bold")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Negrito"><Bold size={15} /></button>
            <button type="button" onClick={() => exec("italic")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Itálico"><Italic size={15} /></button>
            <button type="button" onClick={() => exec("underline")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Sublinhado"><Underline size={15} /></button>
            <button type="button" onClick={() => exec("strikeThrough")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Tachado"><Strikethrough size={15} /></button>
          </div>

          {/* Alignment */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-700">
            <button type="button" onClick={() => exec("justifyLeft")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Alinhar Esquerda"><AlignLeft size={15} /></button>
            <button type="button" onClick={() => exec("justifyCenter")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Centralizar"><AlignCenter size={15} /></button>
            <button type="button" onClick={() => exec("justifyRight")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Alinhar Direita"><AlignRight size={15} /></button>
          </div>

          {/* Lists */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-700">
            <button type="button" onClick={() => insertList(false)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Lista Marcadores"><List size={15} /></button>
            <button type="button" onClick={() => insertList(true)} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Lista Numerada"><ListOrdered size={15} /></button>
          </div>

          {/* Font */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-700">
            <select onChange={e => exec("fontName", e.target.value)} className="text-xs p-1 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 w-28"
              title="Fonte">
              {FONT_FAMILIES.map((f: any) => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>
            <select onChange={e => exec("fontSize", e.target.value)} className="text-xs p-1 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 w-20"
              title="Tamanho">
              {FONT_SIZES.map((s: any) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </select>
          </div>

          {/* Color */}
          <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-700">
            <button type="button" onClick={() => openColorPicker("fore")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Cor do Texto">
              <Palette size={15} />
            </button>
            <button type="button" onClick={() => openColorPicker("back")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 relative" title="Cor de Fundo">
              <div className="relative">
                <Type size={15} />
                <span className="absolute -bottom-0.5 left-0 right-0 h-1 bg-yellow-400 rounded" />
              </div>
            </button>
          </div>

          {/* Insert */}
          <div className="flex items-center gap-0.5 px-1">
            <button type="button" onClick={insertLinkHandler} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Inserir Link"><Link size={15} /></button>
            <button type="button" onClick={insertImageHandler} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Inserir Imagem"><ImageIcon size={15} /></button>
            <button type="button" onClick={() => { const sel = window.getSelection(); if (sel && sel.rangeCount > 0) savedRange.current = sel.getRangeAt(0); setHtmlCodeValue(""); setHtmlCodeDialogOpen(true) }} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Inserir HTML"><Code size={15} /></button>
          </div>
        </div>

        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onMouseUp={handleEditorMouseUp}
          onMouseDown={handleEditorMouseDown}
          className="w-full min-h-[600px] p-6 bg-white dark:bg-slate-700 text-slate-950 dark:text-white focus:outline-none overflow-y-auto"
          style={{ fontFamily: "Arial, sans-serif", lineHeight: "1.8", fontSize: "15px" }}
          data-placeholder="Escreva o conteúdo do email aqui..."
        />

        {selectedImageEl && (
          <div
            className="image-toolbar absolute z-[100] flex items-center gap-0.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 p-1 shadow-lg"
            style={{ top: imageToolbarPos.top, left: Math.max(0, imageToolbarPos.left) }}
            onMouseDown={e => e.preventDefault()}
          >
            <button type="button" onClick={() => applyWrapMode("inline")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Em linha (ocupa espaço, quebra texto)">
              <Type size={14} />
            </button>
            <button type="button" onClick={() => applyWrapMode("float-left")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Flutuar à esquerda, texto à direita">
              <AlignLeft size={14} />
            </button>
            <button type="button" onClick={() => applyWrapMode("float-right")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Flutuar à direita, texto à esquerda">
              <AlignRight size={14} />
            </button>
            <button type="button" onClick={() => applyWrapMode("free")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Livre (arraste para mover)">
              <Move3D size={14} />
            </button>
            <span className="w-px h-5 bg-slate-300 dark:bg-slate-600 mx-0.5" />
            <button type="button" onClick={() => adjustImageZIndex("back")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Atrás do texto (z-index -1)">
              <ChevronDown size={14} />
            </button>
            <button type="button" onClick={() => adjustImageZIndex("front")}
              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700" title="Na frente do texto (z-index +1)">
              <ChevronUp size={14} />
            </button>
          </div>
        )}
      </div>

      {/* ─────── DIALOG PREVIEW ─────── */}
      <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
        <DialogContent
          className="!rounded-none flex flex-col overflow-hidden"
          style={{ width: previewSize.w, height: previewSize.h, maxWidth: "100vw", maxHeight: "100vh" }}
        >
          <DialogHeader className="shrink-0">
            <DialogTitle>Preview do Email</DialogTitle>
            <DialogDescription>{assunto || "Sem assunto"}</DialogDescription>
          </DialogHeader>
          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-4 overflow-y-auto shadow-inner min-h-0">
            <div
              className="w-full bg-white text-black shadow-sm mx-auto"
              style={{ fontFamily: "Arial, sans-serif", lineHeight: "1.8", fontSize: "15px", padding: "32px 40px", minHeight: "100%" }}
            >
              <SanitizedHtml html={getContentHtml()} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => {
              const html = getContentHtml()
              if (html) exportPDF(`Email - ${assunto || "sem assunto"}`, html)
            }} className="gap-1">
              <FileText size={14} /> Exportar PDF
            </Button>
            <Button variant="outline" onClick={() => setPreviewDialogOpen(false)}>Fechar</Button>
          </DialogFooter>
          <div
            onMouseDown={e => {
              e.preventDefault()
              const startX = e.clientX
              const startY = e.clientY
              const startW = previewSize.w
              const startH = previewSize.h
              const parsePx = (v: string) => Number(v.replace("px", ""))
              const onMove = (ev: MouseEvent) => {
                const w = parsePx(startW) + (ev.clientX - startX)
                const h = parsePx(startH) + (ev.clientY - startY)
                setPreviewSize({ w: `${Math.max(400, w)}px`, h: `${Math.max(300, h)}px` })
              }
              const onUp = () => { document.removeEventListener("mousemove", onMove); document.removeEventListener("mouseup", onUp) }
              document.addEventListener("mousemove", onMove)
              document.addEventListener("mouseup", onUp)
            }}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize hover:bg-blue-500/20 rounded-bl"
          >
            <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-slate-400" />
          </div>
        </DialogContent>
      </Dialog>

      {/* ─────── DIALOG LINK ─────── */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Inserir Link</DialogTitle>
            <DialogDescription>Digite a URL do link</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmLink}>Inserir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────── DIALOG IMAGEM ─────── */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Inserir Imagem</DialogTitle>
            <DialogDescription>Envie um arquivo ou digite a URL da imagem</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <input ref={imageFileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) uploadImageToCloudinary(f); e.target.value = "" }} />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => imageFileRef.current?.click()} disabled={imageUploading} className="gap-1">
                {imageUploading ? <Loader2 size={14} className="animate-spin" /> : <ImageIcon size={14} />}
                {imageUploading ? "Enviando..." : "Enviar arquivo"}
              </Button>
              <div className="flex-1">
                <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="Ou cole a URL da imagem" />
              </div>
            </div>
            {imageUrl && (
              <div className="border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800 p-2">
                <img src={imageUrl} alt="Preview" className="max-h-40 mx-auto"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmImage} disabled={!imageUrl || imageUploading}>Inserir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────── DIALOG HTML CODE ─────── */}
      <Dialog open={htmlCodeDialogOpen} onOpenChange={setHtmlCodeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inserir Código HTML</DialogTitle>
            <DialogDescription>Cole ou escreva código HTML para inserir no corpo do email</DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <textarea
              value={htmlCodeValue}
              onChange={e => setHtmlCodeValue(e.target.value)}
              placeholder='<div style="background:#f0f0f0;padding:20px;border-radius:8px;"><h2>Título</h2><p>Texto do email...</p></div>'
              className="w-full h-64 p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 font-mono text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
            />
            {htmlCodeValue && (
              <div className="mt-3">
                <p className="text-xs text-slate-400 mb-1">Preview:</p>
                <div className="border rounded-lg p-3 bg-white dark:bg-slate-800 max-h-40 overflow-auto">
                  <SanitizedHtml html={htmlCodeValue} />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHtmlCodeDialogOpen(false)}>Cancelar</Button>
            <Button onClick={insertHtmlCode} disabled={!htmlCodeValue}>Inserir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────── DIALOG COR ─────── */}
      <Dialog open={colorDialogOpen} onOpenChange={setColorDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{colorMode === "fore" ? "Cor do Texto" : "Cor de Fundo"}</DialogTitle>
            <DialogDescription>Escolha a cor</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-3">
              <input type="color" value={colorValue} onChange={e => setColorValue(e.target.value)} className="w-12 h-10 p-0.5 rounded border cursor-pointer" />
              <Input value={colorValue} onChange={e => setColorValue(e.target.value)} placeholder="#000000" className="font-mono" />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {["#000000","#333333","#666666","#999999","#cccccc","#ffffff",
                "#ff0000","#ff6600","#ffcc00","#00cc00","#0066ff","#6633cc",
                "#cc0066","#00cccc","#009966","#990000","#003366","#660066",
              ].map((c: any) => (
                <button key={c} type="button" onClick={() => setColorValue(c)}
                  className="w-8 h-8 rounded border border-slate-300 dark:border-slate-600 hover:scale-110 transition-transform"
                  style={{ backgroundColor: c }} title={c} />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setColorDialogOpen(false)}>Cancelar</Button>
            <Button onClick={applyColor}>Aplicar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
})

export default EditorEmail
