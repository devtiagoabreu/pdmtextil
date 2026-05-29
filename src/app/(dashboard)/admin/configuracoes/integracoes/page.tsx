"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus, Trash2, Edit3, Globe, Check, X, ArrowLeft, Zap, Key, Eye, EyeOff, Play, Clock, Code } from "lucide-react"
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
  telas?: string[]
  mapping?: Record<string, unknown>
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

const PDM_CAMPOS = [
  { label: "(não mapear)", value: "" },
  { label: "ID", value: "id" },
  { label: "Nome", value: "nome" },
  { label: "CNPJ", value: "cnpj" },
  { label: "Razão Social", value: "razaoSocial" },
  { label: "Email", value: "email" },
  { label: "Telefone", value: "telefone" },
  { label: "Contato", value: "contato" },
  { label: "Endereço", value: "endereco" },
  { label: "Cidade", value: "cidade" },
  { label: "UF", value: "uf" },
  { label: "ID Integração", value: "idIntegracao" },
  { label: "Ativo", value: "ativo" },
]

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
  const [testingId, setTestingId] = useState<number | null>(null)
  const [testResult, setTestResult] = useState<any>(null)
  const [telas, setTelas] = useState("")
  const [mappingJson, setMappingJson] = useState("{}")
  const [apiFields, setApiFields] = useState<string[]>([])
  const [fieldMappings, setFieldMappings] = useState<Record<string, string>>({})
  const [uniqueKeyField, setUniqueKeyField] = useState("")
  const [loadingFields, setLoadingFields] = useState(false)

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
    setTelas("")
    setMappingJson("{}")
    setApiFields([])
    setFieldMappings({})
    setUniqueKeyField("")
    setEditItem(null)
    setShowForm(false)
  }

  function openEdit(item: Integracao) {
    setEditItem(item)
    setNome(item.nome)
    setBaseUrl(item.baseUrl)
    setTipoAuth(item.tipoAuth)
    setAuthConfigJson(JSON.stringify(item.authConfig, null, 2))
    setTelas((item.telas || []).join(", "))
    const mapping = item.mapping || {}
    const fields = (mapping.fields || {}) as Record<string, string>
    setMappingJson(JSON.stringify(mapping, null, 2))
    setFieldMappings(fields)
    setUniqueKeyField((mapping.uniqueKey as string) || "")
    setApiFields(Object.keys(fields))
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

    // Build mapping from visual editor or JSON fallback
    let mapping: Record<string, unknown>
    if (apiFields.length > 0 && Object.keys(fieldMappings).length > 0) {
      mapping = { fields: fieldMappings, uniqueKey: uniqueKeyField }
    } else {
      try {
        mapping = JSON.parse(mappingJson)
      } catch {
        toast.error("JSON de mapeamento inválido")
        return
      }
    }

    setSaving(true)
    try {
      const telasArr = telas.split(",").map(s => s.trim()).filter(Boolean)
      const body = { nome, baseUrl, tipoAuth, authConfig: parsedAuth, telas: telasArr, mapping }
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

  async function handleTest(id: number) {
    setTestingId(id)
    setTestResult(null)
    try {
      const res = await fetch(`/api/admin/integracoes/${id}/testar`)
      const data = await res.json()
      setTestResult(data)
    } catch {
      setTestResult({ success: false, error: "Erro ao executar teste" })
    } finally {
      setTestingId(null)
    }
  }

  async function handleLoadFields() {
    if (!editItem) {
      toast.error("Salve a integração primeiro")
      return
    }
    setLoadingFields(true)
    try {
      const res = await fetch(`/api/admin/integracoes/${editItem.id}/testar`)
      const data = await res.json()
      if (!data.success || !data.responseBody) {
        toast.error("API não respondeu ou retornou erro")
        return
      }
      const body = data.responseBody
      const rawItems = body?.items || (Array.isArray(body) ? body : body?.data || [])
      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        toast.error("Nenhum item na resposta")
        return
      }
      const fields = Object.keys(rawItems[0])
      setApiFields(fields)

      // Auto-map fields with same name
      const autoMap: Record<string, string> = {}
      for (const f of fields) {
        const pdmField = PDM_CAMPOS.find(p => p.value.toLowerCase() === f.toLowerCase() || p.label.toLowerCase() === f.toLowerCase())
        if (pdmField) autoMap[f] = pdmField.value
      }
      setFieldMappings(autoMap)

      // Auto-detect uniqueKey
      if (fields.includes("idintegracao")) setUniqueKeyField("idintegracao")
      else if (fields.includes("idIntegracao")) setUniqueKeyField("idIntegracao")
      else if (fields.includes("cnpj")) setUniqueKeyField("cnpj")
      else if (fields.includes("id")) setUniqueKeyField("id")

      toast.success(`${fields.length} campos carregados da API`)
    } catch {
      toast.error("Erro ao carregar campos da API")
    } finally {
      setLoadingFields(false)
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
                    {item.telas && item.telas.length > 0 && (
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {item.telas.map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 uppercase">{t}</span>)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button size="sm" variant="ghost" onClick={() => handleTest(item.id)} disabled={testingId === item.id} className="gap-1 text-blue-600">
                    {testingId === item.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                  </Button>
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

          <div className="space-y-2">
            <Label>Telas (separadas por vírgula)</Label>
            <Input value={telas} onChange={e => setTelas(e.target.value)} placeholder="clientes, fios, bases-urdume" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Mapeamento de Campos</Label>
              <Button size="sm" variant="outline" onClick={handleLoadFields} disabled={!editItem || loadingFields} className="gap-1 text-xs">
                {loadingFields ? <Loader2 size={12} className="animate-spin" /> : <Play size={12} />}
                Carregar campos da API
              </Button>
            </div>

            {apiFields.length > 0 ? (
              <div className="space-y-3">
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="p-2 text-left text-xs font-medium text-slate-500 uppercase w-1/2">Campo da API</th>
                        <th className="p-2 text-left text-xs font-medium text-slate-500 uppercase w-1/2">Campo PDM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {apiFields.map(f => (
                        <tr key={f}>
                          <td className="p-2 text-xs font-mono text-slate-700 dark:text-slate-300">{f}</td>
                          <td className="p-2">
                            <select
                              value={fieldMappings[f] || ""}
                              onChange={e => {
                                const newMappings = { ...fieldMappings, [f]: e.target.value }
                                setFieldMappings(newMappings)
                                setMappingJson(JSON.stringify({ fields: newMappings, uniqueKey: uniqueKeyField }, null, 2))
                              }}
                              className="w-full rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {PDM_CAMPOS.map(p => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center gap-3">
                  <Label className="text-sm">Chave única (dedup):</Label>
                  <select
                    value={uniqueKeyField}
                    onChange={e => {
                      setUniqueKeyField(e.target.value)
                      setMappingJson(JSON.stringify({ fields: fieldMappings, uniqueKey: e.target.value }, null, 2))
                    }}
                    className="rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2 py-1 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="">Selecione...</option>
                    {apiFields.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>
            ) : (
              <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center">
                <p className="text-xs text-slate-400">
                  Clique em &quot;Carregar campos da API&quot; para ver os campos do retorno e configurar o mapeamento.
                </p>
              </div>
            )}
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

      {testResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setTestResult(null)}>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-[90vw] max-w-2xl max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Zap size={18} className={testResult.success ? "text-green-500" : "text-red-500"} />
                Resultado do Teste
              </h2>
              <button onClick={() => setTestResult(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {testResult.error && !testResult.status && (
                <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-4">
                  <p className="text-sm text-red-700 dark:text-red-400 font-medium">Erro</p>
                  <p className="text-sm text-red-600 dark:text-red-300 mt-1">{testResult.error}</p>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Status</p>
                  <p className={`text-lg font-bold mt-1 ${testResult.status >= 200 && testResult.status < 300 ? "text-green-600" : testResult.status === 0 ? "text-red-500" : "text-amber-600"}`}>
                    {testResult.status || "—"}
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Tempo</p>
                  <p className="text-lg font-bold mt-1 text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1">
                    <Clock size={14} />
                    {testResult.time}ms
                  </p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-slate-500 uppercase tracking-wide">Resultado</p>
                  <p className={`text-lg font-bold mt-1 ${testResult.success ? "text-green-600" : "text-red-500"}`}>
                    {testResult.success ? "Sucesso" : "Falha"}
                  </p>
                </div>
              </div>

              {testResult.responseBody && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Code size={14} className="text-slate-400" />
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Resposta</p>
                  </div>
                  <pre className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-4 text-xs font-mono text-slate-700 dark:text-slate-300 overflow-x-auto max-h-60 whitespace-pre-wrap break-all">
                    {typeof testResult.responseBody === "string" ? testResult.responseBody : JSON.stringify(testResult.responseBody, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
