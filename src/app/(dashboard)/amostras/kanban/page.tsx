"use client"

import { useRef, useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { KanbanAmostras } from "@/components/kanban/kanban-amostras"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Maximize2, Minimize2 } from "lucide-react"
import Link from "next/link"

const CHANNEL = "kanban-amostras-sync"

export default function KanbanAmostrasPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [isDetached, setIsDetached] = useState(false)
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL)
    channelRef.current = channel
    channel.onmessage = (event) => {
      if (event.data.type === "reattach") {
        setIsDetached(false)
      }
    }
    channel.onmessageerror = () => {}
    return () => channel.close()
  }, [])

  const handleDetach = () => {
    window.open("/kanban-amostras-standalone", "kanban-amostras", "width=1400,height=900")
    setIsDetached(true)
  }

  const handleReattach = () => {
    channelRef.current?.postMessage({ type: "reattach" })
    setIsDetached(false)
  }

  return (
    <div className="flex flex-col h-screen animate-fade-in">
      <div className="flex items-center justify-between shrink-0 px-6 pt-6 pb-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Kanban — Amostras{info && <InfoButton content={info} />}</h1>
          <span className="text-xs text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">Arraste os cards para mover</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/amostras" className="text-sm text-blue-600 hover:underline">
            Lista
          </Link>
          <button
            onClick={isDetached ? handleReattach : handleDetach}
            className="inline-flex items-center gap-1 text-sm border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={isDetached ? "Recolocar kanban na aplicação" : "Descolar kanban em janela flutuante"}
          >
            {isDetached ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isDetached ? "Recolocar" : "Flutuar"}
          </button>
        </div>
      </div>

      {isDetached ? (
        <div className="flex-1 flex items-center justify-center text-slate-500">
          <div className="text-center space-y-3">
            <Maximize2 size={48} className="mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-lg font-medium">Kanban aberto em janela separada</p>
            <p className="text-sm text-slate-400">Você pode arrastá-lo para outra tela ou monitor</p>
            <button
              onClick={handleReattach}
              className="inline-flex items-center gap-1.5 text-sm bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Minimize2 size={14} /> Fechar janela e recolocar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col px-6 pb-6">
          <KanbanAmostras />
        </div>
      )}
    </div>
  )
}
