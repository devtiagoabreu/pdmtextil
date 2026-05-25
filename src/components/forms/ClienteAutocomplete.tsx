"use client"

import { useState, useEffect, useRef } from "react"
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
  const [results, setResults] = useState<Cliente[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showCnpjInput, setShowCnpjInput] = useState(false)
  const [cnpjQuery, setCnpjQuery] = useState(cnpjValue || "")
  const [cnpjResults, setCnpjResults] = useState<Cliente[]>([])
  const [isCnpjLoading, setIsCnpjLoading] = useState(false)
  const [isCnpjOpen, setIsCnpjOpen] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout>()
  const debounceCnpjRef = useRef<NodeJS.Timeout>()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) setQuery(value)
  }, [value])

  useEffect(() => {
    if (cnpjValue !== undefined) setCnpjQuery(cnpjValue)
  }, [cnpjValue])

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

  const searchClientes = async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setResults(data)
        setIsOpen(true)
      }
    } catch (err) {
      console.error("Erro ao buscar clientes:", err)
    } finally {
      setIsLoading(false)
    }
  }

  const searchCnpj = async (q: string) => {
    if (q.length < 2) {
      setCnpjResults([])
      return
    }
    setIsCnpjLoading(true)
    try {
      const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setCnpjResults(data)
        setIsCnpjOpen(true)
      }
    } catch (err) {
      console.error("Erro ao buscar CNPJ:", err)
    } finally {
      setIsCnpjLoading(false)
    }
  }

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    onChange(val)

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      searchClientes(val)
    }, 300)
  }

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setCnpjQuery(val)
    if (onCnpjChange) onCnpjChange(val)

    if (debounceCnpjRef.current) clearTimeout(debounceCnpjRef.current)
    debounceCnpjRef.current = setTimeout(() => {
      searchCnpj(val)
    }, 300)
  }

  const handleSelect = (cliente: Cliente) => {
    setQuery(cliente.nome)
    onChange(cliente.nome)
    if (onCnpjChange) onCnpjChange(cliente.cnpj)
    setIsOpen(false)
    setIsCnpjOpen(false)
    onSelect(cliente)
  }

  const handleClear = () => {
    setQuery("")
    onChange("")
    setResults([])
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
              onFocus={() => results.length > 0 && setIsOpen(true)}
              placeholder="Digite o nome do cliente..."
              className={cn("pl-9 pr-8", error && "border-red-500")}
            />
            {query && (
              <button
                onClick={handleClear}
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
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-auto">
            {results.map((cliente) => (
              <button
                key={cliente.id}
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
          CNPJ <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Input
            value={cnpjQuery}
            onChange={handleCnpjChange}
            onFocus={() => cnpjResults.length > 0 && setIsCnpjOpen(true)}
            placeholder="Digite o CNPJ..."
            className="font-mono"
          />
          {isCnpjLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={14} />
          )}
        </div>

        {isCnpjOpen && cnpjResults.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-auto">
            {cnpjResults.map((cliente) => (
              <button
                key={cliente.id}
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