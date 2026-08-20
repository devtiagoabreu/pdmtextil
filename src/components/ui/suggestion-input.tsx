"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface SuggestionInputProps {
  value: string
  onChange: (value: string) => void
  campo: string
  placeholder?: string
  className?: string
  onKeyDown?: (e: React.KeyboardEvent) => void
}

export function SuggestionInput({
  value,
  onChange,
  campo,
  placeholder,
  className,
  onKeyDown,
}: SuggestionInputProps) {
  const [sugestoes, setSugestoes] = useState<string[]>([])
  const [aberto, setAberto] = useState(false)
  const [indiceFocado, setIndiceFocado] = useState(-1)
  const [carregando, setCarregando] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const buscarSugestoes = useCallback(
    async (busca: string) => {
      if (!busca || busca.trim().length < 1) {
        setSugestoes([])
        setAberto(false)
        return
      }
      setCarregando(true)
      try {
        const res = await fetch(
          `/api/comercial/requisicoes-corte/sugestoes?campo=${campo}&busca=${encodeURIComponent(busca)}`
        )
        if (res.ok) {
          const data = await res.json()
          setSugestoes(data)
          setAberto(data.length > 0)
          setIndiceFocado(-1)
        }
      } catch {
        setSugestoes([])
      } finally {
        setCarregando(false)
      }
    },
    [campo]
  )

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => buscarSugestoes(value), 300)
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [value, buscarSugestoes])

  useEffect(() => {
    function handleClickFora(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener("mousedown", handleClickFora)
    return () => document.removeEventListener("mousedown", handleClickFora)
  }, [])

  function selecionar(valor: string) {
    onChange(valor)
    setAberto(false)
    setIndiceFocado(-1)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!aberto || sugestoes.length === 0) {
      onKeyDown?.(e)
      return
    }

    if (e.key === "ArrowDown") {
      e.preventDefault()
      setIndiceFocado(prev => (prev < sugestoes.length - 1 ? prev + 1 : 0))
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setIndiceFocado(prev => (prev > 0 ? prev - 1 : sugestoes.length - 1))
    } else if (e.key === "Enter" && indiceFocado >= 0) {
      e.preventDefault()
      selecionar(sugestoes[indiceFocado])
    } else if (e.key === "Escape") {
      setAberto(false)
    } else {
      onKeyDown?.(e)
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("h-9 text-sm", className)}
        onFocus={() => {
          if (sugestoes.length > 0 && value.trim().length >= 1) setAberto(true)
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-expanded={aberto}
        aria-autocomplete="list"
      />
      {aberto && sugestoes.length > 0 && (
        <div
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg"
        >
          {sugestoes.map((sugestao, i) => (
            <div
              key={sugestao}
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
                selecionar(sugestao)
              }}
              onMouseEnter={() => setIndiceFocado(i)}
            >
              {sugestao}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
