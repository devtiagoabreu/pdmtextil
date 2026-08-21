"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface CreatableSelectOption {
  id: number
  nome: string
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
  const [opcoes, setOpcoes] = useState<CreatableSelectOption[]>([])
  const [filtro, setFiltro] = useState(valueNome || "")
  const [aberto, setAberto] = useState(false)
  const [indiceFocado, setIndiceFocado] = useState(-1)
  const [carregando, setCarregando] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const textoExibicao = valueNome || ""

  const buscarOpcoes = useCallback(
    async (busca: string) => {
      setCarregando(true)
      try {
        const url = busca.trim().length > 0
          ? `${fetchUrl}?limit=20&q=${encodeURIComponent(busca)}`
          : `${fetchUrl}?limit=20`
        const res = await fetch(url)
        if (res.ok) {
          const data = await res.json()
          const items: CreatableSelectOption[] = Array.isArray(data)
            ? data.map((d: any) => ({ id: d.id, nome: d.nome }))
            : data.items
              ? data.items.map((d: any) => ({ id: d.id, nome: d.nome }))
              : []
          setOpcoes(items)
        }
      } catch {
        setOpcoes([])
      } finally {
        setCarregando(false)
      }
    },
    [fetchUrl]
  )

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => buscarOpcoes(filtro), 300)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [filtro, buscarOpcoes])

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
        if (valueId && valueNome) {
          setFiltro(valueNome)
        } else if (!valueId && !valueNome) {
          setFiltro("")
        }
      }
    }
    document.addEventListener("mousedown", handleClickFora)
    return () => document.removeEventListener("mousedown", handleClickFora)
  }, [valueId, valueNome])

  useEffect(() => {
    setFiltro(valueNome || "")
  }, [valueNome])

  function selecionar(opcao: CreatableSelectOption) {
    onChange(opcao.id, opcao.nome)
    setFiltro(opcao.nome)
    setAberto(false)
    setIndiceFocado(-1)
  }

  function handleInputChange(valor: string) {
    setFiltro(valor)
    setAberto(true)
    setIndiceFocado(-1)
    if (!valor.trim()) {
      onChange(null, null)
    }
  }

  function handleInputBlur() {
    setTimeout(() => {
      if (!filtro.trim()) {
        onChange(null, null)
      } else if (filtro.trim() && !valueId) {
        onChange(null, filtro.trim())
      }
    }, 150)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!aberto || opcoes.length === 0) return

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setIndiceFocado(prev => (prev < opcoes.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setIndiceFocado(prev => (prev > 0 ? prev - 1 : opcoes.length - 1))
    } else if (e.key === "Enter" && indiceFocado >= 0) {
      e.preventDefault()
      selecionar(opcoes[indiceFocado])
    } else if (e.key === "Escape") {
      setAberto(false)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={filtro}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => {
          buscarOpcoes(filtro)
          setAberto(true)
        }}
        onBlur={handleInputBlur}
        placeholder={placeholder || "Buscar ou digitar..."}
        className={cn("h-9 text-sm", className)}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={aberto}
        aria-autocomplete="list"
      />
      {aberto && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg"
        >
          {carregando && (
            <div className="px-3 py-1.5 text-xs text-muted-foreground">Buscando...</div>
          )}
          {!carregando && opcoes.length === 0 && filtro.trim().length > 0 && (
            <div
              role="option"
              className="px-3 py-1.5 text-sm cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              onMouseDown={(e) => {
                e.preventDefault()
                onChange(null, filtro.trim())
                setAberto(false)
              }}
            >
              Usar &quot;{filtro.trim()}&quot;
            </div>
          )}
          {!carregando && opcoes.map((opcao, i) => (
            <div
              key={opcao.id}
              role="option"
              aria-selected={i === indiceFocado}
              className={cn(
                "px-3 py-1.5 text-sm cursor-pointer",
                i === indiceFocado
                  ? "bg-blue-100 dark:bg-blue-900/50 text-blue-900 dark:text-blue-100"
                  : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
              )}
              onMouseDown={(e) => {
                e.preventDefault()
                selecionar(opcao)
              }}
              onMouseEnter={() => setIndiceFocado(i)}
            >
              {opcao.nome}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
