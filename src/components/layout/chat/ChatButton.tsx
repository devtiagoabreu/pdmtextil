"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { MessageSquare } from "lucide-react"

export function ChatButton() {
  const [naoLidas, setNaoLidas] = useState(0)

  useEffect(() => {
    async function fetchNaoLidas() {
      try {
        const res = await fetch("/api/chats/nao-lidas")
        if (res.ok) {
          const data = await res.json()
          setNaoLidas(data.naoLidas)
        }
      } catch {}
    }
    fetchNaoLidas()
    const interval = setInterval(fetchNaoLidas, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Link
      href="/chat"
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
