"use client"

import { useState } from "react"
import { ArrowLeft, Repeat } from "lucide-react"
import Link from "next/link"

type Origem = "tex" | "ne" | "denier" | null

export default function ConversoresPage() {
  const [tex, setTex] = useState("")
  const [ne, setNe] = useState("")
  const [denier, setDenier] = useState("")
  const [ultimaOrigem, setUltimaOrigem] = useState<Origem>(null)

  function atualizar(origem: Origem, valor: string) {
    const num = parseFloat(valor)
    if (isNaN(num) || valor === "") {
      setTex("")
      setNe("")
      setDenier("")
      setUltimaOrigem(null)
      return
    }
    setUltimaOrigem(origem)
    switch (origem) {
      case "tex":
        setTex(valor)
        setNe(num > 0 ? (590.5 / num).toFixed(4) : "")
        setDenier((num * 9).toFixed(4))
        break
      case "ne":
        setNe(valor)
        setTex(num > 0 ? (590.5 / num).toFixed(4) : "")
        setDenier(num > 0 ? (5315 / num).toFixed(4) : "")
        break
      case "denier":
        setDenier(valor)
        setTex((num / 9).toFixed(4))
        setNe(num > 0 ? (5315 / num).toFixed(4) : "")
        break
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/ferramentas" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Repeat className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Conversores Têxteis</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Tex · Ne · Denier</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-6 bg-white dark:bg-slate-900">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tex</label>
          <input
            type="number"
            value={tex}
            onChange={e => atualizar("tex", e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg font-mono"
          />
          <p className="text-xs text-slate-400">Peso em gramas de 1000 m de fio</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Ne (Cotton)</label>
          <input
            type="number"
            value={ne}
            onChange={e => atualizar("ne", e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg font-mono"
          />
          <p className="text-xs text-slate-400">Número de meadas de 840 jardas por libra</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Denier (Den)</label>
          <input
            type="number"
            value={denier}
            onChange={e => atualizar("denier", e.target.value)}
            placeholder="0"
            className="w-full px-4 py-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg font-mono"
          />
          <p className="text-xs text-slate-400">Peso em gramas de 9000 m de fio</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-5 bg-white dark:bg-slate-900 text-sm text-slate-500 space-y-1">
        <p className="font-medium text-slate-700 dark:text-slate-300 mb-2">Fórmulas:</p>
        <p>Denier = 9 × Tex</p>
        <p>Tex = Denier / 9</p>
        <p>Ne = 590.5 / Tex</p>
        <p>Tex = 590.5 / Ne</p>
        <p>Ne = 5315 / Denier</p>
        <p>Denier = 5315 / Ne</p>
      </div>
    </div>
  )
}
