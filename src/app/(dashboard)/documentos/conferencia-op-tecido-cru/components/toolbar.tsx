import { Loader2, RefreshCw, ScanLine, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Integracao } from "./types"

interface ToolbarProps {
  integracoes: Integracao[]
  selectedId: number | null
  onSelectIntegracao: (id: number) => void
  searchInput: string
  onSearchInputChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent) => void
  onSearch: () => void
  searchDisabled: boolean
  searchTerm: string
  onLimparBusca: () => void
  onCarregarTodos: () => void
  carregarTodosDisabled: boolean
  loadingData: boolean
  onLerCodigo: () => void
  ordemOp: "asc" | "desc"
  onOrdemOpChange: (value: "asc" | "desc") => void
  ordemEnabled: boolean
}

export function Toolbar({
  integracoes,
  selectedId,
  onSelectIntegracao,
  searchInput,
  onSearchInputChange,
  onKeyDown,
  onSearch,
  searchDisabled,
  searchTerm,
  onLimparBusca,
  onCarregarTodos,
  carregarTodosDisabled,
  loadingData,
  onLerCodigo,
  ordemOp,
  onOrdemOpChange,
  ordemEnabled,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
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
        <div className="flex gap-2 items-end flex-wrap">
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">OP / Rolo</label>
            <Input
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ex: OP 12345 ou rolo 1001"
              className="w-44 sm:w-48"
              inputMode="numeric"
            />
          </div>
          <Button onClick={onSearch} disabled={searchDisabled} className="gap-2">
            <Search size={16} />
            Buscar
          </Button>
          <Button variant="outline" onClick={onLerCodigo} disabled={loadingData} className="gap-2">
            <ScanLine size={16} />
            Ler código de barras
          </Button>
          {searchTerm && (
            <Button variant="outline" onClick={onLimparBusca} className="gap-2">
              Limpar Filtro
            </Button>
          )}
          {ordemEnabled && (
            <div>
              <label htmlFor="ordem-op" className="text-xs font-medium text-slate-500 mb-1 block">
                Ordenação
              </label>
              <select
                id="ordem-op"
                value={ordemOp}
                onChange={(e) => onOrdemOpChange(e.target.value as "asc" | "desc")}
                aria-label="Ordenar por OP"
                className="h-9 rounded-md border border-slate-200 dark:border-slate-700 bg-transparent px-3 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-slate-900"
              >
                <option value="desc">OP decrescente (maior → menor)</option>
                <option value="asc">OP crescente (menor → maior)</option>
              </select>
            </div>
          )}
          <Button variant="outline" onClick={onCarregarTodos} disabled={carregarTodosDisabled} className="gap-2">
            {loadingData ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Carregar Todas
          </Button>
        </div>
      </div>
    </div>
  )
}
