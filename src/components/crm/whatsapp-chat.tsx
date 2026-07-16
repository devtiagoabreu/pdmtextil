"use client"

import { useState, useEffect, useRef } from "react"
import { Send, Check, CheckCheck, Loader2, MessageSquare } from "lucide-react"
import { toast } from "sonner"

export type Mensagem = {
  id: number
  empresaId: number | null
  contatoId: number | null
  mensagem: string
  tipo: "RECEBIDA" | "ENVIADA"
  status: string
  lida: boolean
  remoteJid: string | null
  createdAt: string
}

type Props = {
  remoteJid?: string
  empresaId?: string
}

export default function WhatsAppChat({ remoteJid, empresaId }: Props) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!remoteJid && !empresaId) {
      setLoading(false)
      return
    }
    const params = new URLSearchParams()
    if (empresaId) params.set("empresaId", empresaId)
    if (remoteJid) params.set("remoteJid", remoteJid)

    fetch(`/api/crm/whatsapp?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setMensagens(Array.isArray(data) ? data.reverse() : [])
      })
      .catch(() => toast.error("Erro ao carregar mensagens"))
      .finally(() => setLoading(false))
  }, [remoteJid, empresaId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens])

  async function enviarMensagem() {
    if (!texto.trim()) return
    setEnviando(true)
    try {
      const body: Record<string, any> = { mensagem: texto, tipo: "ENVIADA" }
      if (empresaId) body.empresaId = Number(empresaId)
      if (remoteJid) body.remoteJid = remoteJid

      const res = await fetch("/api/crm/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const nova = await res.json()
      setMensagens((prev) => [...prev, nova])
      setTexto("")
    } catch {
      toast.error("Erro ao enviar mensagem")
    } finally {
      setEnviando(false)
    }
  }

  function formatTime(dateStr: string) {
    return new Date(dateStr).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit",
    })
  }

  if (!remoteJid && !empresaId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <MessageSquare className="w-12 h-12 text-slate-200 dark:text-slate-700 mb-3" />
        <p className="text-sm text-slate-400">Selecione uma conversa</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-slate-400" size={20} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto space-y-2 p-3 min-h-0">
        {mensagens.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">Nenhuma mensagem</p>
        ) : (
          mensagens.map((msg) => (
            <div key={msg.id} className={`flex ${msg.tipo === "ENVIADA" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.tipo === "ENVIADA"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 rounded-bl-sm"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{msg.mensagem}</p>
                <div className={`flex items-center gap-1 mt-1 ${msg.tipo === "ENVIADA" ? "text-blue-200" : "text-slate-400"}`}>
                  <span className="text-[10px]">{formatTime(msg.createdAt)}</span>
                  {msg.tipo === "ENVIADA" && (
                    msg.status === "ENVIADA" ? <Check size={12} /> : <CheckCheck size={12} />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="border-t border-slate-200 dark:border-slate-800 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensagem() } }}
            placeholder="Digite uma mensagem..."
            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500/50"
          />
          <button
            onClick={enviarMensagem}
            disabled={enviando || !texto.trim()}
            className="rounded-lg bg-blue-600 p-2 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {enviando ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
      </div>
    </div>
  )
}
