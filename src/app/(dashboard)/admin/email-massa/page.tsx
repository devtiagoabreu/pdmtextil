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
  ImageIcon, Type, Strikethrough, ListOrdered, Palette, GripVertical,
  RefreshCw, CheckCircle2, XCircle, Clock, Search,
  BarChart3, TrendingUp, MousePointerClick, Upload, Database,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import ImportarContatosEmail from "@/components/importar/ImportarContatosEmail"
import ImportarApiModal from "@/components/integracao/ImportarApiModal"
import { exportPDFRelatorio } from "@/lib/export-utils"
import { getInfoContent } from "@/lib/info-content"
import { Separator } from "@/components/ui/separator"

interface Modelo {
  id: number
  nome: string
  assunto: string
  html: string
  createdAt: string
  updatedAt: string
}

interface Lista {
  id: number
  nome: string
  descricao: string | null
  totalContatos: number
  createdAt: string
  updatedAt: string
}

interface ListaComContatos extends Lista {
  contatos: Contato[]
}

interface Contato {
  id: number
  listaId: number
  nome: string
  email: string
}

interface Envio {
  id: number
  email: string
  nome: string | null
  assunto: string
  status: string
  error: string | null
  abertoEm: string | null
  createdAt: string
  totalCliques: number
}

interface HistoricoData {
  envios: Envio[]
  stats: {
    total: number
    enviados: number
    lidos: number
    falhas: number
    totalCliques: number
  }
}

const FONT_SIZES = [
  { label: "Pequeno", value: "1" },
  { label: "Normal", value: "3" },
  { label: "Grande", value: "4" },
  { label: "M. Grande", value: "5" },
  { label: "Enorme", value: "6" },
]

const FONT_FAMILIES = ["Arial", "Times New Roman", "Courier New", "Georgia", "Verdana", "Tahoma", "Trebuchet MS"]

const HEADING_OPTIONS = [
  { label: "Parágrafo", cmd: "formatBlock", val: "<p>" },
  { label: "Título 1", cmd: "formatBlock", val: "<h1>" },
  { label: "Título 2", cmd: "formatBlock", val: "<h2>" },
  { label: "Título 3", cmd: "formatBlock", val: "<h3>" },
]

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

