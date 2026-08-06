"use client"

import { Upload } from "lucide-react"

interface Props {
  url: string
  setUrl: (v: string) => void
  onLoad: (force?: boolean) => void
  loading: boolean
  sheetLoading: boolean
  hasSheet: boolean
  error: string
  ttlMinutos: number | null
  setTtlMinutos: (v: number | null) => void
  ttlLoading: boolean
  onSaveTtl: () => void
  configMsg: string
}

export function UrlBar({
  url,
  setUrl,
  onLoad,
  loading,
  sheetLoading,
  hasSheet,
  error,
  ttlMinutos,
  setTtlMinutos,
  ttlLoading,
  onSaveTtl,
  configMsg,
}: Props) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
        URL da Planilha Google
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          onKeyDown={e => e.key === "Enter" && onLoad()}
        />
        <button
          onClick={() => onLoad()}
          disabled={loading || sheetLoading || !url.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          <Upload className="w-4 h-4" />
          {loading || sheetLoading ? "Carregando..." : "Carregar"}
        </button>
        {hasSheet && (
          <button
            onClick={() => onLoad(true)}
            disabled={loading || sheetLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
          >
            {loading || sheetLoading ? "Recarregando..." : "Recarregar agora"}
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center gap-2">
        <label className="text-xs text-slate-500 dark:text-slate-400">
          Atualizar dados a cada
        </label>
        <input
          type="number"
          min={1}
          max={1440}
          value={ttlMinutos ?? ""}
          onChange={e => setTtlMinutos(e.target.value === "" ? null : Number(e.target.value))}
          className="w-20 px-2 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <span className="text-xs text-slate-500 dark:text-slate-400">min</span>
        <button
          onClick={onSaveTtl}
          disabled={ttlLoading}
          className="px-3 py-1 rounded-lg border border-slate-300 dark:border-slate-700 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
        >
          {ttlLoading ? "Salvando..." : "Salvar"}
        </button>
        {configMsg && <span className="text-xs text-slate-500 dark:text-slate-400">{configMsg}</span>}
      </div>
    </div>
  )
}
