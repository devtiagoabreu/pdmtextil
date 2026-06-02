"use client"

import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import {
  Loader2,
  Truck,
  Download,
  Search,
  FileText,
  ChevronDown,
  ChevronUp,
  Printer,
  Database,
  RefreshCw,
  Globe,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

interface Integracao {
  id: number
  nome: string
  baseUrl: string
  tipoAuth: string
  telas?: string[]
}

export default function RomaneiosPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)

  const [integracoes, setIntegracoes] = useState<Integracao[]>([])
  const [loadingInt, setLoadingInt] = useState(true)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [items, setItems] = useState<Record<string, any>[]>([])
  const [loadingData, setLoadingData] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedRow, setExpandedRow] = useState<number | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())

  useEffect(() => {
    setLoadingInt(true)
    fetch("/api/integracao/listar?tela=romaneios")
      .then((res) => res.json())
      .then((data) => {
        setIntegracoes(data)
        if (data.length > 0) {
          setSelectedId(data[0].id)
        }
      })
      .catch(() => toast.error("Erro ao carregar integrações"))
      .finally(() => setLoadingInt(false))
  }, [])

  const integracaoAtiva = integracoes.find((i) => i.id === selectedId)

  const handleFetch = useCallback(async () => {
    if (!selectedId) return
    setLoadingData(true)
    setItems([])
    setSearchQuery("")
    setExpandedRow(null)
    setSelectedRows(new Set())
    try {
      const res = await fetch(`/api/integracao/${selectedId}/executar`)
      const data = await res.json()
      if (!data.success) {
        toast.error(`API retornou erro: ${data.status}${data.statusText ? ` - ${data.statusText}` : ""}`)
        return
      }
      const body = data.responseBody
      const rawItems = body?.items || (Array.isArray(body) ? body : body?.data || [])
      if (!Array.isArray(rawItems) || rawItems.length === 0) {
        toast.error("Nenhum romaneio encontrado")
        return
      }
      setItems(rawItems)
      toast.success(`${rawItems.length} romaneio(s) carregado(s)`)
    } catch {
      toast.error("Erro ao buscar dados")
    } finally {
      setLoadingData(false)
    }
  }, [selectedId])

  useEffect(() => {
    if (selectedId && integracoes.length > 0) {
      handleFetch()
    }
  }, [selectedId, integracoes.length, handleFetch])

  const columns = items.length > 0 ? Object.keys(items[0]) : []

  const filteredItems = items.filter((item) =>
    !searchQuery
      ? true
      : columns.some((col) => String(item[col] ?? "").toLowerCase().includes(searchQuery.toLowerCase())),
  )

  function toggleRow(idx: number) {
    setSelectedRows((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  function toggleAll() {
    const allSelected = filteredItems.every((item) => selectedRows.has(items.indexOf(item)))
    if (allSelected) {
      const next = new Set(selectedRows)
      filteredItems.forEach((item) => next.delete(items.indexOf(item)))
      setSelectedRows(next)
    } else {
      const next = new Set(selectedRows)
      filteredItems.forEach((item) => next.add(items.indexOf(item)))
      setSelectedRows(next)
    }
  }

  async function handlePrint() {
    if (selectedRows.size === 0) {
      toast.error("Selecione ao menos um romaneio para imprimir")
      return
    }
    toast.success(`Imprimindo ${selectedRows.size} romaneio(s)...`)
  }

  function getValue(item: Record<string, any>, col: string): string {
    const val = item[col]
    if (val === null || val === undefined) return "—"
    if (typeof val === "object") return JSON.stringify(val)
    return String(val)
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Romaneios{info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Consulta e impressão de romaneios de carga via integrações
          </p>
        </div>
        <div className="flex items-center gap-2">
          {items.length > 0 && (
            <Button onClick={handlePrint} disabled={selectedRows.size === 0} className="gap-2">
              <Printer size={16} />
              Imprimir Selecionados ({selectedRows.size})
            </Button>
          )}
          <Button variant="outline" onClick={handleFetch} disabled={!selectedId || loadingData} className="gap-2">
            {loadingData ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Atualizar
          </Button>
        </div>
      </div>

      {loadingInt ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-slate-400" size={24} />
        </div>
      ) : integracoes.length === 0 ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
          <Globe size={44} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Nenhuma integração configurada para romaneios
          </p>
          <p className="text-xs text-slate-400 mt-1">
            Cadastre uma integração em Configurações &gt; Integrações com a tela &quot;romaneios&quot;
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Integração:</span>
            <div className="flex gap-2 flex-wrap">
              {integracoes.map((int) => (
                <button
                  key={int.id}
                  type="button"
                  onClick={() => setSelectedId(int.id)}
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
          </div>

          {loadingData ? (
            <div className="flex justify-center p-12">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : items.length > 0 ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Pesquisar na lista..."
                  className="pl-9 max-w-sm"
                />
              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-4 py-3 w-10">
                          <input
                            type="checkbox"
                            checked={
                              filteredItems.length > 0 &&
                              filteredItems.every((item) => selectedRows.has(items.indexOf(item)))
                            }
                            onChange={toggleAll}
                            className="rounded"
                          />
                        </th>
                        {columns.slice(0, 8).map((col) => (
                          <th
                            key={col}
                            className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide whitespace-nowrap"
                          >
                            {col}
                          </th>
                        ))}
                        <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide w-10">
                          Det.
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredItems.map((item) => {
                        const originalIdx = items.indexOf(item)
                        return (
                          <tr
                            key={originalIdx}
                            className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <td className="px-4 py-3">
                              <input
                                type="checkbox"
                                checked={selectedRows.has(originalIdx)}
                                onChange={() => toggleRow(originalIdx)}
                                className="rounded"
                              />
                            </td>
                            {columns.slice(0, 8).map((col) => (
                              <td
                                key={col}
                                className="px-4 py-3 text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]"
                              >
                                {getValue(item, col)}
                              </td>
                            ))}
                            <td className="px-4 py-3 text-right">
                              <button
                                onClick={() => setExpandedRow(expandedRow === originalIdx ? null : originalIdx)}
                                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                              >
                                {expandedRow === originalIdx ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
                              </button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                {expandedRow !== null && (
                  <div className="border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 p-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {Object.entries(items[expandedRow] || {}).map(([key, val]) => (
                        <div key={key}>
                          <span className="text-[10px] uppercase tracking-wide text-slate-400 font-medium">
                            {key}
                          </span>
                          <p className="text-sm text-slate-800 dark:text-slate-200 mt-0.5 break-words">
                            {val === null || val === undefined
                              ? "—"
                              : typeof val === "object"
                                ? JSON.stringify(val)
                                : String(val)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>
                  {searchQuery
                    ? `Exibindo ${filteredItems.length} de ${items.length} itens`
                    : `${items.length} romaneio(s)`}{" "}
                  | {selectedRows.size} selecionados
                </span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-12 text-center">
              <Truck size={44} className="mx-auto text-slate-300 mb-3" />
              <p className="text-sm font-medium text-slate-500">
                Clique em &quot;Atualizar&quot; para buscar os romaneios
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
