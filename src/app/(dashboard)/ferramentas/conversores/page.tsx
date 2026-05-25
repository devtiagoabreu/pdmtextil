"use client"

import { useState } from "react"
import { ArrowLeft, Repeat } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

type Origem = "ne" | "nm" | "tex" | "dtex" | "denier"

const LABELS: Record<Origem, { nome: string; desc: string }> = {
  ne: { nome: "Ne (Cotton)", desc: "Meadas de 840 yd por libra" },
  nm: { nome: "Nm", desc: "Metros por grama (km/kg)" },
  tex: { nome: "Tex", desc: "g / 1000 m" },
  dtex: { nome: "Dtex", desc: "g / 10 000 m" },
  denier: { nome: "Denier (D)", desc: "g / 9000 m" },
}

export default function ConversoresPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [valores, setValores] = useState<Record<Origem, string>>({
    ne: "", nm: "", tex: "", dtex: "", denier: "",
  })

  function atualizar(origem: Origem, valor: string) {
    const num = parseFloat(valor)
    if (isNaN(num) || valor === "") {
      setValores({ ne: "", nm: "", tex: "", dtex: "", denier: "" })
      return
    }

    let ne = 0, nm = 0, tex = 0, dtex = 0, denier = 0

    switch (origem) {
      case "ne":
        ne = num
        tex = 590.5 / ne
        nm = 1000 / tex
        dtex = 10 * tex
        denier = 9 * tex
        break
      case "nm":
        nm = num
        tex = 1000 / nm
        ne = 590.5 / tex
        dtex = 10 * tex
        denier = 9 * tex
        break
      case "tex":
        tex = num
        ne = 590.5 / tex
        nm = 1000 / tex
        dtex = 10 * tex
        denier = 9 * tex
        break
      case "dtex":
        dtex = num
        tex = dtex / 10
        ne = 590.5 / tex
        nm = 1000 / tex
        denier = 9 * tex
        break
      case "denier":
        denier = num
        tex = denier / 9
        ne = 590.5 / tex
        nm = 1000 / tex
        dtex = 10 * tex
        break
    }

    setValores({
      ne: fmt(ne), nm: fmt(nm), tex: fmt(tex), dtex: fmt(dtex), denier: fmt(denier),
    })
  }

  function fmt(v: number) {
    if (!isFinite(v) || v <= 0) return ""
    return v >= 100 ? v.toFixed(2) : v.toFixed(4)
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/ferramentas" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Repeat className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Numeração de Fio{info && <InfoButton content={info} />}</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Conversão entre Ne · Nm · Tex · Dtex · Denier</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 divide-y divide-slate-100 dark:divide-slate-800">
        {(Object.keys(LABELS) as Origem[]).map(origem => {
          const v = LABELS[origem]
          return (
            <div key={origem} className="flex items-center gap-4 px-5 py-4">
              <div className="w-32 shrink-0">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{v.nome}</p>
                <p className="text-[11px] text-slate-400">{v.desc}</p>
              </div>
              <input
                type="number"
                value={valores[origem]}
                onChange={e => atualizar(origem, e.target.value)}
                placeholder="0"
                className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-mono text-right"
              />
            </div>
          )
        })}
      </div>

      <details className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <summary className="px-5 py-3 text-sm font-medium text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100">
          Fórmulas de conversão
        </summary>
        <div className="px-5 pb-4 text-xs text-slate-500 space-y-0.5 font-mono">
          <p>Tex = 590.5 / Ne</p>
          <p>Tex = 1000 / Nm</p>
          <p>Tex = Dtex / 10</p>
          <p>Tex = Denier / 9</p>
          <p className="pt-2">Nm = 1000 / Tex</p>
          <p>Nm = Ne × 590.5 / 1000</p>
          <p className="pt-2">Ne = 590.5 / Tex</p>
          <p>Ne = Nm × 1000 / 590.5</p>
          <p className="pt-2">Dtex = 10 × Tex</p>
          <p className="pt-2">Denier = 9 × Tex</p>
        </div>
      </details>
    </div>
  )
}
