import { CheckCheck, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { renderMensagem } from "./utils"

interface MessageBubbleProps {
  msg: any
  isMine: boolean
  podeEditar: boolean
  allUsers: { id: number; name: string }[]
  editing: boolean
  editText: string
  editPending: boolean
  setEditText: (v: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  onDelete: () => void
}

export function MessageBubble({
  msg,
  isMine,
  podeEditar,
  allUsers,
  editing,
  editText,
  editPending,
  setEditText,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onDelete,
}: MessageBubbleProps) {
  return (
    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-xl px-4 py-2 text-sm ${
          isMine
            ? "bg-blue-600 text-white rounded-br-sm"
            : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 rounded-bl-sm"
        }`}
      >
        {!isMine && msg.remetenteNome && (
          <p className="text-[10px] font-semibold mb-0.5 opacity-70">{msg.remetenteNome}</p>
        )}
        {editing ? (
          <div className="flex flex-col gap-2">
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm resize-none min-h-[60px] ${
                isMine ? "border-blue-300 bg-blue-50 text-slate-900" : "border-slate-300 bg-white text-slate-900"
              }`}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                onClick={onCancelEdit}
                className="h-7 text-xs"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={onSaveEdit}
                disabled={!editText.trim() || editPending}
                className="h-7 text-xs"
              >
                {editPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        ) : (
          <p className="whitespace-pre-wrap break-words">{renderMensagem(msg.mensagem, allUsers)}</p>
        )}
        <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
          <span className={`text-[10px] ${isMine ? "text-blue-200" : "text-slate-400"}`}>
            {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {isMine && <CheckCheck size={12} className="text-blue-200" />}
          {podeEditar && !editing && (
            <div className="flex gap-1 ml-2">
              <button
                onClick={onStartEdit}
                className="p-0.5 rounded hover:bg-blue-500/20 transition-colors"
                title="Editar"
              >
                <Pencil size={12} className={isMine ? "text-blue-200" : ""} />
              </button>
              <button
                onClick={onDelete}
                className="p-0.5 rounded hover:bg-red-500/20 transition-colors"
                title="Apagar"
              >
                <Trash2 size={12} className={isMine ? "text-blue-200" : ""} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
