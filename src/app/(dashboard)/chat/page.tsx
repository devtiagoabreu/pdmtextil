"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useSession } from "next-auth/react"
import { MessageSquare, Plus, Send, CheckCheck, Users, ArrowLeft, MessageCircle, AtSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EmojiPicker } from "@/components/chat/emoji-picker"
import { toast } from "sonner"

type Chat = {
  id: number
  tipo: string
  titulo: string
  entidadeTipo: string | null
  entidadeId: number | null
  criadoPor: number
  updatedAt: string
  createdAt: string
  ultimaMensagem: string | null
  ultimaMensagemData: string | null
  naoLidas: number
  participantes: number
}

type Mensagem = {
  id: number
  chatId: number
  remetenteId: number
  mensagem: string
  createdAt: string
  remetenteNome?: string
}

async function fetchChats(): Promise<Chat[]> {
  const res = await fetch("/api/chats")
  if (!res.ok) throw new Error("Erro ao carregar chats")
  return res.json()
}

async function fetchMensagens(chatId: number): Promise<{ mensagens: Mensagem[] }> {
  const res = await fetch(`/api/chats/${chatId}/mensagens`)
  if (!res.ok) throw new Error("Erro ao carregar mensagens")
  return res.json()
}

async function enviarMensagem({ chatId, mensagem }: { chatId: number; mensagem: string }) {
  const res = await fetch(`/api/chats/${chatId}/mensagens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mensagem }),
  })
  if (!res.ok) throw new Error("Erro ao enviar mensagem")
  return res.json()
}

async function marcarLidas(chatId: number) {
  await fetch(`/api/chats/${chatId}/ler`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  })
}

function ChatList({
  chats,
  selectedId,
  onSelect,
}: {
  chats: Chat[]
  selectedId: number | null
  onSelect: (id: number) => void
}) {
  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {chats.map((chat) => (
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
              {chat.entidadeTipo && (
                <span className="inline-flex items-center gap-0.5 mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                  <MessageCircle size={10} />
                  {chat.entidadeTipo} #{chat.entidadeId}
                </span>
              )}
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

function NovoChatDialog({ onClose }: { onClose: () => void }) {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState("")
  const [mensagem, setMensagem] = useState("")
  const [destinatarios, setDestinatarios] = useState<string>("")
  const [usuarios, setUsuarios] = useState<{ id: number; name: string }[]>([])
  const [selectedUsers, setSelectedUsers] = useState<number[]>([])
  const [destOpen, setDestOpen] = useState(false)
  const destRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/admin/usuarios")
      .then((r) => r.json())
      .then((data) => setUsuarios(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!destOpen) return
    const handle = (e: MouseEvent) => {
      if (destRef.current && !destRef.current.contains(e.target as Node)) setDestOpen(false)
    }
    document.addEventListener("mousedown", handle)
    return () => document.removeEventListener("mousedown", handle)
  }, [destOpen])

  const criarChat = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          mensagem,
          destinatarios: destinatarios === "todos" ? "todos" : [parseInt(destinatarios)],
        }),
      })
      if (!res.ok) throw new Error("Erro ao criar chat")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chats"] })
      toast.success("Chat criado!")
      onClose()
    },
    onError: (err) => toast.error(err instanceof Error ? err.message : "Erro ao criar chat"),
  })

  const destLabel = !destinatarios
    ? "Selecione..."
    : destinatarios === "todos"
      ? "Todos os usuários"
      : usuarios.find((u) => u.id.toString() === destinatarios)?.name || "Selecione..."

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md mx-4 p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-slate-50">Novo Chat</h3>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-500">Título</label>
            <input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              className="w-full mt-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 text-sm"
              placeholder="Assunto da conversa"
            />
          </div>

          <div ref={destRef} className="relative">
            <label className="text-xs font-medium text-slate-500">Destinatários</label>
            <button
              type="button"
              onClick={() => setDestOpen(!destOpen)}
              className="w-full mt-1 h-9 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 text-sm text-left flex items-center justify-between text-slate-900 dark:text-slate-200"
            >
              <span className={destinatarios ? "" : "text-slate-400"}>{destLabel}</span>
              <svg className={`w-4 h-4 transition-transform ${destOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {destOpen && (
              <div className="absolute z-10 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-[200px] overflow-y-auto">
                <button
                  type="button"
                  onClick={() => { setDestinatarios("todos"); setDestOpen(false) }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${destinatarios === "todos" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-slate-200"}`}
                >Todos os usuários</button>
                {usuarios
                  .filter((u) => u.id !== parseInt(session?.user?.id || "0"))
                  .map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => { setDestinatarios(u.id.toString()); setDestOpen(false) }}
                      className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-700 ${destinatarios === u.id.toString() ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" : "text-slate-900 dark:text-slate-200"}`}
                    >{u.name}</button>
                  ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Mensagem</label>
            <textarea
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              className="w-full mt-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2 text-sm min-h-[80px] resize-none"
              placeholder="Digite sua mensagem..."
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={onClose}>Cancelar</Button>
          <Button
            className="flex-1"
            onClick={() => criarChat.mutate()}
            disabled={!titulo.trim() || !mensagem.trim() || !destinatarios || criarChat.isPending}
          >
            {criarChat.isPending ? "Criando..." : "Criar Chat"}
          </Button>
        </div>
      </div>
    </div>
  )
}

function ConversationView({ chatId, onBack }: { chatId: number; onBack: () => void }) {
  const { data: session } = useSession()
  const userId = parseInt(session?.user?.id || "0")
  const [mensagem, setMensagem] = useState("")
  const mensagensEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const mentionRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()

  const [mentionSearch, setMentionSearch] = useState("")
  const [mentionIndex, setMentionIndex] = useState(0)
  const [cursorPos, setCursorPos] = useState(0)

  const { data: chat } = useQuery({
    queryKey: ["chat", chatId],
    queryFn: () => fetch(`/api/chats/${chatId}`).then((r) => r.json()),
  })

  const { data: msgsData, refetch } = useQuery({
    queryKey: ["mensagens", chatId],
    queryFn: () => fetchMensagens(chatId),
    refetchInterval: 3000,
  })

  const participantes = (chat?.usuarios as { id: number; name: string }[]) || []
  const activeUsers = participantes.filter(u => u.id !== userId)

  const textoAntesCursor = mensagem.slice(0, cursorPos)
  const mentionMatch = textoAntesCursor.match(/@(\w*)$/)
  const isMentioning = mentionMatch !== null
  const mentionQuery = mentionMatch?.[1]?.toLowerCase() || ""

  const mentionOptions = isMentioning && mentionQuery !== undefined
    ? activeUsers.filter(u =>
        u.name.toLowerCase().includes(mentionQuery)
      ).slice(0, 8)
    : []

  useEffect(() => {
    setMentionIndex(0)
  }, [mentionQuery])

  useEffect(() => {
    marcarLidas(chatId).catch(() => {})
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

  function renderMensagem(texto: string) {
    const parts = texto.split(/(@\w[\wÀ-ÿ\s]*\w|\B@\w+)/g)
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const nome = part.slice(1).trim()
        const isParticipant = activeUsers.some(u => u.name.toLowerCase() === nome.toLowerCase())
        if (isParticipant) {
          return (
            <span key={i} className="font-semibold text-blue-500 dark:text-blue-400">
              {part}
            </span>
          )
        }
      }
      return part
    })
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
        {mensagens.map((msg) => {
          const isMine = msg.remetenteId === userId
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
                <p className="whitespace-pre-wrap break-words">{renderMensagem(msg.mensagem)}</p>
                <div className={`flex items-center gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"}`}>
                  <span className={`text-[10px] ${isMine ? "text-blue-200" : "text-slate-400"}`}>
                    {new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {isMine && <CheckCheck size={12} className="text-blue-200" />}
                </div>
              </div>
            </div>
          )
        })}
        <div ref={mensagensEndRef} />
      </div>

      <div className="border-t border-slate-200 dark:border-slate-700 p-4 relative">
        {isMentioning && mentionOptions.length > 0 && (
          <div
            ref={mentionRef}
            className="absolute bottom-full left-4 mb-1 w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-50"
          >
            <div className="px-3 py-1.5 text-[10px] font-medium text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
              Participantes
            </div>
            {mentionOptions.map((user, i) => (
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

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null)
  const [showNovo, setShowNovo] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const chatId = params.get("chatId")
    if (chatId) setSelectedChatId(parseInt(chatId))
  }, [])

  const { data: chats = [] } = useQuery({
    queryKey: ["chats"],
    queryFn: fetchChats,
    refetchInterval: 30000,
  })

  const selectedChat = selectedChatId

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Chat Corporativo</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{chats.length} conversa(s)</p>
        </div>
        <Button onClick={() => setShowNovo(true)} className="flex items-center gap-2">
          <Plus size={16} />
          Novo Chat
        </Button>
      </div>

      <div className="flex-1 flex rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden min-h-0">
        {/* Sidebar - Chat List */}
        <div className={`w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col ${selectedChat ? "hidden md:flex" : "flex"}`}>
          <div className="overflow-y-auto flex-1">
            {chats.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 p-6 text-center">
                <MessageSquare size={40} className="mb-3 opacity-50" />
                <p className="text-sm font-medium">Nenhuma conversa</p>
                <p className="text-xs mt-1">Clique em &ldquo;Novo Chat&rdquo; para iniciar</p>
              </div>
            ) : (
              <ChatList chats={chats} selectedId={selectedChatId} onSelect={setSelectedChatId} />
            )}
          </div>
        </div>

        {/* Main - Conversation */}
        <div className={`flex-1 flex flex-col min-w-0 ${!selectedChat ? "hidden md:flex" : "flex"}`}>
          {selectedChat ? (
            <ConversationView chatId={selectedChat} onBack={() => setSelectedChatId(null)} />
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-400">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">Selecione uma conversa</p>
                <p className="text-xs mt-1">Escolha um chat à esquerda para começar</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showNovo && <NovoChatDialog onClose={() => setShowNovo(false)} />}
    </div>
  )
}
