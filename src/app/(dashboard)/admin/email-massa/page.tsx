"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import {
  Send, Loader2, Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight,
  Link, List, Plus, Pencil, Trash2, FileText, Users, Copy, X, Eye,
  ImageIcon, Type, Strikethrough, ListOrdered, Palette,
  RefreshCw, CheckCircle2, XCircle, Clock, Search,
  ChevronUp, ChevronDown, Move3D,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import ImportarContatosEmail from "@/components/importar/ImportarContatosEmail"
import { exportPDF, exportPDFRelatorio } from "@/lib/export-utils"
import { getInfoContent } from "@/lib/info-content"
import { Separator } from "@/components/ui/separator"
import { htmlToModelo, modeloToHtml } from "@/lib/email-modelo"
import { sanitizeHtml } from "@/lib/sanitize"
import type { Modelo, Lista, ListaComContatos, Contato, Envio, HistoricoData, Agendado } from "./types"
import { FONT_SIZES, FONT_FAMILIES } from "./types"
import { DashboardRelatorio } from "./components/dashboard-relatorio"

function ScheduleButton({ agendado, onAgendar }: { agendado: Agendado; onAgendar: (a: Agendado, data: string) => void }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState("")

  const handleSchedule = () => {
    if (!data) { toast.error("Informe a data e hora"); return }
    onAgendar(agendado, new Date(data).toISOString())
    setOpen(false)
    setData("")
  }

  return (
    <>
      <Button variant="outline" size="xs" onClick={() => setOpen(true)} className="gap-1"><Clock size={12} /> Agendar</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setOpen(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl p-6 shadow-2xl w-96" onClick={e => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">Agendar Disparo</h3>
            <p className="text-sm text-slate-500 mb-3">{agendado.nome || agendado.assunto}</p>
            <Input type="datetime-local" value={data} onChange={e => setData(e.target.value)} className="mb-4" />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button size="sm" onClick={handleSchedule}>Agendar</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function StatusBadge({ status, abertoEm }: { status: string; abertoEm: string | null }) {
  if (abertoEm) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle2 size={12} /> Lido
      </span>
    )
  }
  if (status === "enviado") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
        <Clock size={12} /> Enviado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
      <XCircle size={12} /> Falhou
    </span>
  )
}

