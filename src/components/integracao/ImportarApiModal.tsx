"use client"

import { useState, useEffect } from "react"
import { Loader2, Globe, Download, X, Check, Database, Search } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface MappingConfig {
  fields?: Record<string, string>
  uniqueKey?: string
}

interface Integracao {
  id: number
  nome: string
  baseUrl: string
  mapping?: MappingConfig
  telas?: string[]
  ativo?: boolean
}

interface ImportarApiModalProps {
  tela: string
  existingRecords: Record<string, any>[]
  existingKey?: string
  onImportado?: () => void
  onClose: () => void
  extraImportParams?: Record<string, any>
}

export default function ImportarApiModal({ tela, existingRecords, existingKey = "idIntegracao", onImportado, onClose, extraImportParams }: ImportarApiModalProps) {
  const [integracoes, setIntegracoes] = useState<Integracao[]>([])
  const [loadingInt, setLoadingInt] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [items, setItems] = useState<Record<string, any>[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [importing, setImporting] = useState(false)
  const [existingSet, setExistingSet] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    setLoadingInt(true)
    fetch("/api/admin/integracoes")
      .then(res => res.json())
      .then((all: Integracao[]) => setIntegracoes(all.filter(i => i.telas?.includes(tela) && i.ativo)))
      .catch(() => toast.error("Erro ao carregar integrações"))
      .finally(() => setLoadingInt(false))
  }, [tela])

  const integracao = integracoes.find(i => i.id === selectedId) || null
  const uniqueKey = (integracao?.mapping?.uniqueKey || existingKey) as string
  const fieldMapping = (integracao?.mapping?.fields || {}) as Record<string, string>

  useEffect(() => {
    const existing = new Set<string>()
    for (const r of existingRecords) {
      const val = r[existingKey]
      if (val != null) existing.add(String(val).trim().toLowerCase())
    }
    setExistingSet(existing)
  }, [existingRecords, existingKey])

  function getMappedValue(item: Record<string, any>, mappedField: string) {
    const apiField = Object.entries(fieldMapping).find(([, v]) => v === mappedField)?.[0]
    if (!apiField) return item[mappedField]
    return item[apiField]
  }

  async function handleFetch() {
    if (!selectedId) return
    setLoadingData(true)
    setItems([])
    setSelectedRows(new Set())
    setSearchQuery("")
    try {
      const res = await fetch(`/api/admin/integracoes/${selectedId}/testar`)
      const data = await res.json()
      if (!data.success) {
        toast.error(`API retornou erro: ${data.status}${data.statusText ? ` - ${data.statusText}` : ""}`)
        return
      }
      const body = data.responseBody
      const rawItems = body?.items || (Array.isArray(body) ? body : body?.data || [])
      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        toast.error("Nenhum item encontrado na resposta")
        return
      }
      setItems(rawItems)
      // Default: select all non-duplicate AND with required fields filled
      const autoSelect = new Set<number>()
      rawItems.forEach((_: any, idx: number) => {
        const keyVal = rawItems[idx][uniqueKey]
        const hasRequiredField = rawItems[idx][uniqueKey] != null && String(rawItems[idx][uniqueKey]).trim() !== ""
        if (hasRequiredField && !existingSet.has(String(keyVal).trim().toLowerCase())) {
          autoSelect.add(idx)
        }
      })
      setSelectedRows(autoSelect)
      toast.success(`${rawItems.length} itens carregados`)
    } catch {
      toast.error("Erro ao executar requisição")
    } finally {
      setLoadingData(false)
    }
  }

  function toggleRow(idx: number) {
    setSelectedRows(prev => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  function toggleAll() {
    const allFilteredSelected = filteredItems.every(item => selectedRows.has(items.indexOf(item)))
    if (allFilteredSelected) {
      const next = new Set(selectedRows)
      filteredItems.forEach(item => next.delete(items.indexOf(item)))
      setSelectedRows(next)
    } else {
      const next = new Set(selectedRows)
      filteredItems.forEach(item => next.add(items.indexOf(item)))
      setSelectedRows(next)
    }
  }

  function isDuplicate(item: Record<string, any>) {
    const apiKeyField = Object.entries(fieldMapping).find(([, v]) => v === existingKey)?.[0]
    const val = item[apiKeyField || uniqueKey]
    if (!val) return false
    return existingSet.has(String(val).trim().toLowerCase())
  }

  function hasMissingRequiredField(item: Record<string, any>) {
    const apiKeyField = Object.entries(fieldMapping).find(([, v]) => v === uniqueKey)?.[0]
    const val = item[apiKeyField || uniqueKey]
    return val == null || String(val).trim() === ""
  }

  const columns = items.length > 0 ? Object.keys(items[0]) : []
  const filteredItems = items.filter(item =>
    !searchQuery || columns.some(col =>
      String(item[col] ?? "").toLowerCase().includes(searchQuery.toLowerCase())
    )
  )
  const filteredSelectedRows = new Set(
    [...selectedRows].filter(i => filteredItems.includes(items[i]))
  )

  async function handleImport() {
    if (selectedRows.size === 0) {
      toast.error("Selecione ao menos um item")
      return
    }
    setImporting(true)
    try {
      const selectedItems = items.filter((_, i) => selectedRows.has(i) && !hasMissingRequiredField(items[i]))
      const res = await fetch("/api/integracao/importar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entidade: tela,
          integracaoId: selectedId,
          fieldMapping,
          uniqueKey,
          items: selectedItems,
          ...extraImportParams,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro na importação")
      }
      const result = await res.json()
      toast.success(`${result.importados} importado(s)${result.duplicados ? `, ${result.duplicados} duplicado(s)` : ""}${result.vazios ? `, ${result.vazios} com campo vazio` : ""}`)
      onImportado?.()
      onClose()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao importar")
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xl w-[95vw] max-w-5xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database size={18} className="text-blue-500" />
            Importar via API
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 flex-1 overflow-auto">
          {loadingInt ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
          ) : integracoes.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">Nenhuma integração configurada para &quot;{tela}&quot;</p>
          ) : (
            <>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Integração:</span>
                <div className="flex gap-2 flex-wrap">
                  {integracoes.map(int => (
                    <button
                      key={int.id}
                      type="button"
                      onClick={() => { setSelectedId(int.id); setItems([]); setSelectedRows(new Set()) }}
                      className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                        selectedId === int.id
                          ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                          : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      {int.nome}
                    </button>
                  ))}
                </div>
                <Button size="sm" onClick={handleFetch} disabled={!selectedId || loadingData} className="gap-1">
                  {loadingData ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  Executar
                </Button>
              </div>

              {items.length > 0 && (
                <>
                  {items.filter(i => hasMissingRequiredField(i)).length > 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 px-3 py-1.5 rounded-lg">
                      {items.filter(i => hasMissingRequiredField(i)).length} item(s) com &quot;{uniqueKey}&quot; vazio — não serão selecionados para importação.
                    </p>
                  )}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <Input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Pesquisar na lista..."
                      className="pl-9 max-w-sm"
                    />
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-auto max-h-96">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 sticky top-0">
                      <tr>
                        <th className="p-2 w-10">
                          <input type="checkbox" checked={filteredSelectedRows.size === filteredItems.length && filteredItems.length > 0} onChange={toggleAll} className="rounded" />
                        </th>
                        {columns.slice(0, 8).map(col => (
                          <th key={col} className="p-2 text-left text-xs font-medium text-slate-500 uppercase whitespace-nowrap">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredItems.map((item) => {
                        const originalIdx = items.indexOf(item)
                        const dup = isDuplicate(item)
                        const missingField = hasMissingRequiredField(item)
                        const disabled = dup || missingField
                        return (
                          <tr key={originalIdx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 ${dup ? "opacity-50" : ""} ${missingField && !dup ? "opacity-40" : ""}`}>
                            <td className="p-2">
                              <input
                                type="checkbox"
                                checked={selectedRows.has(originalIdx)}
                                onChange={() => toggleRow(originalIdx)}
                                disabled={disabled}
                                className="rounded"
                                title={missingField ? `Campo obrigatório "${uniqueKey}" vazio` : dup ? "Duplicado" : ""}
                              />
                            </td>
                            {columns.slice(0, 8).map(col => (
                              <td key={col} className="p-2 text-xs text-slate-700 dark:text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]">
                                {typeof item[col] === "object" ? JSON.stringify(item[col]) : String(item[col] ?? "")}
                              </td>
                            ))}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
              )}

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{searchQuery ? `Exibindo ${filteredItems.length} de ` : ""}{items.length} itens | {selectedRows.size} selecionados | {existingSet.size} existentes | {items.filter(i => hasMissingRequiredField(i)).length} sem {uniqueKey}</span>
                {integracao?.mapping?.uniqueKey && (
                  <span className="flex items-center gap-1">
                    <Check size={12} className="text-green-500" />
                    Chave única: {integracao.mapping.uniqueKey}
                  </span>
                )}
              </div>
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="flex items-center justify-end gap-2 p-5 border-t border-slate-200 dark:border-slate-800">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleImport} disabled={selectedRows.size === 0 || importing} className="gap-2">
              {importing && <Loader2 size={16} className="animate-spin" />}
              Importar {selectedRows.size > 0 && `(${selectedRows.size})`}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
