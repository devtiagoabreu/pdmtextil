import Link from "next/link"
import { Loader2, MessageSquare } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import type { Solicitacao, ChatMensagem } from "./types"

interface ChatDialogProps {
  target: Solicitacao | null
  mensagens: ChatMensagem[]
  loading: boolean
  onClose: () => void
}

export function ChatDialog({ target, mensagens, loading, onClose }: ChatDialogProps) {
  return (
    <Dialog open={!!target} onOpenChange={(open: boolean) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Chat — #{target?.id} {target?.cliente}</DialogTitle>
          <DialogDescription>
            Últimas mensagens do chat da solicitação
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-60 overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-4"><Loader2 size={16} className="animate-spin text-slate-400" /></div>
          ) : mensagens.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">Nenhuma mensagem encontrada</p>
          ) : (
            mensagens.map((msg: any) => (
              <div key={msg.id} className="bg-slate-50 dark:bg-slate-900 rounded-lg p-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{msg.remetenteNome}</span>
                  <span className="text-[10px] text-slate-400">{new Date(msg.createdAt).toLocaleString("pt-BR")}</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">{msg.mensagem}</p>
              </div>
            ))
          )}
        </div>
        <div className="flex justify-end pt-2">
          <Link
            href={`/comercial/solicitacoes/${target?.id}`}
            onClick={onClose}
            className="inline-flex items-center gap-1 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
          >
            <MessageSquare size={14} /> Ver chat completo
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  )
}
