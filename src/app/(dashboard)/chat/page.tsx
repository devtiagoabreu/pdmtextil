"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { Plus, MessageSquare, MessageCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { fetchChats } from "./components/api"
import { ChatList } from "./components/chat-list"
import { ConversationView } from "./components/conversation-view"
import { NovoChatDialog } from "./components/novo-chat-dialog"

export default function ChatPage() {
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null)
  const [showNovo, setShowNovo] = useState(false)

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
