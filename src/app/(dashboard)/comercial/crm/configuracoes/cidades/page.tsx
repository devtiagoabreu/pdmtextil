"use client"

import { useQuery } from "@tanstack/react-query"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useState } from "react"
import { MapPin, Loader2, Search, ArrowLeft } from "lucide-react"
import Link from "next/link"

type Cidade = { id: number; nome: string; estadoId: number; uf: string; estadoNome: string }
type Estado = { id: number; nome: string; uf: string; regiao: string | null }

async function fetchCidades() {
  const res = await fetch("/api/crm/cidades")
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

async function fetchEstados() {
  const res = await fetch("/api/crm/estados")
  if (!res.ok) throw new Error("Falha ao carregar estados")
  return res.json()
}

export default function CidadesConfigPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [busca, setBusca] = useState("")
  const [filtroUf, setFiltroUf] = useState("")

  const { data: cidades, isLoading } = useQuery({
    queryKey: ["crm-cidades"],
    queryFn: fetchCidades,
  })

  const { data: estados } = useQuery({
    queryKey: ["crm-estados"],
    queryFn: fetchEstados,
  })

  const filtrados = (cidades || []).filter((c: Cidade) => {
    const matchBusca = !busca ||
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.estadoNome?.toLowerCase().includes(busca.toLowerCase())
    const matchUf = !filtroUf || c.uf === filtroUf
    return matchBusca && matchUf
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/comercial/crm" className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Cidades{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            {isLoading ? "Carregando..." : `${filtrados?.length || 0} cidade(s)`}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar cidade ou estado..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>
        <select
          value={filtroUf}
          onChange={(e) => setFiltroUf(e.target.value)}
          className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
        >
          <option value="">Todos os estados</option>
          {(estados || []).map((e: Estado) => (
            <option key={e.id} value={e.uf}>{e.uf} — {e.nome}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : !filtrados?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
              {busca || filtroUf ? "Nenhuma cidade encontrada" : "Nenhuma cidade cadastrada"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10">
                <tr className="border-b border-slate-100 dark:border-slate-800">
                  <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase">Cidade</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-slate-500 text-xs uppercase">UF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtrados.map((c: Cidade) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-slate-100">{c.nome}</td>
                    <td className="px-4 py-2.5 text-slate-700 dark:text-slate-300">{c.estadoNome}</td>
                    <td className="px-4 py-2.5 text-slate-500">{c.uf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
