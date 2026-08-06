import { FileText, Loader2, Printer, RefreshCw, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Integracao, OrientacaoPdf } from "./types"
import { ORIENTACAO_LABEL } from "./utils"

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
  orientacaoPdf: OrientacaoPdf
  onToggleOrientacao: () => void
  showPdfButtons: boolean
  selectedCount: number
  gerandoPdf: boolean
  onGerarPdfsSelecionados: () => void
  onGerarPdfConsolidado: () => void
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
  orientacaoPdf,
  onToggleOrientacao,
  showPdfButtons,
  selectedCount,
  gerandoPdf,
  onGerarPdfsSelecionados,
  onGerarPdfConsolidado,
}: ToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Integração</label>
          <div className="flex gap-2 flex-wrap">
            {integracoes.map((int: any) => (
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
            <label className="text-xs font-medium text-slate-500 mb-1 block">
              Nº Pedido / Romaneio
            </label>
            <Input
              value={searchInput}
              onChange={(e) => onSearchInputChange(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ex: 7603 ou 22742"
              className="w-48"
            />
          </div>
          <Button onClick={onSearch} disabled={searchDisabled} className="gap-2">
            <Search size={16} />
            Buscar
          </Button>
          {searchTerm && (
            <Button variant="outline" onClick={onLimparBusca} className="gap-2">
              Limpar Filtro
            </Button>
          )}
          <Button variant="outline" onClick={onCarregarTodos} disabled={carregarTodosDisabled} className="gap-2">
            {loadingData ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Carregar Todos
          </Button>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <span>PDF:</span>
          <button
            type="button"
            onClick={onToggleOrientacao}
            className={`px-2 py-1 text-xs rounded border transition-colors ${
              orientacaoPdf === "portrait"
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400"
                : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
            }`}
          >
            {ORIENTACAO_LABEL[orientacaoPdf]}
          </button>
        </div>
        {showPdfButtons && (
          <>
            <Button
              onClick={onGerarPdfsSelecionados}
              disabled={selectedCount === 0 || gerandoPdf}
              className="gap-2"
            >
              {gerandoPdf ? <Loader2 size={16} className="animate-spin" /> : <Printer size={16} />}
              PDF ({selectedCount})
            </Button>
            <Button
              onClick={onGerarPdfConsolidado}
              disabled={selectedCount === 0 || gerandoPdf}
              className="gap-2 bg-purple-700 hover:bg-purple-800 text-white"
            >
              {gerandoPdf ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
              Consolidado ({selectedCount})
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
