"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Edit3, Building2, Check, X, ArrowLeft, Globe } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

interface Empresa {
  id: number
  nome: string
  documento?: string
  endereco?: string
  cidade?: string
  uf?: string
  telefone?: string
  email?: string
  logoUrl?: string
  isDefault: boolean
}

export default function EmpresaPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [lista, setLista] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Empresa | null>(null)
  const [saving, setSaving] = useState(false)

  const [nome, setNome] = useState("")
  const [documento, setDocumento] = useState("")
  const [endereco, setEndereco] = useState("")
  const [cidade, setCidade] = useState("")
  const [uf, setUf] = useState("")
  const [telefone, setTelefone] = useState("")
  const [email, setEmail] = useState("")
  const [logoUrl, setLogoUrl] = useState("")
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => {
    fetch("/api/admin/config/empresa")
      .then(res => res.json())
      .then(setLista)
      .catch(() => toast.error("Erro ao carregar empresas"))
      .finally(() => setLoading(false))
  }, [])

  function resetForm() {
    setNome(""); setDocumento(""); setEndereco(""); setCidade(""); setUf("")
    setTelefone(""); setEmail(""); setLogoUrl(""); setIsDefault(false)
    setEditItem(null); setShowForm(false)
  }

  function openEdit(item: Empresa) {
    setEditItem(item)
    setNome(item.nome); setDocumento(item.documento || "")
    setEndereco(item.endereco || ""); setCidade(item.cidade || "")
    setUf(item.uf || ""); setTelefone(item.telefone || "")
    setEmail(item.email || ""); setLogoUrl(item.logoUrl || "")
    setIsDefault(item.isDefault)
    setShowForm(true)
  }

  async function handleSave() {
    if (!nome) { toast.error("Nome é obrigatório"); return }
    setSaving(true)
    try {
      const body = { nome, documento, endereco, cidade, uf, telefone, email, logoUrl, isDefault }
      const method = editItem ? "PUT" : "POST"
      const res = await fetch("/api/admin/config/empresa", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem ? { id: editItem.id, ...body } : body),
      })
      if (!res.ok) throw new Error()
      if (editItem) {
        setLista(prev => prev.map(i => i.id === editItem.id ? { ...i, ...body } : i))
        toast.success("Empresa atualizada!")
      } else {
        const item = await res.json()
        setLista(prev => [...prev, item])
        toast.success("Empresa adicionada!")
      }
      resetForm()
    } catch {
      toast.error(editItem ? "Erro ao atualizar" : "Erro ao adicionar")
    } finally { setSaving(false) }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remover esta empresa?")) return
    try {
      const res = await fetch("/api/admin/config/empresa", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setLista(prev => prev.filter(c => c.id !== id))
      toast.success("Empresa removida")
    } catch { toast.error("Erro ao remover") }
  }

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" size={24} /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/configuracoes" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><ArrowLeft size={20} /></Link>
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Empresas{info && <InfoButton content={info} />}</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Configure as empresas do sistema (logo, dados) para relatórios e exportações</p>
        </div>
      </div>

      <div className="grid gap-4">
        {lista.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
            <Building2 size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Nenhuma empresa cadastrada</p>
          </div>
        ) : (
          lista.map(item => (
            <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className="shrink-0 inline-flex p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600">
                    <Building2 size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.nome}</h3>
                      {item.isDefault && <span className="text-[11px] px-1.5 py-0.5 rounded bg-green-100 text-green-700 font-medium">Padrão</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                      {item.documento && <p>CNPJ: {item.documento}</p>}
                      {item.cidade && item.uf && <p>{item.cidade}/{item.uf}</p>}
                      {item.logoUrl && <p className="truncate max-w-md">Logo: {item.logoUrl}</p>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(item)}><Edit3 size={14} /></Button>
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDelete(item.id)}><Trash2 size={14} /></Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold">{editItem ? "Editar Empresa" : "Nova Empresa"}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Nome *</Label><Input value={nome} onChange={e => setNome(e.target.value)} /></div>
            <div className="space-y-2"><Label>CNPJ</Label><Input value={documento} onChange={e => setDocumento(e.target.value)} /></div>
            <div className="space-y-2"><Label>Endereço</Label><Input value={endereco} onChange={e => setEndereco(e.target.value)} /></div>
            <div className="space-y-2"><Label>Cidade</Label><Input value={cidade} onChange={e => setCidade(e.target.value)} /></div>
            <div className="space-y-2"><Label>UF</Label><Input value={uf} onChange={e => setUf(e.target.value)} maxLength={2} /></div>
            <div className="space-y-2"><Label>Telefone</Label><Input value={telefone} onChange={e => setTelefone(e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input value={email} onChange={e => setEmail(e.target.value)} type="email" /></div>
            <div className="space-y-2"><Label>Logo URL</Label><Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://drive.google.com/..." /></div>
          </div>
          {logoUrl && (
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg p-3 flex items-center gap-3">
              <Globe size={16} className="text-slate-400" />
              <img src={logoUrl} alt="Preview" className="h-10 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = "none" }} />
              <span className="text-xs text-slate-400">Preview do logo</span>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isDefault} onChange={e => setIsDefault(e.target.checked)} className="rounded" />
            Empresa padrão (usada nas exportações PDF)
          </label>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving && <Loader2 size={16} className="animate-spin" />}
              {editItem ? "Salvar" : "Adicionar"}
            </Button>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
          </div>
        </div>
      )}

      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="gap-2"><Plus size={16} /> Nova Empresa</Button>
      )}
    </div>
  )
}
