"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Edit3, Globe, Check, X, ArrowLeft, Zap, Key, Eye, EyeOff } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

type TipoAuth = "oauth2" | "basic" | "api_key" | "bearer"

interface Integracao {
  id: number
  nome: string
  baseUrl: string
  tipoAuth: TipoAuth
  authConfig: Record<string, unknown>
  ativo: boolean
}

const TIPO_AUTH_LABEL: Record<TipoAuth, string> = {
  oauth2: "OAuth2",
  basic: "Basic Auth",
  api_key: "API Key",
  bearer: "Bearer Token",
}

const TIPO_AUTH_ICON: Record<TipoAuth, string> = {
  oauth2: "text-purple-600 bg-purple-50 dark:bg-purple-950/50",
  basic: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
  api_key: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
  bearer: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
}

export default function IntegracoesPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [lista, setLista] = useState<Integracao[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Integracao | null>(null)
  const [nome, setNome] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [tipoAuth, setTipoAuth] = useState<TipoAuth>("bearer")
  const [authConfigJson, setAuthConfigJson] = useState("{}")
  const [showJson, setShowJson] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch("/api/admin/integracoes")
      .then(res => res.json())
      .then(setLista)
      .catch(() => toast.error("Erro ao carregar integrações"))
      .finally(() => setLoading(false))
  }, [])

  function resetForm() {
    setNome("")
    setBaseUrl("")
    setTipoAuth("bearer")
    setAuthConfigJson("{}")
    setShowJson(false)
    setEditItem(null)
    setShowForm(false)
  }

  function openEdit(item: Integracao) {
    setEditItem(item)
    setNome(item.nome)
    setBaseUrl(item.baseUrl)
    setTipoAuth(item.tipoAuth)
    setAuthConfigJson(JSON.stringify(item.authConfig, null, 2))
    setShowForm(true)
  }

  function getAuthPlaceholder(tipo: TipoAuth): string {
    const examples: Record<TipoAuth, string> = {
      oauth2: JSON.stringify({ grant_type: "client_credentials", client_id: "xxx", client_secret: "xxx", token_url: "https://...", scope: "read" }, null, 2),
      basic: JSON.stringify({ username: "admin", password: "123456" }, null, 2),
      api_key: JSON.stringify({ key: "abc123", key_name: "x-api-key", in: "header" }, null, 2),
      bearer: JSON.stringify({ token: "abc123xyz" }, null, 2),
    }
    return examples[tipo]
  }

  async function handleSave() {
    if (!nome || !baseUrl) {
      toast.error("Nome e Base URL são obrigatórios")
      return
    }

    let parsedAuth: Record<string, unknown> = {}
    try {
      parsedAuth = JSON.parse(authConfigJson)
    } catch {
      toast.error("JSON de autenticação inválido")
      return
    }

    setSaving(true)
    try {
      const body = { nome, baseUrl, tipoAuth, authConfig: parsedAuth }
      const method = editItem ? "PUT" : "POST"
      const res = await fetch("/api/admin/integracoes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem ? { id: editItem.id, ...body } : body),
      })
      if (!res.ok) throw new Error()

      if (editItem) {
        setLista(prev => prev.map(i => i.id === editItem.id ? { ...i, ...body } : i))
        toast.success("Integração atualizada!")
      } else {
        const item = await res.json()
        setLista(prev => [...prev, item])
        toast.success("Integração adicionada!")
      }
      resetForm()
    } catch {
      toast.error(editItem ? "Erro ao atualizar" : "Erro ao adicionar")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(item: Integracao) {
    try {
      const res = await fetch("/api/admin/integracoes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, ativo: !item.ativo }),
      })
      if (!res.ok) throw new Error()
      setLista(prev => prev.map(i => i.id === item.id ? { ...i, ativo: !i.ativo } : i))
      toast.success(item.ativo ? "Integração desativada" : "Integração ativada")
    } catch {
      toast.error("Erro ao alterar status")
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remover esta integração?")) return
    try {
      const res = await fetch("/api/admin/integracoes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setLista(prev => prev.filter(c => c.id !== id))
      toast.success("Integração removida")
    } catch {
      toast.error("Erro ao remover integração")
    }
  }

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/configuracoes" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Zap className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Integrações{info && <InfoButton content={info} />}</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Gerencie as conexões com sistemas externos (ERP, API, WMS)</p>
        </div>
      </div>

      <div className="grid gap-4">
        {lista.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
            <Globe size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Nenhuma integração cadastrada</p>
          </div>
        ) : (
          lista.map(item => (
            <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  <div className={`shrink-0 inline-flex p-2.5 rounded-lg ${TIPO_AUTH_ICON[item.tipoAuth]}`}>
                    <Key size={18} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.nome}</h3>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                        {TIPO_AUTH_LABEL[item.tipoAuth]}
                      </span>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${item.ativo ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                        {item.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 font-mono truncate mt-1">{item.baseUrl}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(item)} className="gap-1">
                    <Edit3 size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleToggle(item)} className="gap-1">
                    {item.ativo ? <X size={14} className="text-amber-500" /> : <Check size={14} className="text-green-500" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => handleDelete(item.id)} className="gap-1 text-red-500">
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold">{editItem ? "Editar Integração" : "Nova Integração"}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: ERP Systêxtil" />
            </div>
            <div className="space-y-2">
              <Label>Base URL *</Label>
              <Input value={baseUrl} onChange={e => setBaseUrl(e.target.value)} placeholder="https://api.sistema.com" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Tipo de Autenticação</Label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(TIPO_AUTH_LABEL) as TipoAuth[]).map(tipo => (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => { setTipoAuth(tipo); setAuthConfigJson(getAuthPlaceholder(tipo)) }}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    tipoAuth === tipo
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  }`}
                >
                  {TIPO_AUTH_LABEL[tipo]}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Configuração de Autenticação (JSON)</Label>
              <button
                type="button"
                onClick={() => setShowJson(!showJson)}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                {showJson ? <EyeOff size={12} /> : <Eye size={12} />}
                {showJson ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {showJson && (
              <p className="text-xs text-slate-400">
                Exemplo: {getAuthPlaceholder(tipoAuth)}
              </p>
            )}
            <textarea
              value={authConfigJson}
              onChange={e => setAuthConfigJson(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 px-3 py-2 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
              placeholder='{}'
            />
          </div>

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
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus size={16} /> Nova Integração
        </Button>
      )}
    </div>
  )
}
