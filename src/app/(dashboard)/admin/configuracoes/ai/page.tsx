"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Edit3, ArrowLeft, Check, X, Eye, EyeOff, Bot, Play, Key, RefreshCw, ArrowUpDown } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const PROVEDORES: Record<string, { label: string; defaultModel: string; defaultUrl: string }> = {
  groq: { label: "Groq", defaultModel: "llama-3.3-70b-versatile", defaultUrl: "https://api.groq.com/openai/v1" },
  openai: { label: "OpenAI", defaultModel: "gpt-4o-mini", defaultUrl: "https://api.openai.com/v1" },
  anthropic: { label: "Anthropic (Claude)", defaultModel: "claude-3-5-sonnet-latest", defaultUrl: "https://api.anthropic.com/v1" },
  gemini: { label: "Google Gemini", defaultModel: "gemini-3.6-flash", defaultUrl: "https://generativelanguage.googleapis.com/v1beta" },
  deepseek: { label: "DeepSeek", defaultModel: "deepseek-chat", defaultUrl: "https://api.deepseek.com/v1" },
  openai_compatible: { label: "OpenAI CompatÃ­vel (URL custom)", defaultModel: "", defaultUrl: "" },
}

const PROVEDOR_COLORS: Record<string, string> = {
  groq: "text-red-600 bg-red-50 dark:bg-red-950/50",
  openai: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50",
  anthropic: "text-amber-600 bg-amber-50 dark:bg-amber-950/50",
  gemini: "text-blue-600 bg-blue-50 dark:bg-blue-950/50",
  deepseek: "text-violet-600 bg-violet-50 dark:bg-violet-950/50",
  openai_compatible: "text-slate-600 bg-slate-100 dark:bg-slate-800",
}

interface AiChave {
  id: number
  provedor: string
  nome: string
  chaveApi: string
  urlBase?: string | null
  modelo?: string | null
  ordem: number
  ativo: boolean
  failCount: number
  ultimaFalha?: string | null
}

const FORM_VAZIO = {
  provedor: "groq",
  nome: "",
  chaveApi: "",
  urlBase: "",
  modelo: "",
  ordem: 1,
  ativo: true,
}

