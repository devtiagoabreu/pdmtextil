import { MessageCircle } from "lucide-react"
import type { Chat } from "./types"

interface ChatListProps {
  chats: Chat[]
  selectedId: number | null
  onSelect: (id: number) => void
}

export function ChatList({ chats, selectedId, onSelect }: ChatListProps) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {chats.map((chat: any) => (
        <button
          key={chat.id}
          onClick={() => onSelect(chat.id)}
          className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
            selectedId === chat.id ? "bg-blue-50 dark:bg-blue-900/20" : ""
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0 mr-2">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-200 truncate flex items-center gap-1.5">
                {chat.naoLidas > 0 && (
                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                )}
                {chat.titulo}
              </p>
              {chat.ultimaMensagem && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  {chat.ultimaMensagem}
                </p>
              )}
              {chat.entidadeTipo ? (
                <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <MessageCircle size={10} />
                  {chat.entidadeTipo} #{chat.entidadeId}
                </span>
              ) : null}
            </div>
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              {chat.ultimaMensagemData && (
                <span className="text-[10px] text-slate-400">
                  {new Date(chat.ultimaMensagemData).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </span>
              )}
              {chat.naoLidas > 0 && (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-blue-500 text-[10px] font-bold text-white px-1">
                  {chat.naoLidas}
                </span>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
