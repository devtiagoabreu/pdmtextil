"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Loader2, Plus, ArrowLeft, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { getPdmCampos } from "./components/constants"
import { IntegracaoCard, IntegracaoEmpty } from "./components/integracao-card"
import { IntegracaoForm } from "./components/integracao-form"
import { TestResultModal } from "./components/test-result-modal"
import type { Integracao, TipoAuth } from "./components/types"

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
      .then((res: any) => res.json())
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
      const telasArr = telas.split(",").map((s: any) => s.trim()).filter(Boolean)
      const body = { nome, baseUrl, tipoAuth, authConfig: parsedAuth, telas: telasArr, mapping }
      const method = editItem ? "PUT" : "POST"
      const res = await fetch("/api/admin/integracoes", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editItem ? { id: editItem.id, ...body } : body),
      })
      if (!res.ok) throw new Error()

      if (editItem) {
        setLista(prev => prev.map((i: any) => i.id === editItem.id ? { ...i, ...body } : i))
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
      setLista(prev => prev.map((i: any) => i.id === item.id ? { ...i, ativo: !i.ativo } : i))
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
      setLista(prev => prev.filter((c: any) => c.id !== id))
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

      const autoMap: Record<string, string> = {}
      const pdmOptions = getPdmCampos(telas)
      for (const f of fields) {
        const pdmField = pdmOptions.find((p: any) => p.value.toLowerCase() === f.toLowerCase() || p.label.toLowerCase() === f.toLowerCase())
        if (pdmField) autoMap[f] = pdmField.value
      }
      setFieldMappings(autoMap)

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
          <IntegracaoEmpty />
        ) : (
          lista.map((item: any) => (
            <IntegracaoCard
              key={item.id}
              item={item}
              testingId={testingId}
              onTest={handleTest}
              onEdit={openEdit}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {showForm && (
        <IntegracaoForm
          editItem={editItem}
          nome={nome}
          setNome={setNome}
          baseUrl={baseUrl}
          setBaseUrl={setBaseUrl}
          tipoAuth={tipoAuth}
          setTipoAuth={setTipoAuth}
          authConfigJson={authConfigJson}
          setAuthConfigJson={setAuthConfigJson}
          showJson={showJson}
          setShowJson={setShowJson}
          telas={telas}
          setTelas={setTelas}
          mappingJson={mappingJson}
          setMappingJson={setMappingJson}
          apiFields={apiFields}
          fieldMappings={fieldMappings}
          setFieldMappings={setFieldMappings}
          uniqueKeyField={uniqueKeyField}
          setUniqueKeyField={setUniqueKeyField}
          loadingFields={loadingFields}
          saving={saving}
          onLoadFields={handleLoadFields}
          onSave={handleSave}
          onReset={resetForm}
        />
      )}

      {!showForm && (
        <Button onClick={() => setShowForm(true)} className="gap-2">
          <Plus size={16} /> Nova Integração
        </Button>
      )}

      {testResult && <TestResultModal testResult={testResult} onClose={() => setTestResult(null)} />}
    </div>
  )
}
