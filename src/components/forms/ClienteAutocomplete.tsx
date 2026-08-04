"use client"

import { useState, useEffect, useRef } from "react"
import { useQuery } from "@tanstack/react-query"
import { Search, Plus, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Cliente = {
  id: number
  nome: string
  cnpj: string
  razaoSocial?: string
  email?: string
  telefone?: string
  contato?: string
  endereco?: string
  cidade?: string
  uf?: string
}

interface ClienteAutocompleteProps {
  value: string
  onChange: (value: string) => void
  onSelect: (cliente: Cliente) => void
  onNovoCliente?: () => void
  error?: string
  cnpjError?: string
  cnpjValue?: string
  onCnpjChange?: (cnpj: string) => void
}

export function ClienteAutocomplete({
  value,
  onChange,
  onSelect,
  onNovoCliente,
  error,
  cnpjError,
  cnpjValue,
  onCnpjChange,
}: ClienteAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [isOpen, setIsOpen] = useState(false)
  const [showCnpjInput, setShowCnpjInput] = useState(false)
  const [cnpjQuery, setCnpjQuery] = useState(cnpjValue || "")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [debouncedCnpj, setDebouncedCnpj] = useState("")
  const [isCnpjOpen, setIsCnpjOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) setQuery(value)
  }, [value])

  useEffect(() => {
    if (cnpjValue !== undefined) setCnpjQuery(cnpjValue)
  }, [cnpjValue])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.length >= 2 ? query : ""), 300)
    return () => clearTimeout(t)
  }, [query])

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCnpj(cnpjQuery.length >= 2 ? cnpjQuery : ""), 300)
    return () => clearTimeout(t)
  }, [cnpjQuery])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsCnpjOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const searchQuery = useQuery({
    queryKey: ["clientes-autocomplete", debouncedQuery],
    queryFn: () => fetch(`/api/clientes?q=${encodeURIComponent(debouncedQuery)}`).then((r: any) => r.json()),
    enabled: !!debouncedQuery,
  })

  const cnpjSearchQuery = useQuery({
    queryKey: ["clientes-autocomplete-cnpj", debouncedCnpj],
    queryFn: () => fetch(`/api/clientes?q=${encodeURIComponent(debouncedCnpj)}`).then((r: any) => r.json()),
    enabled: !!debouncedCnpj,
  })

  const results = debouncedQuery ? (searchQuery.data ?? []) : []
  const isLoading = searchQuery.isLoading || searchQuery.isFetching
  const cnpjResults = debouncedCnpj ? (cnpjSearchQuery.data ?? []) : []
  const isCnpjLoading = cnpjSearchQuery.isLoading || cnpjSearchQuery.isFetching

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    onChange(val)
    setIsOpen(true)
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^a-zA-Z0-9]/g, "")
    setCnpjQuery(val)
    if (onCnpjChange) onCnpjChange(val)
    setIsCnpjOpen(true)
  }

  const handleSelect = (cliente: Cliente) => {
    setQuery(cliente.nome)
    onChange(cliente.nome)
    const cnpjLimpo = cliente.cnpj.replace(/[^a-zA-Z0-9]/g, "")
    setCnpjQuery(cnpjLimpo)
    if (onCnpjChange) onCnpjChange(cnpjLimpo)
    setIsOpen(false)
    setIsCnpjOpen(false)
    onSelect(cliente)
  }

  const handleClear = () => {
    setQuery("")
    onChange("")
    setIsOpen(false)
    if (onCnpjChange) onCnpjChange("")
  }

  return (
    <div ref={containerRef} className="space-y-3">
      <div className="relative">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              value={query}
              onChange={handleQueryChange}
              onFocus={() => setIsOpen(true)}
              placeholder="Digite o nome do cliente..."
              role="combobox"
              aria-label="Buscar cliente"
              aria-expanded={isOpen && results.length > 0}
              aria-controls="cliente-autocomplete-listbox"
              aria-autocomplete="list"
              className={cn("pl-9 pr-8", error && "border-red-500")}
            />
            {query && (
              <button
                onClick={handleClear}
                aria-label="Limpar seleção"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
            {isLoading && (
              <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={14} />
            )}
          </div>
          {onNovoCliente && (
            <Button type="button" variant="outline" size="sm" onClick={onNovoCliente}>
              <Plus size={14} className="mr-1" />
              Novo
            </Button>
          )}
        </div>

        {isOpen && results.length > 0 && (
          <div id="cliente-autocomplete-listbox" role="listbox" aria-label="Clientes encontrados" className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-auto">
            {results.map((cliente: any) => (
              <button
                key={cliente.id}
                role="option"
                onClick={() => handleSelect(cliente)}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex justify-between items-center"
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">{cliente.nome}</span>
                <span className="text-xs text-slate-500 font-mono">{cliente.cnpj}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
          CNPJ
        </label>
        <div className="relative">
          <Input
            value={cnpjQuery}
            onChange={handleCnpjChange}
            onFocus={() => setIsCnpjOpen(true)}
            placeholder="Digite o CNPJ..."
            role="combobox"
            aria-label="Buscar por CNPJ"
            aria-expanded={isCnpjOpen && cnpjResults.length > 0}
            aria-controls="cliente-cnpj-listbox"
            aria-autocomplete="list"
            className="font-mono"
          />
          {isCnpjLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={14} />
          )}
        </div>

        {isCnpjOpen && cnpjResults.length > 0 && (
          <div id="cliente-cnpj-listbox" role="listbox" aria-label="Clientes encontrados por CNPJ" className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-auto">
            {cnpjResults.map((cliente: any) => (
              <button
                key={cliente.id}
                role="option"
                onClick={() => handleSelect(cliente)}
                className="w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 flex justify-between items-center"
              >
                <span className="font-medium text-slate-900 dark:text-slate-100">{cliente.nome}</span>
                <span className="text-xs text-slate-500 font-mono">{cliente.cnpj}</span>
              </button>
            ))}
          </div>
        )}
        {cnpjError && <p className="text-xs text-red-500">{cnpjError}</p>}
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}