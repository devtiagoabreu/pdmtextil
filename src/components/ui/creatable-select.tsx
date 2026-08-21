"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CreatableSelectOption {
  id: number
  nome: string
  [key: string]: any
}

interface CreatableSelectProps {
  valueId: number | null
  valueNome: string | null
  onChange: (id: number | null, nome: string | null) => void
  fetchUrl: string
  placeholder?: string
  className?: string
}

export function CreatableSelect({
  valueId,
  valueNome,
  onChange,
  fetchUrl,
  placeholder,
  className,
}: CreatableSelectProps) {
  const [query, setQuery] = useState(valueNome || "")
  const [isOpen, setIsOpen] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [results, setResults] = useState<CreatableSelectOption[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (valueNome !== undefined && valueNome !== null) {
      setQuery(valueNome)
    }
  }, [valueNome])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(query.length >= 2 ? query : "")
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [query])

  useEffect(() => {
    if (!debouncedQuery) {
      setResults([])
      return
    }
    let cancelled = false
    setIsLoading(true)
    fetch(`${fetchUrl}?q=${encodeURIComponent(debouncedQuery)}&limit=20`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return
        const items: CreatableSelectOption[] = Array.isArray(data)
          ? data
          : data.items
            ? data.items
            : []
        setResults(items)
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })
    return () => { cancelled = true }
  }, [debouncedQuery, fetchUrl])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    onChange(null, val || null)
    setIsOpen(true)
  }

  const handleSelect = (option: CreatableSelectOption) => {
    setQuery(option.nome)
    onChange(option.id, option.nome)
    setIsOpen(false)
  }

  const handleClear = () => {
    setQuery("")
    onChange(null, null)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
        <Input
          value={query}
          onChange={handleChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder || "Digite para buscar..."}
          role="combobox"
          aria-expanded={isOpen && results.length > 0}
          aria-autocomplete="list"
          className="pl-9 pr-8 h-9 text-sm"
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Limpar"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
        {isLoading && (
          <Loader2 className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" size={14} />
        )}
      </div>

      {isOpen && results.length > 0 && (
        <div
          role="listbox"
          className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-48 overflow-auto"
        >
          {results.map((option) => (
            <button
              key={option.id}
              type="button"
              role="option"
              onClick={() => handleSelect(option)}
              className={cn(
                "w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center",
                valueId === option.id && "bg-blue-50 dark:bg-blue-900/30"
              )}
            >
              <span className="text-slate-900 dark:text-slate-100">{option.nome}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
