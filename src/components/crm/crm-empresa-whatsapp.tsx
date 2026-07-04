"use client"

import { useState, useEffect, useRef } from "react"
import { MessageSquare, Send, Check, CheckCheck, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Mensagem = {
  id: number
  empresaId: number
  contatoId: number | null
  mensagem: string
  tipo: "RECEBIDA" | "ENVIADA"
  status: string
  lida: boolean
  remoteJid: string | null
  createdAt: string
}

export default function CrmEmpresaWhatsapp({ empresaId }: { empresaId: string }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/crm/whatsapp?empresaId=${empresaId}`)
      .then((r) => r.json())
      .then((data) => {
        setMensagens(Array.isArray(data) ? data.reverse() : [])
      })
      .catch(() => toast.error("Erro ao carregar mensagens"))
      .finally(() => setLoading(false))
  }, [empresaId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens])

  async function enviarMensagem() {
    if (!texto.trim()) return
    setEnviando(true)
    try {
      const res = await fetch("/api/crm/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId: Number(empresaId), mensagem: texto, tipo: "ENVIADA" }),
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

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="animate-spin text-slate-400" size={20} />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-2 p-3">
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