function DashboardRelatorio() {
  const [remessas, setRemessas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/email-massa/relatorio")
      if (!res.ok) throw new Error("Erro ao carregar")
      const data = await res.json()
      setRemessas(data.remessas || [])
    } catch { /* empty */ }
    setLoading(false)
  }, [])

  useEffect(() => { carregar() }, [carregar])

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-12 bg-white dark:bg-slate-900 flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    )
  }

  if (remessas.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-12 bg-white dark:bg-slate-900 text-center">
        <BarChart3 size={40} className="mx-auto mb-3 text-slate-300" />
        <p className="text-slate-500">Nenhuma remessa encontrada. Envie emails para começar a gerar relatórios.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {remessas.map((r, idx) => {
        const total = Number(r.total)
        const lidos = Number(r.lidos)
        const naoLidos = total - lidos
        const clicados = Number(r.clicados)
        const totalCliques = Number(r.totalCliques)
        const naoClicaram = lidos - clicados
        const percLidos = total > 0 ? Math.round((lidos / total) * 100) : 0
        const percClicados = lidos > 0 ? Math.round((clicados / lidos) * 100) : 0

        return (
          <div key={r.remessaId} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                    Remessa #{remessas.length - idx}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {r.createdAt ? new Date(r.createdAt).toLocaleString("pt-BR") : ""}
                    {r.assunto ? <> &middot; {r.assunto}</> : null}
                  </p>
                </div>
                <span className="text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1 rounded-full font-medium">
                  {total} enviado{total !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Enviados</div>
                  <div className="text-lg font-bold text-slate-900 dark:text-slate-50">{total}</div>
                  <div className="text-xs text-slate-400">{Number(r.falhas)} falha{Number(r.falhas) !== 1 ? "s" : ""}</div>
                </div>
                <div className="bg-green-50 dark:bg-green-900/10 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Abertos</div>
                  <div className="text-lg font-bold text-green-700 dark:text-green-400">{lidos}</div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 mt-1">
                    <div className="bg-green-500 h-1.5 rounded-full" style={{ width: `${percLidos}%` }} />
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">{percLidos}% de abertura</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
                  <div className="text-xs text-slate-400 mb-1">Não abertos</div>
                  <div className="text-lg font-bold text-slate-500">{naoLidos}</div>
                  <div className="text-xs text-slate-400">{naoLidos > 0 ? `${Math.round((naoLidos / total) * 100)}%` : "—"}</div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <div className="flex items-center gap-1 text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  <MousePointerClick size={14} />
                  Cliques em Links
                </div>

                {(r.links && r.links.length > 0) ? (
                  <div className="space-y-2">
                    {r.links.map((link: any, li: number) => {
                      const linkTotal = Number(link.total)
                      const percLink = totalCliques > 0 ? Math.round((linkTotal / totalCliques) * 100) : 0
                      let label = link.urlOriginal
                      try { label = new URL(link.urlOriginal).hostname } catch { /* keep original */ }
                      return (
                        <div key={li} className="flex items-center gap-3">
                          <span className="text-xs text-slate-500 w-24 truncate text-right flex-shrink-0">{label}</span>
                          <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${percLink}%` }} />
                          </div>
                          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 w-8 text-right flex-shrink-0">{linkTotal}</span>
                        </div>
                      )
                    })}
                    {naoClicaram > 0 && (
                      <div className="flex items-center gap-3 opacity-60">
                        <span className="text-xs text-slate-400 w-24 text-right flex-shrink-0">Não clicaram</span>
                        <div className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                          <div className="bg-slate-300 dark:bg-slate-600 h-2 rounded-full" style={{ width: `${lidos > 0 ? Math.round((naoClicaram / lidos) * 100) : 0}%` }} />
                        </div>
                        <span className="text-xs font-medium text-slate-400 w-8 text-right flex-shrink-0">{naoClicaram}</span>
                      </div>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {clicados} {clicados === 1 ? "pessoa clicou" : "pessoas clicaram"} em link{clicados !== 1 ? "s" : ""} &middot; {totalCliques} clique{totalCliques !== 1 ? "s" : ""} no total
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400 italic">Nenhum clique registrado nesta remessa.</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function EmailMassaPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const editorRef = useRef<HTMLDivElement>(null)
  const [assunto, setAssunto] = useState("")
  const [para, setPara] = useState("todos")
  const [modoEnvio, setModoEnvio] = useState("bcc")
  const [selectedListaIds, setSelectedListaIds] = useState<number[]>([])
  const [sending, setSending] = useState(false)
  const [preview, setPreview] = useState(false)
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
  const [viewLista, setViewLista] = useState<ListaComContatos | null>(null)
  const [loadingListas, setLoadingListas] = useState(false)
  const [selectedListaImportId, setSelectedListaImportId] = useState(0)
  const [selectedListaImportNome, setSelectedListaImportNome] = useState("")
  const [showApiImport, setShowApiImport] = useState(false)

  const [linkDialogOpen, setLinkDialogOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState("https://")

  const [imageDialogOpen, setImageDialogOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState("")

  const [colorDialogOpen, setColorDialogOpen] = useState(false)
  const [colorMode, setColorMode] = useState<"fore" | "back">("fore")
  const [colorValue, setColorValue] = useState("#000000")

  const [historico, setHistorico] = useState<HistoricoData | null>(null)
  const [loadingHistorico, setLoadingHistorico] = useState(false)
  const [historicoSearch, setHistoricoSearch] = useState("")

  const [remetente, setRemetente] = useState("sistema")
  const [userEmailConfig, setUserEmailConfig] = useState<{ email: string } | null>(null)

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    if (editorRef.current) editorRef.current.focus()
  }, [])

  const insertHeading = useCallback((val: string) => {
    document.execCommand("formatBlock", false, val)
    if (editorRef.current) editorRef.current.focus()
  }, [])

  const insertLinkHandler = useCallback(() => {
    const sel = window.getSelection()
    const text = sel?.toString() || ""
    if (text) {
      setLinkUrl("https://")
      setLinkDialogOpen(true)
    } else {
      setLinkUrl("https://")
      setLinkDialogOpen(true)
    }
  }, [])

  const confirmLink = useCallback(() => {
    if (linkUrl) {
      exec("createLink", linkUrl)
      setLinkDialogOpen(false)
    }
  }, [linkUrl, exec])

  const insertImageHandler = useCallback(() => {
    setImageUrl("")
    setImageDialogOpen(true)
  }, [])

  const confirmImage = useCallback(() => {
    if (imageUrl) {
      exec("insertImage", imageUrl)
      setImageDialogOpen(false)
      setImageUrl("")
    }
  }, [imageUrl, exec])

  const openColorPicker = useCallback((mode: "fore" | "back") => {
    setColorMode(mode)
    setColorDialogOpen(true)
  }, [])

  const applyColor = useCallback(() => {
    exec(colorMode === "fore" ? "foreColor" : "hiliteColor", colorValue)
    setColorDialogOpen(false)
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
    if (activeTab === "historico") carregarHistorico()
  }, [activeTab, carregarHistorico])

  const usarModelo = (m: Modelo) => {
    setAssunto(m.assunto)
    setActiveTab("enviar")
    setTimeout(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = m.html
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
    setModeloForm({ nome: "", assunto: "", html: getContentHtml() })
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
    setListaContatos(prev => [...prev, { ...novoContato, id: Date.now(), listaId: editLista?.id || 0 }])
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
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Email em Massa{info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Envie emails, gerencie modelos e listas, acompanhe o histórico</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-1 bg-white dark:bg-slate-900">
          <TabsList className="w-full justify-center gap-1 bg-transparent">
            <TabsTrigger value="enviar" className="gap-1.5"><Send size={14} />Enviar Email</TabsTrigger>
            <TabsTrigger value="modelos" className="gap-1.5"><FileText size={14} />Modelos</TabsTrigger>
            <TabsTrigger value="listas" className="gap-1.5"><Users size={14} />Listas</TabsTrigger>
            <TabsTrigger value="historico" className="gap-1.5"><Clock size={14} />Histórico</TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-1.5"><BarChart3 size={14} />Dashboard</TabsTrigger>
          </TabsList>
        </div>

        {/* ────────── TAB ENVIAR ────────── */}
        <TabsContent value="enviar" className="space-y-4 mt-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Enviar para</Label>
                <select value={para} onChange={e => setPara(e.target.value)}
                  className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                  <option value="todos">Clientes + Usuários do Sistema</option>
                  <option value="clientes">Apenas Clientes</option>
                  <option value="usuarios">Apenas Usuários do Sistema</option>
                  <option value="lista">Lista de Destinatários</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label>Assunto</Label>
                <Input value={assunto} onChange={e => setAssunto(e.target.value)} placeholder="Assunto do email" />
              </div>
            </div>

            {para === "lista" && (
              <div className="space-y-2">
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

            <div className="space-y-2">
              <Label>Modo de Envio</Label>
              <div className="flex flex-wrap gap-4">
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
                  <span className="text-sm">Individual (<code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">[NOME]</code> substituído)</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Remetente</Label>
              <div className="flex flex-wrap gap-4">
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
                    {userEmailConfig
                      ? `Meu Email (${userEmailConfig.email})`
                      : "Meu Email (configure em Meu Perfil)"}
                  </span>
                </label>
              </div>
              {!userEmailConfig && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Nenhuma configuração pessoal encontrada. Vá em <strong>Meu Perfil</strong> para configurar seu SMTP.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conteúdo do Email</Label>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={abrirNovoModelo} className="gap-1">
                    <FileText size={14} /> Salvar como Modelo
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setPreview(!preview)} className="gap-1">
                    <Eye size={14} /> {preview ? "Editar" : "Preview"}
                  </Button>
                </div>
              </div>

              {!preview ? (
                <div className="border rounded-lg border-slate-300 dark:border-slate-600 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-0.5 p-1.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    {/* Headings */}
                    <div className="flex items-center gap-0.5 px-1 border-r border-slate-200 dark:border-slate-700">
                      {HEADING_OPTIONS.map(opt => (
                        <button key={opt.val} type="button" onClick={() => insertHeading(opt.val)}
                          className="px-2 py-1 text-xs rounded hover:bg-slate-200 dark:hover:bg-slate-700 font-medium"
                          title={opt.label}>
                          {opt.label === "Parágrafo" ? "P" : opt.label.split(" ")[1]}
                        </button>
                      ))}
                    </div>

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
                      <button type="button" onClick={() => exec("insertUnorderedList")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Lista Marcadores"><List size={15} /></button>
                      <button type="button" onClick={() => exec("insertOrderedList")} className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700" title="Lista Numerada"><ListOrdered size={15} /></button>
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
                    className="w-full min-h-[280px] p-4 bg-white dark:bg-slate-700 focus:outline-none overflow-y-auto"
                    style={{ fontFamily: "Arial, sans-serif", lineHeight: "1.6" }}
                    data-placeholder="Escreva o conteúdo do email aqui..."
                  />
                </div>
              ) : (
                <div className="w-full min-h-[280px] p-4 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 overflow-y-auto">
                  <div className="bg-white text-black" style={{ fontFamily: "Arial, sans-serif", lineHeight: "1.6" }}>
                    <div dangerouslySetInnerHTML={{ __html: getContentHtml() }} />
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
              {modelos.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs text-slate-400 mr-1">Modelos:</span>
                  {modelos.map(m => (
                    <button key={m.id} type="button" onClick={() => usarModelo(m)}
                      className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 whitespace-nowrap">
                      <Copy size={10} className="inline mr-0.5" />{m.nome}
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
        </TabsContent>

        {/* ────────── TAB MODELOS ────────── */}
        <TabsContent value="modelos" className="space-y-4 mt-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
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
        </TabsContent>

        {/* ────────── TAB LISTAS ────────── */}
        <TabsContent value="listas" className="space-y-4 mt-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Listas de Destinatários</h2>
              <div className="flex gap-2">
                {listas.length > 0 && (
                  <>
                    <div className="flex items-center gap-1">
                      <select
                        value={selectedListaImportId || ""}
                        onChange={e => {
                          const id = Number(e.target.value)
                          const l = listas.find(x => x.id === id)
                          setSelectedListaImportId(id)
                          setSelectedListaImportNome(l?.nome || "")
                        }}
                        className="text-sm p-1.5 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                      >
                        <option value="">Selecionar lista...</option>
                        {listas.map(l => (
                          <option key={l.id} value={l.id}>{l.nome}</option>
                        ))}
                      </select>
                      {selectedListaImportId ? (
                        <ImportarContatosEmail
                          listaId={selectedListaImportId}
                          listaNome={selectedListaImportNome}
                          onImportado={() => { carregarListas(); setSelectedListaImportId(0) }}
                        />
                      ) : (
                        <Button variant="outline" size="sm" disabled className="gap-1 opacity-50">
                          <Upload size={14} /> Importar
                        </Button>
                      )}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setShowApiImport(true)} className="gap-1">
                      <Database size={14} /> Importar via API
                    </Button>
                  </>
                )}
                <Button onClick={abrirNovaLista} className="gap-1"><Plus size={14} /> Nova Lista</Button>
              </div>
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

          {showApiImport && (
            <ImportarApiModal
              tela="email-listas"
              existingRecords={[]}
              existingKey="email"
              onImportado={() => { setShowApiImport(false); carregarListas() }}
              onClose={() => setShowApiImport(false)}
              extraImportParams={{ listaId: selectedListaImportId || undefined }}
            />
          )}
        </TabsContent>

        {/* ────────── TAB DASHBOARD ────────── */}
        <TabsContent value="dashboard" className="space-y-4 mt-4">
          <DashboardRelatorio />
        </TabsContent>

        {/* ────────── TAB HISTÓRICO ────────── */}
        <TabsContent value="historico" className="space-y-4 mt-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 bg-white dark:bg-slate-900">
            <div className="flex items-center justify-between mb-4">
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
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
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

                <div className="relative mb-4">
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
              </>
            ) : (
              <p className="text-sm text-slate-400 py-8 text-center">Nenhum envio registrado ainda.</p>
            )}
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
              <div dangerouslySetInnerHTML={{ __html: viewModelo.html }} />
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
        <DialogContent className="max-w-2xl">
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
                <Button variant="outline" size="sm" onClick={adicionarContato} className="gap-1 shrink-0"><Plus size={14} />Adicionar</Button>
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
                          <td className="p-2 text-slate-500">{c.email}</td>
                          <td className="p-2">
                            <button onClick={() => removerContato(c.id)} className="text-red-400 hover:text-red-600"><X size={14} /></button>
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
