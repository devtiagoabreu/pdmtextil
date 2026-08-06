import { useState, useEffect, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { MessageSquare, Send, Users, ArrowLeft, AtSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmojiPicker } from "@/components/chat/emoji-picker"
import { toast } from "sonner"
import { fetchMensagens, enviarMensagem, marcarLidas } from "./api"
import { isWithin5Min } from "./utils"
import { MessageBubble } from "./message-bubble"

export function ConversationView({ chatId, onBack }: { chatId: number; onBack: () => void }) {
  const { data: session } = useSession()
  const userId = parseInt(session?.user?.id || "0")
  const [mensagem, setMensagem] = useState("")
  const mensagensEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const queryClient = useQueryClient()

  const [mentionIndex, setMentionIndex] = useState(0)
  const [cursorPos, setCursorPos] = useState(0)
  const [editMsgId, setEditMsgId] = useState<number | null>(null)
  const [editText, setEditText] = useState("")

  const { data: chat } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => fetch(`/api/chats/${chatId}`).then((r: any) => r.json()),
  })

  const { data: msgsData, refetch } = useQuery({
    queryKey: ["mensagens", chatId],
    queryFn: () => fetchMensagens(chatId),
    refetchInterval: 30000,
  })

  const { data: allUsers = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ["all-users"],
    queryFn: () => fetch("/api/usuarios/ativos").then((r: any) => r.json()),
    staleTime: 60000,
  })

  const allUsersArr = Array.isArray(allUsers) ? allUsers : []
  const mentionUsers = allUsersArr.filter((u: any) => u.id !== userId)

  const textoAntesCursor = mensagem.slice(0, cursorPos)
  const mentionMatch = textoAntesCursor.match(/@([\wÀ-ÿ]*)$/)
  const isMentioning = mentionMatch !== null
  const mentionQuery = mentionMatch?.[1]?.toLowerCase() || ""

  const mentionOptions = isMentioning && mentionQuery !== undefined
    ? mentionUsers.filter((u: any) =>
        u.name.toLowerCase().includes(mentionQuery)
      )
    : []

  useEffect(() => {
    setMentionIndex(0)
  }, [mentionQuery])

  useEffect(() => {
    marcarLidas(chatId).catch(console.error)
    queryClient.invalidateQueries({ queryKey: ["chats"] })
  }, [chatId, queryClient])

  useEffect(() => {
    mensagensEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgsData?.mensagens])

  const sendMsg = useMutation({
    mutationFn: () => enviarMensagem({ chatId, mensagem: mensagem.trim() }),
    onSuccess: () => {
      setMensagem("")
      refetch()
      queryClient.invalidateQueries({ queryKey: ["chats"] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro ao enviar"),
  })

  const editMsg = useMutation({
    mutationFn: async ({ msgId, mensagem }: { msgId: number; mensagem: string }) => {
      const res = await fetch(`/api/chats/${chatId}/mensagens/${msgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensagem }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao editar")
      }
      return res.json()
    },
    onSuccess: () => {
      setEditMsgId(null)
      setEditText("")
      refetch()
      queryClient.invalidateQueries({ queryKey: ["chats"] })
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro ao editar"),
  })

  const deleteMsg = useMutation({
    mutationFn: async (msgId: number) => {
      const res = await fetch(`/api/chats/${chatId}/mensagens/${msgId}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao apagar")
      }
    },
    onSuccess: () => {
      refetch()
      queryClient.invalidateQueries({ queryKey: ["chats"] })
      toast.success("Mensagem apagada")
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro ao apagar"),
  })

  const insertMention = (userName: string) => {
    const el = inputRef.current
    if (!el) return
    const atPos = mensagem.lastIndexOf("@", cursorPos - 1)
    if (atPos === -1) return
    const before = mensagem.slice(0, atPos)
    const after = mensagem.slice(cursorPos)
    const nova = `${before}@${userName} ${after}`
    setMensagem(nova)
    requestAnimationFrame(() => {
      el.focus()
      const newPos = atPos + userName.length + 2
      el.selectionStart = el.selectionEnd = newPos
      setCursorPos(newPos)
    })
  }

  const insertEmoji = (emoji: string) => {
    const el = inputRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const nova = mensagem.slice(0, start) + emoji + mensagem.slice(end)
    setMensagem(nova)
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + emoji.length
      el.focus()
    })
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMensagem(e.target.value)
    setCursorPos(e.target.selectionStart)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (isMentioning && mentionOptions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setMentionIndex(i => Math.min(i + 1, mentionOptions.length - 1))
        return
      }
      if (e.key === "ArrowUp") {
        e.preventDefault()
        setMentionIndex(i => Math.max(i - 1, 0))
        return
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault()
        insertMention(mentionOptions[mentionIndex].name)
        return
      }
      if (e.key === "Escape") {
        e.preventDefault()
        setMensagem(mensagem)
        return
      }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      if (mensagem.trim()) sendMsg.mutate()
    }
  }

  const mensagens = msgsData?.mensagens || []

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
        <button onClick={onBack} className="md:hidden p-1 text-slate-500 hover:text-slate-700">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="font-medium text-sm text-slate-900 dark:text-slate-200">{chat?.titulo || "Carregando..."}</p>
          {chat?.participantes && (
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Users size={12} />
              {(chat.participantes as any[])?.length || 0} participante(s)
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {mensagens.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <MessageSquare size={32} className="mb-2 opacity-50" />
            <p className="text-sm">Nenhuma mensagem ainda</p>
          </div>
        )}
        {mensagens.map((msg: any) => {
          const isMine = msg.remetenteId === userId
          const podeEditar = isMine && isWithin5Min(msg.createdAt)
          return (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isMine={isMine}
              podeEditar={podeEditar}
              allUsers={allUsersArr}
              editing={editMsgId === msg.id}
              editText={editText}
              editPending={editMsg.isPending}
              setEditText={setEditText}
              onStartEdit={() => { setEditMsgId(msg.id); setEditText(msg.mensagem) }}
              onCancelEdit={() => setEditMsgId(null)}
              onSaveEdit={() => editMsg.mutate({ msgId: msg.id, mensagem: editText.trim() })}
              onDelete={() => {
                if (window.confirm("Apagar esta mensagem?")) deleteMsg.mutate(msg.id)
              }}
            />
          )
        })}
        <div ref={mensagensEndRef} />
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 p-4 relative">
        {isMentioning && mentionOptions.length > 0 && (
          <div
            className="absolute bottom-full left-4 mb-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto"
          >
            <div className="px-3 py-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
              Usuários
            </div>
            {mentionOptions.map((user: any, i: any) => (
              <button
                key={user.id}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); insertMention(user.name) }}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  i === mentionIndex
                    ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <AtSign size={14} className="shrink-0 text-slate-400" />
                <span className="font-medium">{user.name}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={mensagem}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onSelect={(e) => setCursorPos(e.currentTarget.selectionStart)}
              onClick={(e) => setCursorPos(e.currentTarget.selectionStart)}
              placeholder="Digite sua mensagem... (@ para mencionar)"
              className="w-full min-h-[40px] max-h-[120px] rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm resize-none"
              rows={1}
            />
          </div>
          <EmojiPicker onSelect={insertEmoji} />
          <Button
            size="icon"
            onClick={() => sendMsg.mutate()}
            disabled={!mensagem.trim() || sendMsg.isPending}
            className="h-10 w-10 flex-shrink-0"
          >
            <Send size={16} />
          </Button>
        </div>
      </div>
    </div>
  )
}
