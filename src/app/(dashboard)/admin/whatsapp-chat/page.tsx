"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, MessageSquare, Send, RefreshCw, Bot, User, ArrowLeft, Search, CheckCheck, Check, AlertTriangle } from "lucide-react"

interface Mensagem {
  id: number
  remoteJid: string | null
  mensagem: string
  tipo: "RECEBIDA" | "ENVIADA"
  status: string
  createdAt: string | null
}

interface Conversa {
  remoteJid: string
  estado: string
  dados: Record<string, any> | null
  updatedAt: string | null
}

interface Lead {
  id: number
  nome: string
  celular: string | null
  tipoPessoa: string | null
  status: string | null
}

interface ConversationSummary {
  remoteJid: string
  nome: string
  ultimaMensagem: string | null
  ultimoTipo: string | null
  ultimaData: string | null
  naoLidas: number
  total: number
  leadId: number | null
  link: string | null
}

const ESTADO_LABELS: Record<string, { label: string; color: string }> = {
  SAUDACAO: { label: "Saudacao", color: "bg-green-100 text-green-700" },
  COLETANDO_NOME: { label: "Coletando nome", color: "bg-blue-100 text-blue-700" },
  COLETANDO_DOC: { label: "Coletando documento", color: "bg-blue-100 text-blue-700" },
  CONFIRMANDO_TIPO_PESSOA: { label: "Confirmando tipo", color: "bg-yellow-100 text-yellow-700" },
  COLETANDO_INTERESSE: { label: "Coletando interesse", color: "bg-blue-100 text-blue-700" },
  CONFIRMACAO: { label: "Confirmacao", color: "bg-purple-100 text-purple-700" },
  ENCERRADO: { label: "Encerrado", color: "bg-slate-100 text-slate-600" },
  AGUARDANDO_REPRESENTANTE: { label: "Aguardando rep", color: "bg-orange-100 text-orange-700" },
  HUMANO_ASSUMINDO: { label: "Humano assumiu", color: "bg-red-100 text-red-700" },
}

