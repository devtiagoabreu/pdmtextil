"use client"

import { useEffect, useRef, useState } from "react"
import { Maximize2, Minimize2 } from "lucide-react"

const CHANNEL = "kanban-crm-sync"

export function FloatableKanban({ tipo, children }: { tipo: string; children: React.ReactNode }) {
  const [isDetached, setIsDetached] = useState(false)
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL)
    channelRef.current = channel
    channel.onmessage = (event) => {
      if (event.data.type === "reattach") setIsDetached(false)
    }
    return () => channel.close()
  }, [])

  const handleDetach = () => {
    window.open(`/kanban-crm?tipo=${tipo}`, "kanban-crm", "width=1400,height=900")
    setIsDetached(true)
  }

  const handleReattach = () => {
    channelRef.current?.postMessage({ type: "reattach" })
    setIsDetached(false)
  }

  if (isDetached) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <Maximize2 size={48} className="mx-auto text-slate-300 mb-3" />
        <p className="text-lg font-medium">Kanban aberto em janela separada</p>
        <p className="text-sm text-slate-400 mb-4">Você pode arrastá-lo para outra tela ou monitor</p>
        <button
          onClick={handleReattach}
          className="inline-flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Minimize2 size={14} /> Fechar janela e recolocar
        </button>
      </div>
    )
  }

  return (
    <>
      <div className="flex justify-end mb-2">
        <button
          onClick={handleDetach}
          className="inline-flex items-center gap-1 text-sm border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Descolar kanban em janela flutuante"
        >
          <Maximize2 size={14} /> Flutuar
        </button>
      </div>
      {children}
    </>
  )
}
