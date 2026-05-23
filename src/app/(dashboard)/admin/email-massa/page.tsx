"use client"

import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Send, Loader2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Link, List, Eye } from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

export default function EmailMassaPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const editorRef = useRef<HTMLDivElement>(null)
  const [assunto, setAssunto] = useState("")
  const [para, setPara] = useState("todos")
  const [sending, setSending] = useState(false)
  const [preview, setPreview] = useState(false)

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    if (editorRef.current) editorRef.current.focus()
  }, [])

  const insertLink = useCallback(() => {
    const url = prompt("URL do link:", "https://")
    if (url) exec("createLink", url)
  }, [exec])

  const handleSend = async () => {
    const html = editorRef.current?.innerHTML
    if (!html || html === "<br>") {
      toast.error("Escreva o conteúdo do email")
      return
    }
    if (!assunto) {
      toast.error("Informe o assunto")
      return
    }

    setSending(true)
    try {
      const res = await fetch("/api/admin/email-massa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ para, assunto, html }),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.enviados > 0) {
          const msg = `Enviados: ${data.enviados} de ${data.total}`
          toast.success(msg)
        } else {
          toast.error(`Nenhum email enviado (0 de ${data.total})`)
        }
        if (data.erros && data.erros.length > 0) {
          console.warn("[EMAIL-MASSA] Erros:", data.erros)
          toast.warning(`${data.erros.length} erro(s) ao enviar. Verifique o console.`)
        }
      } else {
        toast.error(data.error || "Erro ao enviar")
      }
    } catch {
      toast.error("Erro ao enviar emails")
    } finally {
      setSending(false)
    }
  }

  const getContentHtml = () => {
    if (!editorRef.current) return ""
    return editorRef.current.innerHTML
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Email em Massa{info && <InfoButton content={info} />}</h1>
        <p className="text-sm text-slate-500 mt-1">Envie emails para clientes e/ou usuários do sistema</p>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
        <div className="space-y-2">
          <Label>Enviar para</Label>
          <select value={para} onChange={e => setPara(e.target.value)}
            className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
            <option value="todos">Clientes + Usuários do Sistema</option>
            <option value="clientes">Apenas Clientes</option>
            <option value="usuarios">Apenas Usuários do Sistema</option>
          </select>
          <p className="text-xs text-slate-400">
            Use <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">{`[NOME]`}</code> no texto para personalizar com o nome do destinatário.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Assunto</Label>
          <Input value={assunto} onChange={e => setAssunto(e.target.value)} placeholder="Assunto do email" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Conteúdo</Label>
            <Button variant="ghost" size="sm" onClick={() => setPreview(!preview)} className="gap-1">
              <Eye size={14} /> {preview ? "Editar" : "Preview"}
            </Button>
          </div>

          {!preview ? (
            <>
              <div className="flex flex-wrap gap-1 p-2 border rounded-t-lg border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800">
                <button type="button" onClick={() => exec("bold")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Negrito"><Bold size={16} /></button>
                <button type="button" onClick={() => exec("italic")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Itálico"><Italic size={16} /></button>
                <button type="button" onClick={() => exec("underline")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Sublinhado"><Underline size={16} /></button>
                <span className="w-px bg-slate-300 dark:bg-slate-600 mx-1" />
                <button type="button" onClick={() => exec("justifyLeft")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Alinhar Esquerda"><AlignLeft size={16} /></button>
                <button type="button" onClick={() => exec("justifyCenter")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Centralizar"><AlignCenter size={16} /></button>
                <button type="button" onClick={() => exec("justifyRight")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Alinhar Direita"><AlignRight size={16} /></button>
                <span className="w-px bg-slate-300 dark:bg-slate-600 mx-1" />
                <button type="button" onClick={insertLink} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Inserir Link"><Link size={16} /></button>
                <button type="button" onClick={() => exec("insertUnorderedList")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Lista"><List size={16} /></button>
                <span className="w-px bg-slate-300 dark:bg-slate-600 mx-1" />
                <select onChange={e => exec("fontName", e.target.value)} className="text-xs p-1 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                  <option value="Arial">Arial</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Courier New">Courier New</option>
                  <option value="Georgia">Georgia</option>
                  <option value="Verdana">Verdana</option>
                </select>
                <select onChange={e => exec("fontSize", e.target.value)} className="text-xs p-1 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                  <option value="3">Normal</option>
                  <option value="4">Grande</option>
                  <option value="5">Muito Grande</option>
                  <option value="6">Enorme</option>
                </select>
                <input type="color" onChange={e => exec("foreColor", e.target.value)} className="w-8 h-8 p-0.5 rounded border cursor-pointer" title="Cor da Fonte" />
              </div>
              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                className="w-full min-h-[250px] p-3 rounded-b-lg border border-t-0 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 focus:outline-none overflow-y-auto"
                style={{ fontFamily: "Arial, sans-serif" }}
                data-placeholder="Escreva o conteúdo do email aqui..."
              />
            </>
          ) : (
            <div className="w-full min-h-[250px] p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 overflow-y-auto">
              <div dangerouslySetInnerHTML={{ __html: getContentHtml() }} />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button onClick={handleSend} disabled={sending} className="gap-2">
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {sending ? "Enviando..." : "Enviar Email em Massa"}
          </Button>
        </div>
      </div>
    </div>
  )
}
