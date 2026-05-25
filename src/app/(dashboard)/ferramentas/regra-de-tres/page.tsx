"use client"

import { useState } from "react"
import { ArrowLeft, Calculator, Info } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

type TipoRegra = "simples-direta" | "simples-inversa" | "composta"

interface Grandeza {
  nome: string
  valor: number | ""
}

interface GrandezaComposta {
  nome: string
  valorAntigo: number | ""
  valorNovo: number | ""
}

export default function RegraDeTresPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [tipo, setTipo] = useState<TipoRegra>("simples-direta")
  const [grandezas, setGrandezas] = useState<Grandeza[]>([
    { nome: "A", valor: "" },
    { nome: "B", valor: "" },
    { nome: "C", valor: "" },
  ])
  const [grandezasComp, setGrandezasComp] = useState<GrandezaComposta[]>([
    { nome: "A", valorAntigo: "", valorNovo: "" },
    { nome: "B", valorAntigo: "", valorNovo: "" },
  ])
  const [referencia, setReferencia] = useState<number | "">("")
  const [resultado, setResultado] = useState<string | null>(null)
  const [infoAberta, setInfoAberta] = useState<string | null>(null)

  const infos: Record<TipoRegra, { titulo: string; exemplo: string; preencher: () => void }> = {
    "simples-direta": {
      titulo: "Regra de Três Simples Direta",
      exemplo: "3 cadernos custam R$ 15. Quanto custam 5 cadernos?\n\nA: Quantidade de cadernos (3 → 5)\nB: Preço (15 → X)\n\n3/5 = 15/X → X = (15 × 5) / 3 = 25",
      preencher: () => {
        setGrandezas([{ nome: "A", valor: 3 }, { nome: "B", valor: 5 }, { nome: "C", valor: 15 }])
        setReferencia("")
        setResultado(null)
      },
    },
    "simples-inversa": {
      titulo: "Regra de Três Simples Inversa",
      exemplo: "4 pessoas fazem um trabalho em 6 dias. Em quantos dias 8 pessoas fariam?\n\nA: Pessoas (4 → 8)\nB: Dias (6 → X)\n\n4/8 = X/6 → X = (4 × 6) / 8 = 3",
      preencher: () => {
        setGrandezas([{ nome: "A", valor: 4 }, { nome: "B", valor: 8 }, { nome: "C", valor: 6 }])
        setReferencia("")
        setResultado(null)
      },
    },
    "composta": {
      titulo: "Regra de Três Composta",
      exemplo: "5 máquinas produzem 100 peças em 2 dias. Quantas peças 8 máquinas produzirão em 3 dias?\n\nA: Máquinas (5 → 8)\nB: Dias (2 → 3)\nReferência: Peças (100 → X)\n\nX = (8 × 3 × 100) / (5 × 2) = 240",
      preencher: () => {
        setGrandezasComp([{ nome: "Máquinas", valorAntigo: 5, valorNovo: 8 }, { nome: "Dias", valorAntigo: 2, valorNovo: 3 }])
        setReferencia(100)
        setResultado(null)
      },
    },
  }

  function handleGrandezaChange(idx: number, field: keyof Grandeza, value: string) {
    setGrandezas(prev => prev.map((g, i) =>
      i === idx ? { ...g, [field]: field === "nome" ? value : value === "" ? "" : Number(value) } : g
    ))
    setResultado(null)
  }

  function handleGrandezaCompChange(idx: number, field: keyof GrandezaComposta, value: string) {
    setGrandezasComp(prev => prev.map((g, i) =>
      i === idx ? { ...g, [field]: field === "nome" ? value : value === "" ? "" : Number(value) } : g
    ))
    setResultado(null)
  }

  function addGrandezaComp() {
    const next = String.fromCharCode(65 + grandezasComp.length)
    setGrandezasComp(prev => [...prev, { nome: next, valorAntigo: "", valorNovo: "" }])
  }

  function remGrandeza(idx: number) {
    setGrandezas(prev => prev.filter((_, i) => i !== idx))
    setResultado(null)
  }

  function remGrandezaComp(idx: number) {
    setGrandezasComp(prev => prev.filter((_, i) => i !== idx))
    setResultado(null)
  }

  function calcular() {
    if (tipo === "composta") {
      const gs = grandezasComp.filter(g => g.valorAntigo !== "" && g.valorNovo !== "")
      const ref = Number(referencia)
      if (gs.length < 1 || !ref) {
        setResultado("Preencha pelo menos 1 grandeza e o valor de referência.")
        return
      }
      let num = ref
      let den = 1
      for (const g of gs) {
        num *= Number(g.valorNovo)
        den *= Number(g.valorAntigo)
      }
      const x = num / den
      setResultado(`X = ${Number.isInteger(x) ? x : x.toFixed(4)}`)
    } else {
      const a1 = Number(grandezas[0]?.valor)
      const a2 = Number(grandezas[1]?.valor)
      const b1 = Number(grandezas[2]?.valor)

      if (!a1 || !a2 || !b1) {
        setResultado("Preencha os 3 valores (A₁, A₂, B₁).")
        return
      }

      let x: number
      if (tipo === "simples-direta") {
        x = (b1 * a2) / a1
      } else {
        x = (a1 * b1) / a2
      }
      setResultado(`X = ${Number.isInteger(x) ? x : x.toFixed(4)}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/ferramentas" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Calculator className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Calculadora de Regra de Três{info && <InfoButton content={info} />}</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Resolve regra de três simples (direta/inversa) e composta</p>
        </div>
      </div>

      {/* Tipo */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Tipo de Regra</label>
        <div className="flex flex-wrap gap-2">
          {(["simples-direta", "simples-inversa", "composta"] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTipo(t); setResultado(null) }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tipo === t
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {t === "simples-direta" ? "Simples Direta" : t === "simples-inversa" ? "Simples Inversa" : "Composta"}
            </button>
          ))}
          <button
            onClick={() => setInfoAberta(infoAberta === tipo ? null : tipo)}
            className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-all"
            title="Ver explicação e exemplo"
          >
            <Info size={18} />
          </button>
        </div>

        {infoAberta && infos[infoAberta as TipoRegra] && (
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-sm text-slate-700 dark:text-slate-300 border border-blue-200 dark:border-blue-800">
            <p className="font-semibold mb-1">{infos[infoAberta as TipoRegra].titulo}</p>
            <pre className="whitespace-pre-wrap font-sans">{infos[infoAberta as TipoRegra].exemplo}</pre>
            <button
              onClick={() => { infos[infoAberta as TipoRegra].preencher(); setInfoAberta(null) }}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-xs font-medium transition-colors"
            >
              Preencher campos com este exemplo
            </button>
          </div>
        )}
      </div>

      {/* Grandezas */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 bg-white dark:bg-slate-900">
        <h2 className="text-lg font-semibold">Grandezas</h2>

        {tipo !== "composta" ? (
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">A₁ (conhecido)</label>
              <input
                type="number"
                value={grandezas[0]?.valor ?? ""}
                onChange={e => handleGrandezaChange(0, "valor", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                placeholder="Ex: 3"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">A₂ (novo valor)</label>
              <input
                type="number"
                value={grandezas[1]?.valor ?? ""}
                onChange={e => handleGrandezaChange(1, "valor", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                placeholder="Ex: 5"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-600">B₁ (referência)</label>
              <input
                type="number"
                value={grandezas[2]?.valor ?? ""}
                onChange={e => handleGrandezaChange(2, "valor", e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                placeholder="Ex: 15"
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-[100px_120px_120px_32px] gap-2 text-xs font-medium text-slate-500 px-1">
              <span>Grandeza</span>
              <span className="text-center">Valor antigo</span>
              <span className="text-center">Valor novo</span>
            </div>
            {grandezasComp.map((g, idx) => (
              <div key={idx} className="grid grid-cols-[100px_120px_120px_32px] gap-2 items-center">
                <input
                  type="text"
                  value={g.nome}
                  onChange={e => handleGrandezaCompChange(idx, "nome", e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-center font-mono"
                  maxLength={12}
                />
                <input
                  type="number"
                  value={g.valorAntigo}
                  onChange={e => handleGrandezaCompChange(idx, "valorAntigo", e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-center w-full"
                  placeholder="Antigo"
                />
                <input
                  type="number"
                  value={g.valorNovo}
                  onChange={e => handleGrandezaCompChange(idx, "valorNovo", e.target.value)}
                  className="px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-center w-full"
                  placeholder="Novo"
                />
                {grandezasComp.length > 1 && (
                  <button
                    onClick={() => remGrandezaComp(idx)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg text-xs"
                    title="Remover"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={addGrandezaComp}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              + Adicionar grandeza
            </button>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">Valor de referência (X):</span>
                <input
                  type="number"
                  value={referencia}
                  onChange={e => setReferencia(e.target.value === "" ? "" : Number(e.target.value))}
                  className="w-32 px-2 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm"
                  placeholder="Ex: 100"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Calcular */}
      <button
        onClick={calcular}
        className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors text-sm"
      >
        Calcular
      </button>

      {/* Resultado */}
      {resultado !== null && (
        <div className="rounded-xl border border-green-200 dark:border-green-800 p-6 bg-green-50 dark:bg-green-950/30">
          <p className="text-lg font-semibold text-green-800 dark:text-green-300">Resultado</p>
          <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">{resultado}</p>
        </div>
      )}
    </div>
  )
}
