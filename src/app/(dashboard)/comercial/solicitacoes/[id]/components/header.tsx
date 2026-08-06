import { ArrowLeft, Pencil, Trash2, Download } from "lucide-react"
import Link from "next/link"
import { InfoButton } from "@/components/ui/info-button"
import { Button } from "@/components/ui/button"
import { EntityChatButton } from "@/components/chat/entity-chat-button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { InfoContent } from "@/lib/info-content"

interface HeaderProps {
  id: string
  sol: any
  info: InfoContent | null
  statusLabel: string
  statusRgba: string
  statusColor: string
  statusOptions: { value: string; label: string }[]
  novoStatus: string
  setNovoStatus: (v: string) => void
  statusLoading: boolean
  onStatusChange: () => void
  onRefetch: () => void
  onExportPdf: () => void
  onDelete: () => void
}

export function Header({
  id,
  sol,
  info,
  statusLabel,
  statusRgba,
  statusColor,
  statusOptions,
  novoStatus,
  setNovoStatus,
  statusLoading,
  onStatusChange,
  onRefetch,
  onExportPdf,
  onDelete,
}: HeaderProps) {
  return (
    <>
      <div className="flex items-center gap-4">
        <Link
          href="/comercial/solicitacoes"
          className="flex items-center gap-1 text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>
        <button
          onClick={onRefetch}
          className="text-sm text-blue-600 hover:underline"
        >
          Atualizar
        </button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            #{sol.id} - {sol.cliente}
            {info && <InfoButton content={info} />}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">{sol.projeto || "Sem projeto"}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full px-3 py-1 text-sm font-medium" style={{
            backgroundColor: statusRgba,
            color: statusColor,
          }}>
            {statusLabel}
          </span>
          <div className="flex items-center gap-1">
            <Select value={novoStatus} onValueChange={(v: string | null) => { if (v) setNovoStatus(v) }}>
              <SelectTrigger className="h-8 text-xs w-44">
                <SelectValue placeholder="Alterar status..." />
              </SelectTrigger>
              <SelectContent>
                {statusOptions
                  .filter((s: any) => s.value !== sol.status)
                  .map((s: any) => (
                    <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={onStatusChange}
              disabled={!novoStatus || statusLoading}
              className="h-8 text-xs whitespace-nowrap"
            >
              {statusLoading ? "..." : "OK"}
            </Button>
          </div>
          <EntityChatButton
            entidadeTipo="SOLICITACAO"
            entidadeId={sol.id}
            titulo={`Solicitação #${sol.id} - ${sol.cliente}`}
            mensagem={`Chat vinculado à solicitação #${sol.id} - ${sol.cliente}${sol.projeto ? ` (${sol.projeto})` : ""}`}
            variant="outline"
            size="sm"
          />
          <Link
            href={`/comercial/solicitacoes/${id}/editar`}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Pencil size={14} />
            Editar
          </Link>
          <button
            onClick={onExportPdf}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800"
          >
            <Download size={14} />
            Exportar PDF
          </button>
          <button
            onClick={onDelete}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
          >
            <Trash2 size={14} />
            Excluir
          </button>
        </div>
      </div>
    </>
  )
}
