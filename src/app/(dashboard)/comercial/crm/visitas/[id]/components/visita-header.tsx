import { ArrowLeft, Calendar, Check, Link as LinkIcon, Pencil, Trash2, X } from "lucide-react"
import { InfoButton } from "@/components/ui/info-button"
import VisitReportButton from "@/components/crm/visit-report-button"
import SendSurveyButton from "@/components/crm/send-survey-button"
import { TIPO_LABELS } from "./constants"

interface VisitaHeaderProps {
  visita: any
  infoContent: any
  statusLabel: string
  statusColor: string
  onBack: () => void
  editing: boolean
  canEdit: boolean
  isGoogleUser: boolean
  onSave: () => void
  onCancel: () => void
  onEdit: () => void
  onDelete: () => void
  onSync: () => void
  onUnsync: () => void
  onVincular: () => void
}

export function VisitaHeader({
  visita,
  infoContent,
  statusLabel,
  statusColor,
  onBack,
  editing,
  canEdit,
  isGoogleUser,
  onSave,
  onCancel,
  onEdit,
  onDelete,
  onSync,
  onUnsync,
  onVincular,
}: VisitaHeaderProps) {
  const titulo = visita.nomeAvulso || visita.empresaNome || visita.clienteNome || `#${visita.id}`

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50 truncate">
              Visita — {titulo}{infoContent && <InfoButton content={infoContent} />}
            </h1>
            <span
              className="inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
              style={{ backgroundColor: statusColor + "20", color: statusColor }}
            >
              {statusLabel}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 truncate">
            {TIPO_LABELS[visita.tipo] || visita.tipo} — {visita.dataVisita ? new Date(visita.dataVisita + "T12:00:00").toLocaleDateString("pt-BR") : "—"}{visita.hora ? ` às ${visita.hora}` : ""}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 shrink-0">
        {editing ? (
          <>
            <button onClick={onSave} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline px-2 py-1.5 rounded-lg min-h-[36px]">
              <Check size={14} /> Salvar
            </button>
            <button onClick={onCancel} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:underline px-2 py-1.5 rounded-lg min-h-[36px]">
              <X size={14} /> Cancelar
            </button>
          </>
        ) : (
          <>
            <VisitReportButton visita={visita} />
            <SendSurveyButton visitaId={visita.id} empresaNome={visita.empresaNome || visita.clienteNome || undefined} contatoEmail={visita.contatoEmail || undefined} contatoNome={visita.contatoNome || undefined} />
            {isGoogleUser && (
              visita.googleEventId ? (
                <button onClick={onUnsync} className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline px-2 py-1.5 rounded-lg min-h-[36px]">
                  <Calendar size={14} /> Dessincronizar
                </button>
              ) : (
                <button onClick={onSync} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline px-2 py-1.5 rounded-lg min-h-[36px]">
                  <Calendar size={14} /> Sincronizar
                </button>
              )
            )}
            {canEdit && (
              <>
                {!visita.empresaId && !visita.clienteId && (
                  <button onClick={onVincular} className="flex items-center gap-1 text-xs font-medium text-orange-600 hover:underline px-2 py-1.5 rounded-lg min-h-[36px]">
                    <LinkIcon size={14} /> Vincular
                  </button>
                )}
                <button onClick={onEdit} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline px-2 py-1.5 rounded-lg min-h-[36px]">
                  <Pencil size={14} /> Editar
                </button>
                <button onClick={onDelete} className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline px-2 py-1.5 rounded-lg min-h-[36px]">
                  <Trash2 size={14} /> Excluir
                </button>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