export default function WhatsAppChatPage() {
  const [conversas, setConversas] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedJid, setSelectedJid] = useState<string | null>(null)
  const [mensagens, setMensagens] = useState<Mensagem[]>([])
  const [conversa, setConversa] = useState<Conversa | null>(null)
  const [lead, setLead] = useState<Lead | null>(null)
  const [loadingChat, setLoadingChat] = useState(false)
  const [inputMsg, setInputMsg] = useState("")
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const fetchConversas = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      const res = await fetch(`/api/crm/whatsapp/conversas?${params}`)
      if (!res.ok) throw new Error("Erro ao buscar")
      const data = await res.json()
      setConversas(data || [])
    } catch {
      toast.error("Erro ao carregar conversas")
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    fetchConversas()
  }, [fetchConversas])

  useEffect(() => {
    if (!selectedJid) return
    const interval = setInterval(() => {
      fetchChat(selectedJid, true)
    }, 5000)
    return () => clearInterval(interval)
  }, [selectedJid])

  const fetchChat = async (jid: string, silent = false) => {
    if (!silent) setLoadingChat(true)
    try {
      const res = await fetch(`/api/crm/whatsapp/chat?remoteJid=${encodeURIComponent(jid)}`)
      if (!res.ok) throw new Error("Erro ao buscar chat")
      const data = await res.json()
      setMensagens(data.mensagens || [])
      setConversa(data.conversa || null)
      setLead(data.lead || null)
    } catch {
      if (!silent) toast.error("Erro ao carregar mensagens")
    } finally {
      setLoadingChat(false)
    }
  }

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensagens])

  const handleSelect = (jid: string) => {
    setSelectedJid(jid)
    fetchChat(jid)
  }

  const handleSend = async () => {
    if (!selectedJid || !inputMsg.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch("/api/crm/whatsapp/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remoteJid: selectedJid, mensagem: inputMsg.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao enviar")

      if (data.envioOk) {
        toast.success("Mensagem enviada")
      } else {
        toast.warning("Salva no banco, mas envio WhatsApp falhou")
      }

      setInputMsg("")
      await fetchChat(selectedJid)
      await fetchConversas()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao enviar")
    } finally {
      setSending(false)
    }
  }

  const handleDevolverBot = async () => {
    if (!selectedJid) return
    setSending(true)
    try {
      const res = await fetch("/api/crm/whatsapp/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remoteJid: selectedJid,
          mensagem: "Conversa devolvida ao atendente automatico.",
          modo: "devolver_bot",
        }),
      })
      if (!res.ok) throw new Error("Erro ao devolver ao bot")
      toast.success("Conversa devolvida ao bot")
      await fetchChat(selectedJid)
      await fetchConversas()
    } catch {
      toast.error("Erro ao devolver ao bot")
    } finally {
      setSending(false)
    }
  }

  const handleAssumir = async () => {
    if (!selectedJid) return
    setSending(true)
    try {
      const res = await fetch("/api/crm/whatsapp/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          remoteJid: selectedJid,
          mensagem: "Representante assumiu esta conversa.",
          modo: "assumir",
        }),
      })
      if (!res.ok) throw new Error("Erro ao assumir conversa")
      toast.success("Conversa assumida pelo representante")
      await fetchChat(selectedJid)
      await fetchConversas()
    } catch {
      toast.error("Erro ao assumir conversa")
    } finally {
      setSending(false)
    }
  }

  const selected = conversas.find((c) => c.remoteJid === selectedJid)
  const estadoInfo = conversa?.estado ? ESTADO_LABELS[conversa.estado] : null
  const isHumano = conversa?.estado === "HUMANO_ASSUMINDO"

  return (
    <div className="flex h-[calc(100vh-4rem)] animate-fade-in">
      {/* Sidebar */}
      <div className={`${selectedJid ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 lg:w-96 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950`}>
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="text-blue-600" size={20} />
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-50">Chat WhatsApp</h1>
          </div>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Buscar conversa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
          ) : conversas.length === 0 ? (
            <div className="text-center p-8 text-slate-500 text-sm">Nenhuma conversa encontrada</div>
          ) : (
            conversas.map((c) => (
              <button
                key={c.remoteJid}
                onClick={() => handleSelect(c.remoteJid)}
                className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors ${
                  selectedJid === c.remoteJid ? "bg-blue-50 dark:bg-blue-950/30 border-l-2 border-l-blue-500" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm text-slate-900 dark:text-slate-100 truncate">{c.nome}</span>
                  {c.naoLidas > 0 && (
                    <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{c.naoLidas}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{c.ultimaMensagem || "Sem mensagens"}</p>
                <p className="text-[10px] text-slate-400 mt-1">{c.remoteJid?.replace(/@s\.whatsapp\.net$/, "")}</p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`${selectedJid ? "flex" : "hidden md:flex"} flex-1 flex-col bg-slate-50 dark:bg-slate-900`}>
        {!selectedJid ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto text-slate-300 mb-3" size={48} />
              <p className="text-slate-500">Selecione uma conversa para iniciar</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button onClick={() => setSelectedJid(null)} className="md:hidden p-1 text-slate-400 hover:text-slate-600">
                  <ArrowLeft size={18} />
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                      {lead?.nome || selected?.nome || selectedJid?.split("@")[0]}
                    </span>
                    {estadoInfo && (
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${estadoInfo.color}`}>
                        {estadoInfo.label}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{selectedJid?.replace(/@s\.whatsapp\.net$/, "")}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {lead && (
                  <a
                    href={`/comercial/crm/leads/${lead.id}`}
                    target="_blank"
                    className="text-xs text-blue-600 hover:underline hidden sm:inline"
                  >
                    Ver lead
                  </a>
                )}
                {isHumano ? (
                  <Button size="sm" variant="outline" onClick={handleDevolverBot} disabled={sending} className="gap-1 text-xs">
                    <Bot size={14} />
                    Devolver ao Bot
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAssumir}
                    disabled={sending}
                    className="gap-1 text-xs"
                  >
                    <User size={14} />
                    Assumir
                  </Button>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {loadingChat ? (
                <div className="flex justify-center p-8"><Loader2 className="animate-spin text-slate-400" size={24} /></div>
              ) : mensagens.length === 0 ? (
                <div className="text-center p-8 text-slate-400 text-sm">Nenhuma mensagem</div>
              ) : (
                mensagens.map((msg) => {
                  const isFromBot = msg.tipo === "ENVIADA"
                  return (
                    <div key={msg.id} className={`flex ${isFromBot ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                          isFromBot
                            ? "bg-blue-600 text-white rounded-br-md"
                            : "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-md"
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words">{msg.mensagem}</p>
                        <div className={`flex items-center gap-1 mt-1 ${isFromBot ? "justify-end" : ""}`}>
                          <span className={`text-[10px] ${isFromBot ? "text-blue-200" : "text-slate-400"}`}>
                            {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : ""}
                          </span>
                          {isFromBot && (
                            msg.status === "ENTREGUE" ? <CheckCheck size={12} className="text-blue-200" /> :
                            msg.status === "ERRO" ? <AlertTriangle size={12} className="text-red-300" /> :
                            <Check size={12} className="text-blue-300" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="px-4 py-3 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Input
                  placeholder={isHumano ? "Modo humano - sua mensagem vai direto ao cliente..." : "Digite uma mensagem..."}
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() } }}
                  disabled={sending}
                />
                <Button onClick={handleSend} disabled={!inputMsg.trim() || sending} size="icon" className="shrink-0">
                  {sending ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
                </Button>
              </div>
              {isHumano && (
                <p className="text-[10px] text-orange-600 dark:text-orange-400 mt-1.5 flex items-center gap-1">
                  <AlertTriangle size={10} />
                  Modo humano ativo — o bot nao respondera esta conversa. Clique &quot;Devolver ao Bot&quot; quando finalizar.
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
