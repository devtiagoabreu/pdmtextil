"use client"

import { useState, useEffect, useRef } from "react"
import { MessageSquare, Send, Check, CheckCheck, Loader2, User, Bot, AlertTriangle } from "lucide-react"
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

export default function CrmPessoaWhatsapp({ pessoaId }: { pessoaId: string }) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [loading, setLoading] = useState(true)
  const [texto, setTexto] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [remoteJid, setRemoteJid] = useState<string | null>(null)
  const [isHumano, setIsHumano] = useState(false)
  const [trocandoModo, setTrocandoModo] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/crm/whatsapp?empresaId=${pessoaId}`)
      .then((r) => r.json())
      .then((data) => {
        const lista = Array.isArray(data) ? data.reverse() : []
        setMensagens(lista)
        const jid = lista.find((m: Mensagem) => m.remoteJid)?.remoteJid
        if (jid) {
          setRemoteJid(jid)
          fetch(`/api/crm/whatsapp/chat?remoteJid=${encodeURIComponent(jid)}`)
            .then((r) => r.json())
            .then((d) => setIsHumano(d.conversa?.estado === "HUMANO_ASSUMINDO"))
            .catch(() => {})
        }
      })
      .catch(() => toast.error("Erro ao carregar mensagens"))
      .finally(() => setLoading(false))
  }, [pessoaId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens])

  async function enviarMensagem() {
    if (!texto.trim()) return
    setEnviando(true)
    try {
      if (remoteJid) {
        const res = await fetch("/api/crm/whatsapp/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ remoteJid, mensagem: texto }),
        })
        if (!res.ok) throw new Error()
        const data = await res.json()
        setMensagens((prev) => [...prev, data.mensagem])
      } else {
        const res = await fetch("/api/crm/whatsapp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ empresaId: Number(pessoaId), mensagem: texto, tipo: "ENVIADA" }),
        })
        if (!res.ok) throw new Error()
        const nova = await res.json()
        setMensagens((prev) => [...prev, nova])
      }
      setTexto("")
    } catch {
      toast.error("Erro ao enviar mensagem")
    } finally {
      setEnviando(false)
    }
  }

  async function trocarModo(modo: "assumir" | "devolver_bot") {
    if (!remoteJid) return
    setTrocandoModo(true)
    try {
      const res = await fetch("/api/crm/whatsapp/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remoteJid,
          mensagem: modo === "assumir" ? "Assumindo atendimento." : "Conversa devolvida ao atendente automatico.",
          modo,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      setMensagens((prev) => [...prev, data.mensagem])
      setIsHumano(modo === "assumir")
      toast.success(modo === "assumir" ? "Atendimento assumido" : "Conversa devolvida ao bot")
    } catch {
      toast.error("Erro ao alterar modo")
    } finally {
      setTrocandoModo(false)
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
      {remoteJid && (
        <div className={`flex items-center justify-between px-4 py-2 border-b border-slate-200 dark:border-slate-800 shrink-0 ${
          isHumano ? "bg-orange-50 dark:bg-orange-950/20" : "bg-green-50 dark:bg-green-950/20"
        }`}>
          <div className="flex items-center gap-2">
            {isHumano ? (
              <>
                <AlertTriangle size={14} className="text-orange-500" />
                <span className="text-xs font-medium text-orange-700 dark:text-orange-400">Modo humano ativo</span>
              </>
            ) : (
              <>
                <Bot size={14} className="text-green-600" />
                <span className="text-xs font-medium text-green-700 dark:text-green-400">Bot ativo</span>
              </>
            )}
          </div>
          <button
            onClick={() => trocarModo(isHumano ? "devolver_bot" : "assumir")}
            disabled={trocandoModo}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              isHumano
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-orange-500 text-white hover:bg-orange-600"
            } disabled:opacity-50`}
          >
            {trocandoModo ? <Loader2 size={12} className="animate-spin" /> : isHumano ? <Bot size={12} /> : <User size={12} />}
            {isHumano ? "Devolver ao Bot" : "Assumir Atendimento"}
          </button>
        </div>
      )}
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
        {isHumano && (
          <p className="text-[10px] text-orange-600 dark:text-orange-400 mb-1.5 flex items-center gap-1">
            <AlertTriangle size={10} />
            Modo humano ativo — o bot nao respondera esta conversa.
          </p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensagem() } }}
            placeholder={isHumano ? "Modo humano - sua mensagem vai direto ao cliente..." : "Digite uma mensagem..."}
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