"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, X, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export type FilterConfig = {
  searchFields: string[]
  statusOptions?: { value: string; label: string }[]
  dateField?: string
}

type Props = {
  config: FilterConfig
  data: any[]
  onFiltered: (filtered: any[]) => void
  placeholder?: string
}

export function useListFilters(config: FilterConfig, data: any[]) {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filtered = useMemo(() => {
    let result = [...data]

    if (search.trim()) {
      const q = search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      result = result.filter((item: any) =>
        config.searchFields.some((field: any) => {
          const val = field.split(".").reduce((obj: any, key: any) => obj?.[key], item)
          if (val == null) return false
          return String(val).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)
        })
      )
    }

    if (statusFilter && statusFilter !== "all") {
      result = result.filter((item: any) => item.status === statusFilter)
    }

    const dateField = config.dateField || "createdAt"
    if (dateFrom) {
      const from = new Date(dateFrom + "T00:00:00")
      result = result.filter((item: any) => {
        const d = item[dateField] ? new Date(item[dateField]) : null
        return d && d >= from
      })
    }
    if (dateTo) {
      const to = new Date(dateTo + "T23:59:59")
      result = result.filter((item: any) => {
        const d = item[dateField] ? new Date(item[dateField]) : null
        return d && d <= to
      })
    }

    return result
  }, [data, search, statusFilter, dateFrom, dateTo, config])

  return { filtered, search, setSearch, statusFilter, setStatusFilter, dateFrom, setDateFrom, dateTo, setDateTo }
}

export default function ListFilters({ config, data, onFiltered, placeholder }: Props) {
  const { filtered, search, setSearch, statusFilter, setStatusFilter, dateFrom, setDateFrom, dateTo, setDateTo } = useListFilters(config, data)

  useEffect(() => {
    onFiltered(filtered)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered])

  const hasActiveFilters = search || statusFilter !== "all" || dateFrom || dateTo

  function clearFilters() {
    setSearch("")
    setStatusFilter("all")
    setDateFrom("")
    setDateTo("")
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={placeholder || "Buscar..."}
            className="pl-9 h-9 text-sm"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        {config.statusOptions && config.statusOptions.length > 0 && (
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v || "all")}>
            <SelectTrigger className="h-9 text-sm w-full sm:w-[180px]">
              <Filter size={14} className="mr-1.5 text-slate-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              {config.statusOptions.map((opt: any) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {config.dateField && (
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9 text-sm w-[150px]"
              placeholder="De"
            />
            <span className="text-slate-400 text-xs">ate</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9 text-sm w-[150px]"
              placeholder="Ate"
            />
          </div>
        )}

        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 px-3 h-9 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            <X size={12} />
            Limpar
          </button>
        )}
      </div>
      {hasActiveFilters && (
        <p className="text-xs text-slate-400">
          {filtered.length} resultado(s) encontrado(s) de {data.length} total
        </p>
      )}
    </div>
  )
}
