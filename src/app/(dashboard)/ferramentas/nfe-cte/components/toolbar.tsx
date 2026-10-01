import { CalendarDays, Loader2, MapPin, RefreshCw, Truck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Integracao, Periodo } from "./types"

interface ToolbarProps {
  integracoes: Integracao[]
  selectedId: number | null
  onSelectIntegracao: (id: number) => void
  periodo: Periodo
  onPeriodoChange: (periodo: Periodo) => void
  onAplicar: () => void
  onLimpar: () => void
  loading: boolean
  transporteFiltro: string
  onTransporteFiltroChange: (valor: string) => void
  transportes: string[]
  regiaoFiltro: string
  onRegiaoFiltroChange: (valor: string) => void
  regioes: string[]
  termo: string
  onTermoChange: (valor: string) => void
  children?: React.ReactNode
}

export function Toolbar({
  integracoes,
  selectedId,
  onSelectIntegracao,
  periodo,
  onPeriodoChange,
  onAplicar,
  onLimpar,
  loading,
  transporteFiltro,
  onTransporteFiltroChange,
  transportes,
  regiaoFiltro,
  onRegiaoFiltroChange,
  regioes,
  termo,
  onTermoChange,
  children,
}: ToolbarProps) {
  return (
    <div className="space-y-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Integração</label>
            <div className="flex gap-2 flex-wrap">
              {integracoes.map((int) => (
                <button
                  key={int.id}
                  type="button"
                  onClick={() => onSelectIntegracao(int.id)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                    selectedId === int.id
                      ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                      : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                  }`}
                >
                  {int.nome}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <div>
              <label htmlFor="cte-periodo-de" className="text-xs font-medium text-slate-500 mb-1 block">
                De
              </label>
              <Input
                id="cte-periodo-de"
                type="date"
                value={periodo.de}
                max={periodo.ate || undefined}
                onChange={(e) => onPeriodoChange({ ...periodo, de: e.target.value })}
                className="w-40"
              />
            </div>
            <div>
              <label htmlFor="cte-periodo-ate" className="text-xs font-medium text-slate-500 mb-1 block">
                Até
              </label>
              <Input
                id="cte-periodo-ate"
                type="date"
                value={periodo.ate}
                min={periodo.de || undefined}
                onChange={(e) => onPeriodoChange({ ...periodo, ate: e.target.value })}
                className="w-40"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-2">
          <Button onClick={onAplicar} disabled={loading || !selectedId} className="gap-2">
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Consultar
          </Button>
          <Button variant="outline" onClick={onLimpar} disabled={loading} className="gap-2">
            <CalendarDays size={16} />
            Limpar
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label htmlFor="cte-transportadora" className="text-xs font-medium text-slate-500 mb-1 block">
            Transportadora
          </label>
          <select
            id="cte-transportadora"
            value={transporteFiltro}
            onChange={(e) => onTransporteFiltroChange(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">Todas</option>
            {transportes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cte-regiao" className="text-xs font-medium text-slate-500 mb-1 block">
            Região do cliente
          </label>
          <select
            id="cte-regiao"
            value={regiaoFiltro}
            onChange={(e) => onRegiaoFiltroChange(e.target.value)}
            className="h-8 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-2.5 text-sm text-slate-700 dark:text-slate-200"
          >
            <option value="">Todas</option>
            {regioes.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="cte-termo" className="text-xs font-medium text-slate-500 mb-1 block">
            NF-e ou CT-e
          </label>
          <Input
            id="cte-termo"
            value={termo}
            onChange={(e) => onTermoChange(e.target.value)}
            placeholder="Ex: 35832 ou 195476"
            className="w-48"
          />
        </div>
        <div className="flex items-end gap-2 pb-1">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <Truck size={14} />
            Uma linha por NF-e
          </span>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={14} />
            Filtros e período valem para a tela inteira
          </span>
        </div>
        {children}
      </div>
    </div>
  )
}
