import { ArrowLeft, Check, X, Pencil, Trash2 } from "lucide-react"
import { InfoButton } from "@/components/ui/info-button"
import type { InfoContent } from "@/lib/info-content"
import { STATUS_CORES } from "./constants"

interface PessoaHeaderProps {
  pessoa: any
  info: InfoContent | null
  editing: boolean
  onBack: () => void
  onSave: () => void
  onCancel: () => void
  onEdit: () => void
  onDelete: () => void
}

export function PessoaHeader({
  pessoa,
  info,
  editing,
  onBack,
  onSave,
  onCancel,
  onEdit,
  onDelete,
}: PessoaHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
        <ArrowLeft size={18} className="text-slate-500" />
      </button>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
            {pessoa.tipoPessoa === "PF" ? (pessoa.nome || pessoa.razaoSocial) : pessoa.razaoSocial}
            {info && <InfoButton content={info} />}
          </h1>
          {pessoa.tipoPessoa && (
            <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
              pessoa.tipoPessoa === "PF"
                ? "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400"
                : "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 dark:text-cyan-400"
            }`}>
              {pessoa.tipoPessoa === "PF" ? "PF" : "PJ"}
            </span>
          )}
          <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CORES[pessoa.status] || ""}`}>
            {pessoa.status}
          </span>
        </div>
        {pessoa.tipoPessoa === "PJ" && pessoa.nomeFantasia && (
          <p className="text-sm text-slate-500">{pessoa.nomeFantasia}</p>
        )}
      </div>
      <div className="flex gap-2">
        {editing ? (
          <>
            <button onClick={onSave} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline">
              <Check size={14} /> Salvar
            </button>
            <button onClick={onCancel} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:underline">
              <X size={14} /> Cancelar
            </button>
          </>
        ) : (
          <>
            <button onClick={onEdit} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
              <Pencil size={14} /> Editar
            </button>
            <button onClick={onDelete} className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
              <Trash2 size={14} /> Excluir
            </button>
          </>
        )}
      </div>
    </div>
  )
}
