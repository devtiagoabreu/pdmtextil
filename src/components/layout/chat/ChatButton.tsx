"use client"

import Link from "next/link"
import { useQuery } from "@tanstack/react-query"
import { MessageSquare } from "lucide-react"

export function ChatButton() {
  const { data } = useQuery<{ naoLidas: number }>({
    queryKey: ["chats-nao-lidas"],
    queryFn: async () => {
      const res = await fetch("/api/chats/nao-lidas")
      if (!res.ok) throw new Error("Erro ao buscar não lidas")
      return res.json()
    },
    refetchInterval: 120000,
  })

  const naoLidas = data?.naoLidas ?? 0

  return (
    <Link
      href="/chat"
      aria-label={`Chat${naoLidas > 0 ? ` (${naoLidas} mensagens não lidas)` : ""}`}
      title="Chat"
      className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
    >
      <MessageSquare size={20} />
      {naoLidas > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-500 px-1 text-[10px] font-bold text-white">
          {naoLidas > 9 ? "9+" : naoLidas}
        </span>
      )}
    </Link>
  )
}
