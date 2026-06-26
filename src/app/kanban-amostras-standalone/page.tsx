"use client"

import { useEffect, useRef } from "react"
import { KanbanAmostras } from "@/components/kanban/kanban-amostras"
import { Minimize2 } from "lucide-react"

const CHANNEL = "kanban-amostras-sync"

export default function KanbanAmostrasStandalonePage() {
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL)
    channelRef.current = channel
    channel.onmessage = (event) => {
      if (event.data.type === "reattach") {
        window.close()
      }
    }
    channel.onmessageerror = () => {}
    return () => channel.close()
  }, [])

  const handleReattach = () => {
    channelRef.current?.postMessage({ type: "reattach" })
    window.close()
  }

  return (
    <div className="flex flex-col h-screen animate-fade-in bg-slate-50 dark:bg-slate-950">
      <div className="flex items-center justify-between shrink-0 px-6 pt-4 pb-2">
        <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">Kanban — Amostras de Desenvolvimento</h1>
        <button
          onClick={handleReattach}
          className="inline-flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          title="Recolocar kanban na aplicação"
        >
          <Minimize2 size={14} /> Recolocar na aplicação
        </button>
      </div>
      <div className="flex-1 min-h-0 flex flex-col px-6 pb-4">
        <KanbanAmostras />
      </div>
    </div>
  )
}
