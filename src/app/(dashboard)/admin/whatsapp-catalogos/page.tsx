"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Loader2, Plus, Pencil, Trash2, ExternalLink, Package, Layers, ChevronDown, ChevronRight } from "lucide-react"

interface Linha {
  id: number
  numero: number
  nome: string
  ativo: boolean
}

interface Catalogo {
  id: number
  linhaNumero: number
  linhaNome: string
  titulo: string
  linkUrl: string
  descricao: string | null
  ativo: boolean
  createdAt: string
}

export default function WhatsAppCatalogosPage() {
  const [linhas, setLinhas] = useState<Linha[]>([])
  const [catalogos, setCatalogos] = useState<Catalogo[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editId, setEditId] = useState<number | null>(null)

  const [linhaNumero, setLinhaNumero] = useState(1)
  const [titulo, setTitulo] = useState("")
  const [linkUrl, setLinkUrl] = useState("")
  const [descricao, setDescricao] = useState("")
  const [showForm, setShowForm] = useState(false)

  const [showLinhas, setShowLinhas] = useState(false)
  const [linhaEditId, setLinhaEditId] = useState<number | null>(null)
  const [linhaNumeroInput, setLinhaNumeroInput] = useState("")
  const [linhaNomeInput, setLinhaNomeInput] = useState("")
  const [savingLinha, setSavingLinha] = useState(false)

  const fetchLinhas = async () => {
    try {
      const res = await fetch("/api/admin/whatsapp-linhas")
      if (res.ok) setLinhas(await res.json())
    } catch {
      toast.error("Erro ao carregar linhas")
    }
  }

  const fetchCatalogos = async () => {
    try {
      const res = await fetch("/api/admin/whatsapp-catalogos")
      if (res.ok) setCatalogos(await res.json())
    } catch {
      toast.error("Erro ao carregar catalogos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.all([fetchLinhas(), fetchCatalogos()])
  }, [])

  const resetForm = () => {
    setLinhaNumero(1)
    setTitulo("")
    setLinkUrl("")
    setDescricao("")
    setEditId(null)
    setShowForm(false)
  }

  const handleEdit = (c: Catalogo) => {
    setLinhaNumero(c.linhaNumero)
    setTitulo(c.titulo)
    setLinkUrl(c.linkUrl)
    setDescricao(c.descricao || "")
    setEditId(c.id)
    setShowForm(true)
  }

  const handleSave = async () => {
    if (!titulo || !linkUrl) {
      toast.error("Preencha titulo e link")
      return
    }
    setSaving(true)
    try {
      const linha = linhas.find(l => l.numero === linhaNumero)
      const payload = {
        ...(editId ? { id: editId } : {}),
        linhaNumero,
        linhaNome: linha?.nome || "",
        titulo,
        linkUrl,
        descricao: descricao || null,
      }
      const method = editId ? "PUT" : "POST"
      const res = await fetch("/api/admin/whatsapp-catalogos", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
      toast.success(editId ? "Catalogo atualizado!" : "Catalogo criado!")
      resetForm()
      fetchCatalogos()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number, titulo: string) => {
    if (!confirm(`Excluir catalogo "${titulo}"?`)) return
    try {
      const res = await fetch(`/api/admin/whatsapp-catalogos?id=${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast.success("Catalogo excluido!")
      fetchCatalogos()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleToggleAtivo = async (c: Catalogo) => {
    try {
      await fetch("/api/admin/whatsapp-catalogos", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, ativo: !c.ativo }),
      })
      fetchCatalogos()
    } catch {
      toast.error("Erro ao alterar status")
    }
  }

  const resetLinhaForm = () => {
    setLinhaEditId(null)
    setLinhaNumeroInput("")
    setLinhaNomeInput("")
  }

  const handleSaveLinha = async () => {
    const numero = parseInt(linhaNumeroInput)
    if (!numero || !linhaNomeInput.trim()) {
      toast.error("Preencha numero e nome da linha")
      return
    }
    setSavingLinha(true)
    try {
      const payload: any = linhaEditId
        ? { id: linhaEditId, nome: linhaNomeInput.trim() }
        : { numero, nome: linhaNomeInput.trim() }
      const method = linhaEditId ? "PUT" : "POST"
      const res = await fetch("/api/admin/whatsapp-linhas", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar linha")
      }
      toast.success(linhaEditId ? "Linha atualizada!" : "Linha criada!")
      resetLinhaForm()
      fetchLinhas()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSavingLinha(false)
    }
  }

  const handleEditLinha = (l: Linha) => {
    setLinhaEditId(l.id)
    setLinhaNumeroInput(String(l.numero))
    setLinhaNomeInput(l.nome)
  }

  const handleDeleteLinha = async (l: Linha) => {
    if (!confirm(`Excluir linha "${l.nome}"?`)) return
    try {
      const res = await fetch(`/api/admin/whatsapp-linhas?id=${l.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao excluir")
      }
      toast.success("Linha excluida!")
      fetchLinhas()
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  const handleToggleLinhaAtivo = async (l: Linha) => {
    try {
      await fetch("/api/admin/whatsapp-linhas", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: l.id, ativo: !l.ativo }),
      })
      fetchLinhas()
    } catch {
      toast.error("Erro ao alterar status da linha")
    }
  }

  const linhasAtivas = linhas.filter(l => l.ativo)
  const grouped = linhas.map(l => ({
    ...l,
    items: catalogos.filter(c => c.linhaNumero === l.numero),
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Package className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Catalogos WhatsApp</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Gerenciar mostruarios enviados pelo bot de atendimento</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true) }} className="gap-2">
          <Plus size={16} /> Novo Catalogo
        </Button>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 space-y-4 bg-white dark:bg-slate-900">
          <h2 className="font-semibold">{editId ? "Editar Catalogo" : "Novo Catalogo"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Linha de Tecido *</Label>
              <select value={linhaNumero} onChange={e => setLinhaNumero(Number(e.target.value))}
                className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-sm">
                {linhasAtivas.map(l => <option key={l.numero} value={l.numero}>{l.numero} - {l.nome}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Titulo do Catalogo *</Label>
              <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: Catalogo Lencol 2026" />
            </div>
            <div className="space-y-2">
              <Label>Link (URL) *</Label>
              <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>Descricao (opcional)</Label>
              <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Descricao curta" />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editId ? "Atualizar" : "Criar"}
            </Button>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <button
          onClick={() => setShowLinhas(!showLinhas)}
          className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/30"
        >
          <Layers className="text-purple-600" size={18} />
          <span className="font-medium text-sm text-slate-700 dark:text-slate-300">Gerenciar Linhas de Tecido</span>
          <span className="text-xs text-slate-400 ml-1">({linhas.length})</span>
          <span className="ml-auto">
            {showLinhas ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
          </span>
        </button>

        {showLinhas && (
          <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Numero</Label>
                <Input
                  type="number"
                  min={1}
                  value={linhaNumeroInput}
                  onChange={e => setLinhaNumeroInput(e.target.value)}
                  placeholder="1"
                  disabled={!!linhaEditId}
                  className="h-8 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Nome</Label>
                <Input
                  value={linhaNomeInput}
                  onChange={e => setLinhaNomeInput(e.target.value)}
                  placeholder="Ex: Linha Lencol"
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-end gap-2">
                <Button size="sm" onClick={handleSaveLinha} disabled={savingLinha} className="gap-1">
                  {savingLinha && <Loader2 size={14} className="animate-spin" />}
                  {linhaEditId ? "Atualizar" : "Adicionar"}
                </Button>
                {linhaEditId && (
                  <Button size="sm" variant="outline" onClick={resetLinhaForm}>Cancelar</Button>
                )}
              </div>
            </div>

            {linhas.length === 0 ? (
              <p className="text-sm text-slate-400">Nenhuma linha cadastrada</p>
            ) : (
              <div className="divide-y dark:divide-slate-800">
                {linhas.map(l => (
                  <div key={l.id} className="flex items-center gap-3 py-2">
                    <button
                      onClick={() => handleToggleLinhaAtivo(l)}
                      className={`w-2 h-2 rounded-full shrink-0 ${l.ativo ? "bg-green-400" : "bg-slate-300"}`}
                      title={l.ativo ? "Ativo" : "Inativo"}
                    />
                    <span className="text-sm font-mono text-slate-500 w-6">{l.numero}</span>
                    <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">{l.nome}</span>
                    <Button variant="ghost" size="icon" onClick={() => handleEditLinha(l)} className="h-7 w-7">
                      <Pencil size={13} />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDeleteLinha(l)} className="h-7 w-7">
                      <Trash2 size={13} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
      ) : (
        <div className="space-y-4">
          {grouped.map(g => (
            <div key={g.id} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-medium text-sm text-slate-700 dark:text-slate-300">
                  {g.numero} - {g.nome}
                  <span className="ml-2 text-xs text-slate-400">({g.items.length})</span>
                </h3>
              </div>
              {g.items.length === 0 ? (
                <p className="px-4 py-3 text-sm text-slate-400">Nenhum catalogo cadastrado</p>
              ) : (
                <div className="divide-y dark:divide-slate-800">
                  {g.items.map(c => (
                    <div key={c.id} className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <button onClick={() => handleToggleAtivo(c)} className={`w-2 h-2 rounded-full shrink-0 ${c.ativo ? "bg-green-400" : "bg-slate-300"}`} title={c.ativo ? "Ativo" : "Inativo"} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">{c.titulo}</p>
                        {c.descricao && <p className="text-xs text-slate-400 truncate">{c.descricao}</p>}
                      </div>
                      <a href={c.linkUrl} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-700 shrink-0">
                        <ExternalLink size={14} />
                      </a>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="shrink-0"><Pencil size={14} /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id, c.titulo)} className="shrink-0"><Trash2 size={14} /></Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {linhas.length === 0 && !loading && (
            <div className="text-center py-8 text-slate-400 text-sm">
              Cadastre linhas de tecido acima para poder adicionar catalogos.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