export default function AiChavesPage() {
  const [lista, setLista] = useState<AiChave[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<AiChave | null>(null)
  const [form, setForm] = useState(FORM_VAZIO)
  const [showKey, setShowKey] = useState(false)
  const [saving, setSaving] = useState(false)
  const [testingId, setTestingId] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<{ ok: boolean; mensagem: string } | null>(null)

  useEffect(() => {
    fetch("/api/admin/ai-chaves")
      .then(res => res.json())
      .then(setLista)
      .catch(() => toast.error("Erro ao carregar chaves de IA"))
      .finally(() => setLoading(false))
  }, [])

  function resetForm() {
    setForm(FORM_VAZIO)
    setShowKey(false)
    setEditItem(null)
    setShowForm(false)
  }

  function openForm(chave?: AiChave) {
    if (chave) {
      setEditItem(chave)
      const prov = PROVEDORES[chave.provedor] || PROVEDORES.groq
      setForm({
        provedor: chave.provedor,
        nome: chave.nome,
        chaveApi: "",
        urlBase: chave.urlBase || prov.defaultUrl || "",
        modelo: chave.modelo || prov.defaultModel || "",
        ordem: chave.ordem,
        ativo: chave.ativo,
      })
    } else {
      setEditItem(null)
      setForm(FORM_VAZIO)
    }
    setShowForm(true)
  }

  function onProvedorChange(prov: string) {
    const p = PROVEDORES[prov] || PROVEDORES.groq
    setForm(f => ({ ...f, provedor: prov, urlBase: p.defaultUrl, modelo: p.defaultModel }))
  }

  async function handleSave() {
    if (!form.nome || !form.chaveApi) {
      toast.error("Nome e chave da API sÃ£o obrigatÃ³rios")
      return
    }
    setSaving(true)
    try {
      const body = {
        id: editItem?.id,
        provedor: form.provedor,
        nome: form.nome,
        chaveApi: form.chaveApi,
        urlBase: form.urlBase || null,
        modelo: form.modelo || null,
        ordem: Number(form.ordem) || 1,
        ativo: form.ativo,
      }
      const method = editItem ? "PUT" : "POST"
      const res = await fetch("/api/admin/ai-chaves", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()

      if (editItem) {
        toast.success("Chave atualizada!")
      } else {
        toast.success("Chave adicionada!")
      }
      const novaLista = await fetch("/api/admin/ai-chaves").then(r => r.json())
      setLista(novaLista)
      resetForm()
    } catch {
      toast.error(editItem ? "Erro ao atualizar" : "Erro ao adicionar")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(item: AiChave) {
    try {
      const res = await fetch("/api/admin/ai-chaves", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id, ativo: !item.ativo }),
      })
      if (!res.ok) throw new Error()
      setLista(prev => prev.map(i => (i.id === item.id ? { ...i, ativo: !i.ativo } : i)))
      toast.success(item.ativo ? "Chave desativada" : "Chave ativada")
    } catch {
      toast.error("Erro ao alterar status")
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remover esta chave de IA?")) return
    try {
      const res = await fetch("/api/admin/ai-chaves", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) throw new Error()
      setLista(prev => prev.filter(c => c.id !== id))
      toast.success("Chave removida")
    } catch {
      toast.error("Erro ao remover chave")
    }
  }

  async function handleTest(item: AiChave) {
    setTestingId(item.id)
    setTestResult(null)
    try {
      const res = await fetch("/api/admin/ai-chaves/testar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item.id }),
      })
      const data = await res.json()
      setTestResult(data)
      if (!data.ok) toast.error(data.mensagem || "Falha no teste")
      else toast.success(data.mensagem || "Chave funcionando!")
    } catch {
      setTestResult({ ok: false, mensagem: "Erro ao executar teste" })
      toast.error("Erro ao executar teste")
    } finally {
      setTestingId(null)
    }
  }

  async function handleResetFalhas(id: number) {
    try {
      const res = await fetch("/api/admin/ai-chaves", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, failCount: 0, ultimaFalha: null }),
      })
      if (!res.ok) throw new Error()
      setLista(prev => prev.map(i => (i.id === id ? { ...i, failCount: 0, ultimaFalha: null } : i)))
      toast.success("Contador de falhas zerado")
    } catch {
      toast.error("Erro ao resetar falhas")
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
            <Bot className="text-purple-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Chaves de IA</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Cadastre vÃ¡rias chaves de IA. Se a principal (Groq) falhar, o sistema tenta automaticamente as prÃ³ximas.</p>
        </div>
      </div>

      <div className="rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50 dark:bg-purple-950/30 p-4 text-sm text-purple-700 dark:text-purple-300 space-y-1">
        <p className="font-medium flex items-center gap-2"><ArrowUpDown size={14} /> Como funciona o fallback</p>
        <p>A ordem das chaves (menor nÃºmero primeiro) define a prioridade. Em cada mensagem, o sistema tenta a primeira chave ativa; se ela falhar ou nÃ£o responder, avanÃ§a automaticamente para a prÃ³xima â€” sem perder o histÃ³rico da conversa. ApÃ³s 5 falhas seguidas, a chave sai da rotaÃ§Ã£o por 10 minutos.</p>
      </div>

      <div className="grid gap-4">
        {lista.length === 0 ? (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-10 text-center">
            <Bot size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-500">Nenhuma chave de IA cadastrada</p>
            <p className="text-xs text-slate-400 mt-1">Enquanto isso, o sistema usa a chave do Groq configurada nas variÃ¡veis de ambiente.</p>
          </div>
        ) : (
          [...lista].sort((a, b) => a.ordem - b.ordem).map(item => {
            const prov = PROVEDORES[item.provedor] || PROVEDORES.groq
            return (
              <div key={item.id} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className={`shrink-0 inline-flex p-2.5 rounded-lg ${PROVEDOR_COLORS[item.provedor] || PROVEDOR_COLORS.groq}`}>
                      <Key size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500 rounded px-1.5 py-0.5">#{item.ordem}</span>
                        <h3 className="font-semibold text-slate-900 dark:text-slate-100">{item.nome}</h3>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                          {prov.label}
                        </span>
                        <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${item.ativo ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-400"}`}>
                          {item.ativo ? "Ativo" : "Inativo"}
                        </span>
                        {item.failCount > 0 && (
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-400 font-medium">
                            {item.failCount} falha{item.failCount > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-sm text-slate-500">
                        <span className="font-mono">{item.chaveApi}</span>
                        {item.modelo && <span className="text-xs">Modelo: <span className="font-mono">{item.modelo}</span></span>}
                        {item.urlBase && <span className="text-xs font-mono">{item.urlBase}</span>}
                      </div>
                      {item.ultimaFalha && (
                        <p className="text-xs text-slate-400 mt-1">Ãšltima falha: {new Date(item.ultimaFalha).toLocaleString("pt-BR")}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" onClick={() => handleTest(item)} disabled={testingId === item.id} title="Testar chave" className="gap-1 text-blue-600">
                      {testingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                    </Button>
                    {item.failCount > 0 && (
                      <Button size="sm" variant="ghost" onClick={() => handleResetFalhas(item.id)} title="Zerar contador de falhas" className="gap-1 text-amber-600">
                        <RefreshCw size={14} />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => openForm(item)} className="gap-1">
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
            )
          })
        )}
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold">{editItem ? "Editar Chave de IA" : "Nova Chave de IA"}</h2>

          <div className="space-y-2">
            <Label>Provedor</Label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(PROVEDORES).map(([value, p]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onProvedorChange(value)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    form.provedor === value
                      ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome *</Label>
              <Input value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} placeholder="Ex: Groq Principal" />
            </div>
            <div className="space-y-2">
              <Label>Ordem (prioridade)</Label>
              <Input type="number" min={1} value={form.ordem} onChange={e => setForm({ ...form, ordem: Number(e.target.value) })} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Chave da API *</Label>
            <div className="relative">
              <Input
                type={showKey ? "text" : "password"}
                value={form.chaveApi}
                onChange={e => setForm({ ...form, chaveApi: e.target.value })}
                placeholder={editItem ? "Deixe em branco para manter a chave atual" : "sk-..."}
                className="pr-10"
              />
              <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {editItem && (
              <p className="text-xs text-slate-400">Chave atual: <span className="font-mono">{editItem.chaveApi}</span></p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} placeholder={PROVEDORES[form.provedor]?.defaultModel || "modelo"} />
            </div>
            <div className="space-y-2">
              <Label>URL Base</Label>
              <Input value={form.urlBase} onChange={e => setForm({ ...form, urlBase: e.target.value })} placeholder={PROVEDORES[form.provedor]?.defaultUrl || "https://..."} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setForm({ ...form, ativo: !form.ativo })}
              className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                form.ativo
                  ? "border-green-500 bg-green-50 text-green-700 dark:bg-green-950/50 dark:text-green-400"
                  : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
              }`}
            >
              {form.ativo ? "Chave ativa" : "Chave inativa"}
            </button>
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
        <Button onClick={() => openForm()} className="gap-2">
          <Plus size={16} /> Nova Chave de IA
        </Button>
      )}

      {testResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setTestResult(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-[90vw] max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Play size={18} className={testResult.ok ? "text-green-500" : "text-red-500"} />
                Resultado do Teste
              </h2>
              <button onClick={() => setTestResult(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <div className={`rounded-lg p-4 text-sm ${testResult.ok ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900 text-green-700 dark:text-green-300" : "bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300"}`}>
                {testResult.mensagem}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