export default function EmailMassaPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const editorRef = useRef<HTMLDivElement>(null)
  const savedRange = useRef<Range | null>(null)
  const [assunto, setAssunto] = useState("")
  const [para, setPara] = useState("todos")
  const [modoEnvio, setModoEnvio] = useState("bcc")
  const [selectedListaIds, setSelectedListaIds] = useState<number[]>([])
  const [sending, setSending] = useState(false)
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false)
  const [previewSize, setPreviewSize] = useState({ w: "80vw", h: "85vh" })
  const [activeTab, setActiveTab] = useState("enviar")

  const [modelos, setModelos] = useState<Modelo[]>([])
  const [modeloDialogOpen, setModeloDialogOpen] = useState(false)
  const [editModelo, setEditModelo] = useState<Modelo | null>(null)
  const [modeloForm, setModeloForm] = useState({ nome: "", assunto: "", html: "" })
  const [viewModelo, setViewModelo] = useState<Modelo | null>(null)

  const [listas, setListas] = useState<Lista[]>([])
  const [listaDialogOpen, setListaDialogOpen] = useState(false)
  const [editLista, setEditLista] = useState<ListaComContatos | null>(null)
  const [listaForm, setListaForm] = useState({ nome: "", descricao: "" })
  const [listaContatos, setListaContatos] = useState<Contato[]>([])
  const [novoContato, setNovoContato] = useState({ nome: "", email: "" })
  const [editContatoId, setEditContatoId] = useState<number | null>(null)
  const [viewLista, setViewLista] = useState<ListaComContatos | null>(null)
  const [loadingListas, setLoadingListas] = useState(false)


  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("https://")

  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")
  const [selectedImageEl, setSelectedImageEl] = useState<HTMLElement | null>(null)
  const [imageToolbarPos, setImageToolbarPos] = useState({ top: 0, left: 0 })

  const [colorDialogOpen, setColorDialogOpen] = useState(false)
  const [colorMode, setColorMode] = useState<"fore" | "back">("fore")
  const [colorValue, setColorValue] = useState("#000000")

  const [historico, setHistorico] = useState<HistoricoData | null>(null)
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [historicoSearch, setHistoricoSearch] = useState("")

  const [remetente, setRemetente] = useState("sistema")
  const [userEmailConfig, setUserEmailConfig] = useState<{ email: string } | null>(null)

  const [agendados, setAgendados] = useState<Agendado[]>([])
  const [loadingAgendados, setLoadingAgendados] = useState(false)
  const [agendadoForm, setAgendadoForm] = useState({ nome: "", agendadoPara: "" })
  const [editAgendado, setEditAgendado] = useState<Agendado | null>(null)
  const [agendadoFiltro, setAgendadoFiltro] = useState<string>("todos")

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

  const insertHeading = useCallback((val: string) => {
    exec("formatBlock", val)
  }, [exec])

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

  const confirmImage = useCallback(() => {
    if (imageUrl && editorRef.current) {
      editorRef.current.focus()
      document.execCommand("insertHTML", false,
        `<div contenteditable="false" class="resizable-image" ` +
        `style="display:inline-block;resize:both;overflow:hidden;max-width:100%;` +
        `border:1px dashed #94a3b8;padding:3px;margin:4px 0;line-height:0">` +
        `<img src="${imageUrl}" style="display:block;width:100%;height:auto;pointer-events:none" alt="" />` +
        `</div>`
      )
      setImageDialogOpen(false)
      setImageUrl("")
    }
  }, [imageUrl])

  const handleEditorMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
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
        selectedImageEl.style.left = `${rect.left - editorRect.left}px`
        selectedImageEl.style.top = `${rect.top - editorRect.top}px`
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

  const getContentHtml = () => editorRef.current?.innerHTML || ""

  const handleSend = async () => {
    const html = getContentHtml()
    if (!html || html === "<br>") {
      toast.error("Escreva o conteúdo do email")
      return
    }
    if (!assunto) {
      toast.error("Informe o assunto")
      return
    }
    if (para === "lista" && selectedListaIds.length === 0) {
      toast.error("Selecione pelo menos uma lista de destinatários")
      return
    }

    setSending(true)
    try {
      const body: any = { para, assunto, html, modo_envio: modoEnvio, remetente }
      if (para === "lista") body.listas = selectedListaIds

      const res = await fetch("/api/admin/email-massa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (res.ok) {
        if (data.enviados > 0) {
          toast.success(`Enviados: ${data.enviados} de ${data.total}`)
        } else {
          toast.error(`Nenhum email enviado (0 de ${data.total})`)
        }
        if (data.erros && data.erros.length > 0) {
          console.warn("[EMAIL-MASSA] Erros:", data.erros)
          toast.warning(`${data.erros.length} erro(s). Verifique o console.`)
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

  const carregarModelos = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/email-massa/modelos")
      if (res.ok) setModelos(await res.json())
    } catch { /* ignore */ }
  }, [])

  const carregarListas = useCallback(async () => {
    setLoadingListas(true)
    try {
      const res = await fetch("/api/admin/email-massa/listas")
      if (res.ok) setListas(await res.json())
    } catch { /* ignore */ }
    setLoadingListas(false)
  }, [])

  const carregarHistorico = useCallback(async () => {
    setLoadingHistorico(true)
    try {
      const res = await fetch("/api/admin/email-massa/historico")
      if (res.ok) setHistorico(await res.json())
    } catch { /* ignore */ }
    setLoadingHistorico(false)
  }, [])

  useEffect(() => {
    carregarModelos()
    carregarListas()
    fetch("/api/user/email-config")
      .then(r => r.json())
      .then(data => {
        if (data.config) {
          setUserEmailConfig(data.config)
          setRemetente("usuario")
        }
      })
      .catch(() => {})
  }, [carregarModelos, carregarListas])

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

  useEffect(() => {
    if (activeTab === "historico") carregarHistorico()
  }, [activeTab, carregarHistorico])

  const carregarAgendados = useCallback(async () => {
    setLoadingAgendados(true)
    try {
      const res = await fetch("/api/admin/email-massa/agendados")
      if (res.ok) setAgendados(await res.json())
    } catch { /* ignore */ }
    setLoadingAgendados(false)
  }, [])

  useEffect(() => {
    if (activeTab === "agendar") {
      carregarAgendados()
      fetch("/api/admin/email-massa/agendados/executar", { method: "POST" }).catch(() => {})
    }
  }, [activeTab, carregarAgendados])

  const salvarAgendado = async (status: "rascunho" | "agendado") => {
    const html = getContentHtml()
    if (!html || html === "<br>") { toast.error("Escreva o conteúdo do email"); return }
    if (!assunto) { toast.error("Informe o assunto"); return }
    if (status === "agendado" && !agendadoForm.agendadoPara) { toast.error("Informe a data e hora do envio"); return }
    if (para === "lista" && selectedListaIds.length === 0) { toast.error("Selecione pelo menos uma lista"); return }

    try {
      const body: any = {
        nome: agendadoForm.nome || assunto,
        para, assunto, html, listas: para === "lista" ? selectedListaIds : null,
        modoEnvio, remetente, agendadoPara: agendadoForm.agendadoPara || null, status,
      }
      const url = editAgendado ? `/api/admin/email-massa/agendados/${editAgendado.id}` : "/api/admin/email-massa/agendados"
      const res = await fetch(url, { method: editAgendado ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (res.ok) {
        toast.success(status === "agendado" ? "Disparo agendado!" : "Rascunho salvo!")
        setEditAgendado(null)
        setAgendadoForm({ nome: "", agendadoPara: "" })
        carregarAgendados()
      } else {
        const err = await res.json()
        toast.error(err.error || "Erro ao salvar")
      }
    } catch { toast.error("Erro ao salvar agendamento") }
  }

  const carregarAgendado = (a: Agendado) => {
    setEditAgendado(a)
    setAssunto(a.assunto)
    setPara(a.para)
    setModoEnvio(a.modoEnvio || "bcc")
    setRemetente(a.remetente || "sistema")
    setSelectedListaIds(a.listas || [])
    setAgendadoForm({ nome: a.nome, agendadoPara: a.agendadoPara ? new Date(a.agendadoPara).toISOString().slice(0, 16) : "" })
    setActiveTab("enviar")
    setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = a.html }, 100)
    toast.success(`Disparo "${a.nome}" carregado no editor`)
  }

  const agendarExistente = async (a: Agendado, data: string) => {
    try {
      const res = await fetch(`/api/admin/email-massa/agendados/${a.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agendadoPara: data, status: "agendado" }),
      })
      if (res.ok) { toast.success("Disparo agendado!"); carregarAgendados() }
    } catch { toast.error("Erro ao agendar") }
  }

  const cancelarAgendado = async (a: Agendado) => {
    try {
      const res = await fetch(`/api/admin/email-massa/agendados/${a.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelado" }),
      })
      if (res.ok) { toast.success("Disparo cancelado"); carregarAgendados() }
    } catch { toast.error("Erro ao cancelar") }
  }

  const excluirAgendado = async (id: number) => {
    if (!confirm("Excluir este agendamento?")) return
    try {
      const res = await fetch(`/api/admin/email-massa/agendados/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Excluído"); carregarAgendados() }
    } catch { toast.error("Erro ao excluir") }
  }

  const executarAgendamentos = async () => {
    try {
      const res = await fetch("/api/admin/email-massa/agendados/executar", { method: "POST" })
      const data = await res.json()
      if (data.executados > 0) toast.success(`${data.executados} disparo(s) executado(s)`)
      else toast.info("Nenhum agendamento pendente")
      carregarAgendados()
    } catch { toast.error("Erro ao verificar agendamentos") }
  }

  const usarModelo = (m: Modelo) => {
    setAssunto(m.assunto)
    setActiveTab("enviar")
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = modeloToHtml(m.html)
      }
    }, 100)
    toast.success(`Modelo "${m.nome}" carregado`)
  }

  const salvarModelo = async () => {
    if (!modeloForm.nome) { toast.error("Informe o nome do modelo"); return }
    try {
      const url = editModelo
        ? `/api/admin/email-massa/modelos/${editModelo.id}`
        : "/api/admin/email-massa/modelos"
      const method = editModelo ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(modeloForm) })
      if (res.ok) {
        toast.success(editModelo ? "Modelo atualizado" : "Modelo criado")
        setModeloDialogOpen(false)
        setEditModelo(null)
        setModeloForm({ nome: "", assunto: "", html: "" })
        carregarModelos()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao salvar")
      }
    } catch {
      toast.error("Erro ao salvar modelo")
    }
  }

  const deletarModelo = async (id: number) => {
    if (!confirm("Deletar este modelo?")) return
    try {
      const res = await fetch(`/api/admin/email-massa/modelos/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Modelo deletado")
        carregarModelos()
      }
    } catch {
      toast.error("Erro ao deletar")
    }
  }

  const abrirEditarModelo = (m: Modelo) => {
    setEditModelo(m)
    setModeloForm({ nome: m.nome, assunto: m.assunto, html: m.html })
    setModeloDialogOpen(true)
  }

  const abrirNovoModelo = () => {
    setEditModelo(null)
    setModeloForm({ nome: "", assunto: "", html: htmlToModelo(getContentHtml()) })
    setModeloDialogOpen(true)
  }

  const salvarLista = async () => {
    if (!listaForm.nome) { toast.error("Informe o nome da lista"); return }
    try {
      const url = editLista
        ? `/api/admin/email-massa/listas/${editLista.id}`
        : "/api/admin/email-massa/listas"
      const method = editLista ? "PUT" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(listaForm) })
      if (res.ok) {
        const data = await res.json()
        const listaId = editLista ? editLista.id : data.id

        if (listaContatos.length > 0) {
          await fetch(`/api/admin/email-massa/listas/${listaId}/contatos`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ contatos: listaContatos.map(c => ({ nome: c.nome, email: c.email })) }),
          })
        }

        toast.success(editLista ? "Lista atualizada" : "Lista criada")
        setListaDialogOpen(false)
        setEditLista(null)
        setListaForm({ nome: "", descricao: "" })
        setListaContatos([])
        carregarListas()
      } else {
        const data = await res.json()
        toast.error(data.error || "Erro ao salvar")
      }
    } catch {
      toast.error("Erro ao salvar lista")
    }
  }

  const deletarLista = async (id: number) => {
    if (!confirm("Deletar esta lista e todos os seus contatos?")) return
    try {
      const res = await fetch(`/api/admin/email-massa/listas/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Lista deletada")
        carregarListas()
        setSelectedListaIds(prev => prev.filter(lid => lid !== id))
      }
    } catch {
      toast.error("Erro ao deletar")
    }
  }

  const abrirEditarLista = async (l: Lista) => {
    try {
      const res = await fetch(`/api/admin/email-massa/listas/${l.id}`)
      if (res.ok) {
        const data = await res.json()
        setEditLista(data)
        setListaForm({ nome: data.nome, descricao: data.descricao || "" })
        setListaContatos(data.contatos || [])
        setListaDialogOpen(true)
      }
    } catch {
      toast.error("Erro ao carregar lista")
    }
  }

  const abrirNovaLista = () => {
    setEditLista(null)
    setListaForm({ nome: "", descricao: "" })
    setListaContatos([])
    setListaDialogOpen(true)
  }

  const abrirVerLista = async (l: Lista) => {
    try {
      const res = await fetch(`/api/admin/email-massa/listas/${l.id}`)
      if (res.ok) setViewLista(await res.json())
    } catch {
      toast.error("Erro ao carregar lista")
    }
  }

  const adicionarContato = () => {
    if (!novoContato.nome || !novoContato.email) {
      toast.error("Preencha nome e email do contato")
      return
    }
    if (!novoContato.email.includes("@")) {
      toast.error("Email inválido")
      return
    }
    if (editContatoId) {
      setListaContatos(prev => prev.map(c =>
        c.id === editContatoId ? { ...c, nome: novoContato.nome, email: novoContato.email } : c
      ))
      setEditContatoId(null)
    } else {
      setListaContatos(prev => [...prev, { ...novoContato, id: Date.now(), listaId: editLista?.id || 0 }])
    }
    setNovoContato({ nome: "", email: "" })
  }

  const editarContato = (c: Contato) => {
    setNovoContato({ nome: c.nome, email: c.email })
    setEditContatoId(c.id)
  }

  const cancelarEdicaoContato = () => {
    setEditContatoId(null)
    setNovoContato({ nome: "", email: "" })
  }

  const removerContato = (id: number) => {
    setListaContatos(prev => prev.filter(c => c.id !== id))
  }

  const toggleListaSelecionada = (id: number) => {
    setSelectedListaIds(prev =>
      prev.includes(id) ? prev.filter(lid => lid !== id) : [...prev, id]
    )
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  const filteredEnvios = historico?.envios.filter(e =>
    !historicoSearch ||
    e.email.toLowerCase().includes(historicoSearch.toLowerCase()) ||
    (e.nome?.toLowerCase().includes(historicoSearch.toLowerCase())) ||
    e.assunto.toLowerCase().includes(historicoSearch.toLowerCase())
  ) || []

  return (
    <div className="w-full flex flex-col space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Email em Massa{info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Envie emails, gerencie modelos e listas, acompanhe o histórico</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col space-y-6">
        <TabsList className="w-full flex justify-start border-b rounded-none bg-transparent h-auto p-0 space-x-6">
          <TabsTrigger value="enviar" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-2">Enviar Email</TabsTrigger>
          <TabsTrigger value="modelos" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-2">Modelos</TabsTrigger>
          <TabsTrigger value="listas" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-2">Listas</TabsTrigger>
          <TabsTrigger value="historico" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-2">Histórico</TabsTrigger>
          <TabsTrigger value="agendar" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-2">Programar Disparo</TabsTrigger>
          <TabsTrigger value="dashboard" className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent pb-2">Dashboard</TabsTrigger>
        </TabsList>

        {/* ────────── TAB ENVIAR ────────── */}
        <TabsContent value="enviar" className="w-full m-0 border-0 p-0 shadow-none">
          <div className="w-full rounded-xl border bg-card text-card-foreground shadow flex flex-col">
            <div className="p-6 flex flex-col space-y-8">

              {/* ── Configurações de Envio ── */}
              <section className="flex flex-col space-y-4">
                <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Configurações de Envio</h2>

                <div className="flex flex-col space-y-2">
                  <Label>Enviar para</Label>
                  <select value={para} onChange={e => setPara(e.target.value)}
                    className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                    <option value="todos">Clientes + Usuários do Sistema</option>
                    <option value="clientes">Apenas Clientes</option>
                    <option value="usuarios">Apenas Usuários do Sistema</option>
                    <option value="lista">Lista de Destinatários</option>
                  </select>
                </div>

                <div className="flex flex-col space-y-2">
                  <Label>Assunto</Label>
                  <Input value={assunto} onChange={e => setAssunto(e.target.value)} placeholder="Assunto do email" />
                </div>

                {para === "lista" && (
                  <div className="flex flex-col space-y-2">
                    <Label>Selecionar Listas</Label>
                    <div className="border rounded-lg border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto p-2 space-y-1">
                      {listas.length === 0 ? (
                        <p className="text-sm text-slate-400 p-2">Nenhuma lista cadastrada. Vá na aba Listas para criar.</p>
                      ) : listas.map(l => (
                        <label key={l.id} className="flex items-center gap-2 p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer">
                          <input type="checkbox" checked={selectedListaIds.includes(l.id)}
                            onChange={() => toggleListaSelecionada(l.id)}
                            className="rounded border-slate-300" />
                          <span className="text-sm font-medium">{l.nome}</span>
                          <span className="text-xs text-slate-400">({l.totalContatos} contatos)</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col space-y-2">
                  <Label>Remetente</Label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="remetente" value="sistema" checked={remetente === "sistema"}
                        onChange={e => setRemetente(e.target.value)} className="text-blue-600" />
                      <span className="text-sm">Sistema (<code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">SMTP padrão</code>)</span>
                    </label>
                    <label className={`flex items-center gap-2 cursor-pointer ${!userEmailConfig ? "opacity-50" : ""}`}>
                      <input type="radio" name="remetente" value="usuario" checked={remetente === "usuario"}
                        onChange={e => setRemetente(e.target.value)} className="text-blue-600"
                        disabled={!userEmailConfig} />
                      <span className="text-sm">
                        {userEmailConfig ? `Meu Email (${userEmailConfig.email})` : "Meu Email"}
                      </span>
                    </label>
                  </div>
                  {!userEmailConfig && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      Nenhuma configuração encontrada. Vá em Meu Perfil.
                    </p>
                  )}
                </div>

                <div className="flex flex-col space-y-2">
                  <Label>Modo de Envio</Label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="modo_envio" value="bcc" checked={modoEnvio === "bcc"}
                        onChange={e => setModoEnvio(e.target.value)} className="text-blue-600" />
                      <span className="text-sm">Cópia Oculta (BCC)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="modo_envio" value="to" checked={modoEnvio === "to"}
                        onChange={e => setModoEnvio(e.target.value)} className="text-blue-600" />
                      <span className="text-sm">Para (TO)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="modo_envio" value="individual" checked={modoEnvio === "individual"}
                        onChange={e => setModoEnvio(e.target.value)} className="text-blue-600" />
                      <span className="text-sm">Individual (<code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">[NOME]</code>)</span>
                    </label>
                  </div>
                </div>
              </section>

              <Separator />

              {/* ── Editor de Conteúdo ── */}
              <section className="flex flex-col space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Conteúdo do Email</h2>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={abrirNovoModelo} className="gap-1">
                      <FileText size={14} /> Salvar como Modelo
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPreviewDialogOpen(true)} className="gap-1">
                      <Eye size={14} /> Preview
                    </Button>
                  </div>
                </div>

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
                          {FONT_FAMILIES.map(f => (
                            <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                          ))}
                        </select>
                        <select onChange={e => exec("fontSize", e.target.value)} className="text-xs p-1 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 w-20"
                          title="Tamanho">
                          {FONT_SIZES.map(s => (
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
                      </div>
                    </div>

                    <div
                      ref={editorRef}
                      contentEditable
                      suppressContentEditableWarning
                      onMouseUp={handleEditorMouseUp}
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
              </section>

              {/* ── Botão Enviar ── */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                {modelos.length > 0 && (
                  <div className="flex items-center gap-1 flex-wrap max-w-md">
                    <span className="text-xs text-slate-400 mr-1">Modelos:</span>
                    {modelos.slice(0, 3).map(m => (
                      <button key={m.id} type="button" onClick={() => usarModelo(m)}
                        className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 border border-blue-200 dark:border-blue-800">
                        {m.nome}
                      </button>
                    ))}
                  </div>
                )}
                <Button onClick={handleSend} disabled={sending} className="gap-2 ml-auto">
                  {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  {sending ? "Enviando..." : "Enviar Email em Massa"}
                </Button>
              </div>

            </div>
          </div>
        </TabsContent>

        {/* ────────── TAB MODELOS ────────── */}
        <TabsContent value="modelos" className="w-full m-0 border-0 p-0 shadow-none">
          <div className="w-full rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Modelos de Email</h2>
                <Button onClick={abrirNovoModelo} className="gap-1"><Plus size={14} /> Novo Modelo</Button>
              </div>

              {modelos.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">Nenhum modelo cadastrado. Clique em &ldquo;Novo Modelo&rdquo; para criar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left font-medium p-2">Nome</th>
                        <th className="text-left font-medium p-2">Assunto</th>
                        <th className="text-right font-medium p-2 w-52">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {modelos.map(m => (
                        <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2 font-medium">{m.nome}</td>
                          <td className="p-2 text-slate-500 truncate max-w-xs">{m.assunto}</td>
                          <td className="p-2 text-right whitespace-nowrap">
                            <div className="flex gap-1 justify-end">
                              <Button variant="outline" size="xs" onClick={() => usarModelo(m)} className="gap-1">
                                <Copy size={12} /> Usar
                              </Button>
                              <Button variant="ghost" size="xs" onClick={() => abrirEditarModelo(m)} className="gap-1">
                                <Pencil size={12} />
                              </Button>
                              <Button variant="ghost" size="xs" onClick={() => setViewModelo(m)} className="gap-1">
                                <Eye size={12} />
                              </Button>
                              <Button variant="ghost" size="xs" onClick={() => deletarModelo(m.id)} className="gap-1 text-red-500 hover:text-red-700">
                                <Trash2 size={12} />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ────────── TAB LISTAS ────────── */}
        <TabsContent value="listas" className="w-full m-0 border-0 p-0 shadow-none">
          <div className="w-full rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Listas de Destinatários</h2>
                <Button onClick={abrirNovaLista} className="gap-1"><Plus size={14} /> Nova Lista</Button>
              </div>

              {loadingListas ? (
                <p className="text-sm text-slate-400 py-8 text-center">Carregando...</p>
              ) : listas.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">Nenhuma lista cadastrada. Clique em &ldquo;Nova Lista&rdquo; para criar.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="text-left font-medium p-2">Nome</th>
                        <th className="text-left font-medium p-2">Descrição</th>
                        <th className="text-center font-medium p-2 w-24">Contatos</th>
                        <th className="text-right font-medium p-2 w-64">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listas.map(l => (
                        <tr key={l.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="p-2 font-medium">{l.nome}</td>
                          <td className="p-2 text-slate-500 truncate max-w-xs">{l.descricao || "—"}</td>
                          <td className="p-2 text-center"><span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{l.totalContatos}</span></td>
                          <td className="p-2 text-right whitespace-nowrap">
                            <div className="flex gap-1 justify-end items-center">
                              <ImportarContatosEmail listaId={l.id} listaNome={l.nome} onImportado={carregarListas} />
                              <Button variant="ghost" size="xs" onClick={() => abrirEditarLista(l)} className="gap-1"><Pencil size={12} /></Button>
                              <Button variant="ghost" size="xs" onClick={() => abrirVerLista(l)} className="gap-1"><Eye size={12} /></Button>
                              <Button variant="ghost" size="xs" onClick={() => deletarLista(l.id)} className="gap-1 text-red-500 hover:text-red-700"><Trash2 size={12} /></Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </TabsContent>

        {/* ────────── TAB DASHBOARD ────────── */}
        <TabsContent value="dashboard" className="w-full m-0 border-0 p-0 shadow-none">
          <div className="w-full rounded-xl border bg-card text-card-foreground shadow p-6">
            <DashboardRelatorio />
          </div>
        </TabsContent>

        {/* ────────── TAB HISTÓRICO ────────── */}
        <TabsContent value="historico" className="w-full m-0 border-0 p-0 shadow-none">
          <div className="w-full rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Histórico de Envios</h2>
                <div className="flex gap-2">
                  {historico && (
                    <Button variant="outline" size="sm" onClick={() => {
                      exportPDFRelatorio({
                        title: "Relatório de Email em Massa",
                        period: `Exportado em ${new Date().toLocaleString("pt-BR")}`,
                        stats: {
                          Total: historico.stats.total,
                          Enviados: historico.stats.enviados,
                          Lidos: historico.stats.lidos,
                          Cliques: historico.stats.totalCliques,
                          Falhas: historico.stats.falhas,
                        },
                        tables: [{
                          headers: ["Status", "Email", "Nome", "Assunto", "Cliques", "Enviado em", "Aberto em"],
                          rows: filteredEnvios.map(e => [
                            e.abertoEm ? "Lido" : e.status === "enviado" ? "Enviado" : "Falhou",
                            e.email,
                            e.nome || "-",
                            e.assunto,
                            e.totalCliques || 0,
                            formatDate(e.createdAt),
                            formatDate(e.abertoEm),
                          ]),
                        }],
                        filename: `relatorio-email-massa-${new Date().toISOString().split("T")[0]}`,
                        orientation: "landscape",
                      })
                    }} className="gap-1">
                      <FileText size={14} /> Relatório PDF
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={carregarHistorico} className="gap-1">
                    <RefreshCw size={14} /> Atualizar
                  </Button>
                </div>
              </div>

              {loadingHistorico ? (
                <p className="text-sm text-slate-400 py-8 text-center">Carregando...</p>
              ) : historico ? (
                <div className="flex flex-col space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-400 uppercase tracking-wide">Total</p>
                      <p className="text-2xl font-bold mt-1">{historico.stats.total}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                      <p className="text-xs text-blue-500 uppercase tracking-wide">Enviados</p>
                      <p className="text-2xl font-bold mt-1 text-blue-700 dark:text-blue-300">{historico.stats.enviados}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                      <p className="text-xs text-green-500 uppercase tracking-wide">Lidos</p>
                      <p className="text-2xl font-bold mt-1 text-green-700 dark:text-green-300">{historico.stats.lidos}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                      <p className="text-xs text-purple-500 uppercase tracking-wide">Cliques</p>
                      <p className="text-2xl font-bold mt-1 text-purple-700 dark:text-purple-300">{historico.stats.totalCliques}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                      <p className="text-xs text-red-500 uppercase tracking-wide">Falhas</p>
                      <p className="text-2xl font-bold mt-1 text-red-700 dark:text-red-300">{historico.stats.falhas}</p>
                    </div>
                  </div>

                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <Input
                      value={historicoSearch}
                      onChange={e => setHistoricoSearch(e.target.value)}
                      placeholder="Buscar por email, nome ou assunto..."
                      className="pl-9"
                    />
                  </div>

                  {filteredEnvios.length === 0 ? (
                    <p className="text-sm text-slate-400 py-8 text-center">
                      {historicoSearch ? "Nenhum envio encontrado para esta busca." : "Nenhum envio registrado ainda."}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left font-medium p-2">Status</th>
                            <th className="text-left font-medium p-2">Email</th>
                            <th className="text-left font-medium p-2">Nome</th>
                            <th className="text-left font-medium p-2">Assunto</th>
                            <th className="text-center font-medium p-2 w-20">Cliques</th>
                            <th className="text-left font-medium p-2">Enviado em</th>
                            <th className="text-left font-medium p-2">Aberto em</th>
                            <th className="text-left font-medium p-2">Erro</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredEnvios.map(e => (
                            <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-2">
                                <StatusBadge status={e.status} abertoEm={e.abertoEm} />
                              </td>
                              <td className="p-2 text-slate-600 dark:text-slate-300">{e.email}</td>
                              <td className="p-2">{e.nome || "—"}</td>
                              <td className="p-2 text-slate-500 truncate max-w-[160px]">{e.assunto}</td>
                              <td className="p-2 text-center">
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${e.totalCliques > 0 ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
                                  {e.totalCliques || 0}
                                </span>
                              </td>
                              <td className="p-2 text-slate-500 text-xs">{formatDate(e.createdAt)}</td>
                              <td className="p-2 text-slate-500 text-xs">{formatDate(e.abertoEm)}</td>
                              <td className="p-2 text-red-500 text-xs max-w-[150px] truncate">{e.error || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400 py-8 text-center">Nenhum envio registrado ainda.</p>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ────────── TAB PROGRAMAR DISPARO ────────── */}
        <TabsContent value="agendar" className="w-full m-0 border-0 p-0 shadow-none">
          <div className="w-full rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Programar Disparo</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={executarAgendamentos} className="gap-1">
                    <RefreshCw size={14} /> Verificar Agora
                  </Button>
                  <Button size="sm" onClick={() => { setEditAgendado(null); setAgendadoForm({ nome: "", agendadoPara: "" }); setActiveTab("enviar") }} className="gap-1">
                    <Plus size={14} /> Novo Disparo
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                {["todos", "rascunho", "agendado", "enviado", "cancelado", "erro"].map(f => (
                  <button key={f} onClick={() => setAgendadoFiltro(f)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${agendadoFiltro === f ? "bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-300" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                    {f === "todos" ? "Todos" : f === "rascunho" ? "Rascunhos" : f === "agendado" ? "Agendados" : f === "enviado" ? "Enviados" : f === "cancelado" ? "Cancelados" : "Com Erro"}
                  </button>
                ))}
              </div>

              {loadingAgendados ? (
                <p className="text-sm text-slate-400 py-8 text-center">Carregando...</p>
              ) : (
                (() => {
                  const filtered = agendados.filter(a => agendadoFiltro === "todos" || a.status === agendadoFiltro)
                  if (filtered.length === 0) return <p className="text-sm text-slate-400 py-8 text-center">Nenhum disparo encontrado.</p>
                  return (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-700">
                            <th className="text-left font-medium p-2">Status</th>
                            <th className="text-left font-medium p-2">Nome</th>
                            <th className="text-left font-medium p-2">Assunto</th>
                            <th className="text-left font-medium p-2">Destinatários</th>
                            <th className="text-left font-medium p-2">Agendado para</th>
                            <th className="text-left font-medium p-2">Criado em</th>
                            <th className="text-right font-medium p-2 w-64">Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(a => (
                            <tr key={a.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                              <td className="p-2">
                                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full ${
                                  a.status === "rascunho" ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" :
                                  a.status === "agendado" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                                  a.status === "enviado" ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                                  a.status === "cancelado" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                                  "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                }`}>
                                  {a.status === "rascunho" ? "Rascunho" : a.status === "agendado" ? "Agendado" : a.status === "enviado" ? "Enviado" : a.status === "cancelado" ? "Cancelado" : "Erro"}
                                </span>
                              </td>
                              <td className="p-2 font-medium">{a.nome || a.assunto}</td>
                              <td className="p-2 text-slate-500 truncate max-w-[200px]">{a.assunto}</td>
                              <td className="p-2 text-xs">{a.para === "lista" ? `${a.listas?.length || 0} lista(s)` : a.para}</td>
                              <td className="p-2 text-xs">{a.agendadoPara ? new Date(a.agendadoPara).toLocaleString("pt-BR") : "—"}</td>
                              <td className="p-2 text-xs text-slate-400">{new Date(a.createdAt).toLocaleString("pt-BR")}</td>
                              <td className="p-2 text-right">
                                <div className="flex gap-1 justify-end">
                                  {a.status === "rascunho" && (
                                    <>
                                      <Button variant="outline" size="xs" onClick={() => carregarAgendado(a)} className="gap-1"><Pencil size={12} /> Editar</Button>
                                      <ScheduleButton agendado={a} onAgendar={agendarExistente} />
                                    </>
                                  )}
                                  {a.status === "agendado" && (
                                    <Button variant="outline" size="xs" onClick={() => cancelarAgendado(a)} className="gap-1 text-yellow-600">Cancelar</Button>
                                  )}
                                  {(a.status === "rascunho" || a.status === "cancelado" || a.status === "erro") && (
                                    <Button variant="ghost" size="xs" onClick={() => excluirAgendado(a.id)} className="gap-1 text-red-500 hover:text-red-700"><Trash2 size={12} /></Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                })()
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─────── DIALOG MODELO ─────── */}
      <Dialog open={modeloDialogOpen} onOpenChange={setModeloDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editModelo ? "Editar Modelo" : "Novo Modelo"}</DialogTitle>
            <DialogDescription>Preencha os dados do modelo de email</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome do Modelo</Label>
              <Input value={modeloForm.nome} onChange={e => setModeloForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Boletim Informativo" />
            </div>
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input value={modeloForm.assunto} onChange={e => setModeloForm(p => ({ ...p, assunto: e.target.value }))} placeholder="Assunto do email" />
            </div>
            <div className="space-y-2">
              <Label>Conteúdo HTML</Label>
              <Textarea value={modeloForm.html} onChange={e => setModeloForm(p => ({ ...p, html: e.target.value }))}
                placeholder="Cole ou digite o HTML do email..."
                className="min-h-[200px] font-mono text-xs" />
              <p className="text-xs text-slate-400">Use <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded">[NOME]</code> para personalizar com o nome do destinatário.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModeloDialogOpen(false)}>Cancelar</Button>
            <Button onClick={salvarModelo}>{editModelo ? "Atualizar" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────── DIALOG VER MODELO ─────── */}
      <Dialog open={!!viewModelo} onOpenChange={() => setViewModelo(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewModelo?.nome}</DialogTitle>
            <DialogDescription>Assunto: {viewModelo?.assunto}</DialogDescription>
          </DialogHeader>
          {viewModelo && (
            <div className="border rounded-lg p-4 bg-white dark:bg-slate-800 overflow-y-auto max-h-96">
              <div className="text-xs text-slate-400 mb-2">Prévia do HTML:</div>
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(modeloToHtml(viewModelo.html)) }} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewModelo(null)}>Fechar</Button>
            <Button onClick={() => { if (viewModelo) { usarModelo(viewModelo); setViewModelo(null) } }} className="gap-1">
              <Copy size={14} /> Usar Modelo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────── DIALOG LISTA ─────── */}
      <Dialog open={listaDialogOpen} onOpenChange={setListaDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{editLista ? "Editar Lista" : "Nova Lista"}</DialogTitle>
            <DialogDescription>{editLista ? "Edite os dados da lista e seus contatos" : "Crie uma nova lista de destinatários"}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nome da Lista</Label>
              <Input value={listaForm.nome} onChange={e => setListaForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: Newsletter Clientes" />
            </div>
            <div className="space-y-2">
              <Label>Descrição (opcional)</Label>
              <Textarea value={listaForm.descricao} onChange={e => setListaForm(p => ({ ...p, descricao: e.target.value }))} placeholder="Descrição da lista" className="min-h-[60px]" />
            </div>

            <Separator />

            <div>
              <Label>Contatos</Label>
              <div className="flex gap-2 mt-1 mb-2">
                <Input value={novoContato.nome} onChange={e => setNovoContato(p => ({ ...p, nome: e.target.value }))} placeholder="Nome" className="flex-1" />
                <Input value={novoContato.email} onChange={e => setNovoContato(p => ({ ...p, email: e.target.value }))} placeholder="Email" className="flex-[2]" />
                <Button variant="outline" size="sm" onClick={adicionarContato} className="gap-1 shrink-0">
                  {editContatoId ? <Pencil size={14} /> : <Plus size={14} />}
                  {editContatoId ? "Salvar" : "Adicionar"}
                </Button>
                {editContatoId && (
                  <Button variant="ghost" size="sm" onClick={cancelarEdicaoContato} className="shrink-0">
                    <X size={14} /> Cancelar
                  </Button>
                )}
              </div>

              {listaContatos.length === 0 ? (
                <p className="text-xs text-slate-400 py-4 text-center">Nenhum contato adicionado</p>
              ) : (
                <div className="max-h-48 overflow-y-auto border rounded-lg border-slate-200 dark:border-slate-700">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                        <th className="text-left font-medium p-2">Nome</th>
                        <th className="text-left font-medium p-2">Email</th>
                        <th className="w-10 p-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {listaContatos.map(c => (
                        <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="p-2">{c.nome}</td>
                          <td className="p-2 text-slate-500 break-all max-w-0">{c.email}</td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              <button onClick={() => editarContato(c)} className="text-blue-400 hover:text-blue-600"><Pencil size={14} /></button>
                              <button onClick={() => removerContato(c.id)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setListaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={salvarLista}>{editLista ? "Atualizar" : "Salvar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─────── DIALOG VER LISTA ─────── */}
      <Dialog open={!!viewLista} onOpenChange={() => setViewLista(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{viewLista?.nome}</DialogTitle>
            <DialogDescription>{viewLista?.descricao || "Sem descrição"} — {viewLista?.contatos?.length || 0} contato(s)</DialogDescription>
          </DialogHeader>
          {viewLista && viewLista.contatos && viewLista.contatos.length > 0 ? (
            <div className="max-h-64 overflow-y-auto border rounded-lg border-slate-200 dark:border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                    <th className="text-left font-medium p-2">Nome</th>
                    <th className="text-left font-medium p-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {viewLista.contatos.map(c => (
                    <tr key={c.id} className="border-b border-slate-100 dark:border-slate-800">
                      <td className="p-2">{c.nome}</td>
                      <td className="p-2 text-slate-500">{c.email}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-400 py-4 text-center">Nenhum contato nesta lista</p>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewLista(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(getContentHtml()) }} />
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
            <DialogDescription>Digite a URL da imagem</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3">
            <Input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="https://exemplo.com/imagem.jpg" />
            {imageUrl && (
              <div className="border rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800 p-2">
                <img src={imageUrl} alt="Preview" className="max-h-40 mx-auto"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImageDialogOpen(false)}>Cancelar</Button>
            <Button onClick={confirmImage} disabled={!imageUrl}>Inserir</Button>
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
              ].map(c => (
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
    </div>
  )
}
