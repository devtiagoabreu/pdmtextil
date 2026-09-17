"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { PlusCircle, Search, LayoutGrid, Loader2 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Input } from "@/components/ui/input"
import { matchesSearch } from "@/components/ui/list-filters"
import {
  chamadoStatusLabel,
  chamadoCategoriaLabel,
  chamadoPrioridadeLabel,
  CHAMADO_STATUS_COLORS,
  CHAMADO_PRIORIDADE_COLORS,
  CHAMADO_CATEGORIA_COLORS,
  CHAMADO_STATUS_LABELS,
  CHAMADO_PRIORIDADE_LABELS,
  CHAMADO_CATEGORIA_LABELS,
} from "@/lib/chamados/constantes"
import type { ChamadoStatus, ChamadoPrioridade, ChamadoCategoria } from "@/lib/db/schema/chamados"

interface Chamado {
  id: number
  titulo: string
  descricao: string
  categoria: ChamadoCategoria
  status: ChamadoStatus
  prioridade: ChamadoPrioridade
  areaId: number
  areaNome?: string | null
  solicitanteId: number
  solicitanteNome?: string | null
  responsavelId?: number | null
  responsavelNome?: string | null
  ativoNome?: string | null
  ativoCodigo?: string | null
  processoNome?: string | null
  slaPrimeiraRespostaPrazo?: string | null
  slaResolucaoPrazo?: string | null
  createdAt: string
}

interface Area {
  id: number
  nome: string
}

function formatarDataHora(data?: string | null): string {
  if (!data) return "—"
  const d = new Date(data)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })
}

const badgeClass = (classes: string) =>
  `inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${classes}`
const fallback = "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"

export default function ChamadosPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [prioridade, setPrioridade] = useState("")
  const [areaId, setAreaId] = useState("")
  const [minhasFilas, setMinhasFilas] = useState(false)

  const { data: chamados = [], isLoading } = useQuery<Chamado[]>({
    queryKey: ["chamados", minhasFilas],
    queryFn: async () => {
      const res = await fetch(
        minhasFilas ? "/api/chamados?minhasFilas=true" : "/api/chamados"
      )
      if (!res.ok) throw new Error("Falha ao carregar chamados")
      return res.json()
    },
  })

  const { data: areas = [] } = useQuery<Area[]>({
    queryKey: ["chamados-areas"],
    queryFn: async () => {
      const res = await fetch("/api/processos/areas")
      if (!res.ok) return []
      return res.json()
    },
  })

  const filtered = chamados.filter((c) => {
    const texto = matchesSearch(c, search)
    const porStatus = !status || c.status === status
    const porPrioridade = !prioridade || c.prioridade === prioridade
    const porFila = !areaId || String(c.areaId) === areaId
    return texto && porStatus && porPrioridade && porFila
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            Chamados
            {info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Solicitações de T.I. e manutenção da fábrica
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/chamados/dashboard">
            <Button variant="outline" className="gap-2">
              <LayoutGrid size={16} />
              Dashboard
            </Button>
          </Link>
          <Link href="/chamados/novo">
            <Button className="gap-2">
              <PlusCircle size={16} />
              Novo Chamado
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input
            placeholder="Buscar por título, descrição, solicitante ou fila..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            aria-label="Filtrar por status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-sm"
          >
            <option value="">Todos os status</option>
            {Object.entries(CHAMADO_STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por prioridade"
            value={prioridade}
            onChange={(e) => setPrioridade(e.target.value)}
            className="p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-sm"
          >
            <option value="">Todas as prioridades</option>
            {Object.entries(CHAMADO_PRIORIDADE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <select
            aria-label="Filtrar por fila"
            value={areaId}
            onChange={(e) => setAreaId(e.target.value)}
            className="p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-sm"
          >
            <option value="">Todas as filas</option>
            {areas.map((area) => (
              <option key={area.id} value={area.id}>
                {area.nome}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
            <input
              type="checkbox"
              checked={minhasFilas}
              onChange={(e) => setMinhasFilas(e.target.checked)}
              className="w-4 h-4"
            />
            Minhas filas
          </label>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="animate-spin text-slate-400" size={24} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            {chamados.length === 0 ? "Nenhum chamado encontrado" : "Nenhum chamado com esses filtros"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Chamado
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Categoria
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Fila
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Prioridade
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Status
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Responsável
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 dark:text-slate-400 p-4">
                    Criado em
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  >
                    <td className="p-4">
                      <Link href={`/chamados/${c.id}`}>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-50 hover:underline">
                          {c.titulo}
                        </span>
                      </Link>
                      <span className="block text-xs text-slate-400">#{c.id}</span>
                    </td>
                    <td className="p-4">
                      <span
                        className={badgeClass(
                          CHAMADO_CATEGORIA_COLORS[c.categoria] || fallback
                        )}
                      >
                        {chamadoCategoriaLabel(c.categoria)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">{c.areaNome || "—"}</td>
                    <td className="p-4">
                      <span
                        className={badgeClass(
                          CHAMADO_PRIORIDADE_COLORS[c.prioridade] || fallback
                        )}
                      >
                        {chamadoPrioridadeLabel(c.prioridade)}
                      </span>
                    </td>
                    <td className="p-4">
                      <span
                        className={badgeClass(CHAMADO_STATUS_COLORS[c.status] || fallback)}
                      >
                        {chamadoStatusLabel(c.status)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {c.responsavelNome || "—"}
                    </td>
                    <td className="p-4 text-sm text-slate-500">
                      {formatarDataHora(c.createdAt)}
                    </td>
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