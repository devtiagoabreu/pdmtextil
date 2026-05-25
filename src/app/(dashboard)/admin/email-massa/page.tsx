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
  Link, List, Eye, Plus, Pencil, Trash2, FileText, Users, Copy, X,
} from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
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

  const exec = useCallback((cmd: string, val?: string) => {
    document.execCommand(cmd, false, val)
    if (editorRef.current) editorRef.current.focus()
  }, [])

  const insertLink = useCallback(() => {
    const url = prompt("URL do link:", "https://")
    if (url) exec("createLink", url)
  }, [exec])

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
      const body: any = { para, assunto, html, modo_envio: modoEnvio }
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

  useEffect(() => { carregarModelos(); carregarListas() }, [carregarModelos, carregarListas])

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Email em Massa{info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 mt-1">Envie emails, gerencie modelos e listas de destinatários</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="enviar" className="gap-1.5"><Send size={14} />Enviar Email</TabsTrigger>
          <TabsTrigger value="modelos" className="gap-1.5"><FileText size={14} />Modelos</TabsTrigger>
          <TabsTrigger value="listas" className="gap-1.5"><Users size={14} />Listas</TabsTrigger>
        </TabsList>

        {/* ────────── TAB ENVIAR ────────── */}
        <TabsContent value="enviar" className="space-y-4 mt-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
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
                  <span className="text-sm">Todos em Cópia Oculta (BCC)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="modo_envio" value="to" checked={modoEnvio === "to"}
                    onChange={e => setModoEnvio(e.target.value)} className="text-blue-600" />
                  <span className="text-sm">Todos no Para (TO)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="modo_envio" value="individual" checked={modoEnvio === "individual"}
                    onChange={e => setModoEnvio(e.target.value)} className="text-blue-600" />
                  <span className="text-sm">Individual (um email por contato, substitui <code className="bg-slate-100 dark:bg-slate-700 px-1 rounded text-xs">[NOME]</code>)</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Assunto</Label>
              <div className="flex gap-2">
                <Input value={assunto} onChange={e => setAssunto(e.target.value)} placeholder="Assunto do email" className="flex-1" />
                <Button variant="outline" size="sm" onClick={abrirNovoModelo} className="gap-1 whitespace-nowrap">
                  <FileText size={14} /> Salvar como Modelo
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Conteúdo</Label>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setPreview(!preview)} className="gap-1">
                    <Eye size={14} /> {preview ? "Editar" : "Preview"}
                  </Button>
                </div>
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

            <div className="flex items-center justify-between pt-2">
              {modelos.length > 0 && (
                <div className="flex gap-1">
                  <span className="text-xs text-slate-400 self-center mr-1">Modelos:</span>
                  <div className="flex gap-1 flex-wrap max-w-md">
                    {modelos.map(m => (
                      <button key={m.id} type="button" onClick={() => usarModelo(m)}
                        className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 whitespace-nowrap">
                        <Copy size={10} className="inline mr-0.5" />{m.nome}
                      </button>
                    ))}
                  </div>
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
              <p className="text-sm text-slate-400 py-8 text-center">Nenhum modelo cadastrado. Clique em "Novo Modelo" para criar.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left font-medium p-2">Nome</th>
                      <th className="text-left font-medium p-2">Assunto</th>
                      <th className="text-right font-medium p-2 w-48">Ações</th>
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
                              <Pencil size={12} /> Editar
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
              <Button onClick={abrirNovaLista} className="gap-1"><Plus size={14} /> Nova Lista</Button>
            </div>

            {loadingListas ? (
              <p className="text-sm text-slate-400 py-8 text-center">Carregando...</p>
            ) : listas.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">Nenhuma lista cadastrada. Clique em "Nova Lista" para criar.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left font-medium p-2">Nome</th>
                      <th className="text-left font-medium p-2">Descrição</th>
                      <th className="text-center font-medium p-2 w-24">Contatos</th>
                      <th className="text-right font-medium p-2 w-40">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listas.map(l => (
                      <tr key={l.id} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-2 font-medium">{l.nome}</td>
                        <td className="p-2 text-slate-500 truncate max-w-xs">{l.descricao || "—"}</td>
                        <td className="p-2 text-center"><span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full">{l.totalContatos}</span></td>
                        <td className="p-2 text-right whitespace-nowrap">
                          <div className="flex gap-1 justify-end">
                            <Button variant="ghost" size="xs" onClick={() => abrirEditarLista(l)} className="gap-1">
                              <Pencil size={12} /> Editar
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => abrirVerLista(l)} className="gap-1">
                              <Eye size={12} />
                            </Button>
                            <Button variant="ghost" size="xs" onClick={() => deletarLista(l.id)} className="gap-1 text-red-500 hover:text-red-700">
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
                <Button variant="outline" size="sm" onClick={adicionarContato} className="gap-1"><Plus size={14} />Adicionar</Button>
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
    </div>
  )
}
