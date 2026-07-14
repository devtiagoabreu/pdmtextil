"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { MessageSquare, Search, Check, CheckCheck, Loader2, ExternalLink } from "lucide-react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import WhatsAppChat from "@/components/crm/whatsapp-chat"

type Conversa = {
  remoteJid: string
  nome: string
  ultimaMensagem: string
  ultimoTipo: "RECEBIDA" | "ENVIADA"
  ultimaData: string
  naoLidas: number
  total: number
  leadId: number | null
  link: string | null
}

export default function ConversasPage() {
  const router = useRouter()
  const [conversas, setConversas] = useState<Conversa[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedRemoteJid, setSelectedRemoteJid] = useState<string | null>(null)
  const [selectedNome, setSelectedNome] = useState("")

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const params = search ? `?search=${encodeURIComponent(search)}` : ""
      const res = await fetch(`/api/crm/whatsapp/conversas${params}`)
      const data = await res.json()
      setConversas(Array.isArray(data) ? data : [])
    } catch {
      setConversas([])
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    carregar()
  }, [carregar])

  function formatTime(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    if (diff < 86400000) return d.toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit" })
  }

  const info = getInfoContent("/comercial/crm/conversas")

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Conversas WhatsApp{info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Acompanhe todas as conversas do WhatsApp com leads e contatos
        </p>
      </div>

      <div className="flex h-[calc(100vh-280px)] min-h-[500px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        {/* Sidebar - lista de conversas */}
        <div className="w-80 border-r border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-3 border-b border-slate-100 dark:border-slate-800">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar conversa..."
                className="w-full h-10 pl-9 pr-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-slate-400" size={20} />
              </div>
            ) : conversas.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">Nenhuma conversa encontrada</p>
            ) : (
              conversas.map((conv) => (
                <button
                  key={conv.remoteJid}
                  onClick={() => {
                    setSelectedRemoteJid(conv.remoteJid)
                    setSelectedNome(conv.nome)
                  }}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    selectedRemoteJid === conv.remoteJid ? "bg-blue-50 dark:bg-blue-950/30" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {conv.nome}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                        {conv.ultimoTipo === "ENVIADA" ? "Você: " : ""}
                        {conv.ultimaMensagem}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-[10px] text-slate-400">
                        {conv.ultimaData ? formatTime(conv.ultimaData) : ""}
                      </span>
                      {conv.naoLidas > 0 && (
                        <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-blue-600 text-[10px] font-medium text-white px-1">
                          {conv.naoLidas}
                        </span>
                      )}
                    </div>
                  </div>
                  {conv.link && (
                    <div className="mt-1">
                      <span className="text-[10px] text-blue-500 hover:text-blue-700 inline-flex items-center gap-0.5"
                        onClick={(e) => { e.stopPropagation(); router.push(conv.link!) }}>
                        <ExternalLink size={10} /> Abrir no CRM
                      </span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Painel principal - chat */}
        <div className="flex-1 flex flex-col">
          {selectedRemoteJid ? (
            <>
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{selectedNome}</h3>
                <p className="text-[10px] text-slate-400">{selectedRemoteJid}</p>
              </div>
              <div className="flex-1">
                <WhatsAppChat remoteJid={selectedRemoteJid} />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <MessageSquare className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
              <p className="text-sm font-medium text-slate-400">Selecione uma conversa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
