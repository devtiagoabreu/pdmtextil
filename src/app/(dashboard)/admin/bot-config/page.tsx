"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { toast } from "sonner"
import { Loader2, Save, Bot, ArrowLeft, Activity, RefreshCw } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

interface UsuarioItem {
  id: number
  name: string
  email: string
  role: string
  ativo: boolean
  celWhatsapp: string | null
}

interface MonitoramentoConfig {
  ativo: boolean
  emailAlerta: boolean
  notificacaoPdm: boolean
  ultimoCheck: string | null
  ultimoStatus: string | null
  ultimoErro: string | null
}

interface BotLogItem {
  id: number
  tipo: string
  origem: string
  status: string
  detalhe: Record<string, any> | null
  erro: string | null
  createdAt: string | null
}

interface BotConfig {
  pj: number[]
  pf: number[]
  usuarios: UsuarioItem[]
  monitoramento: MonitoramentoConfig | null
  logs: BotLogItem[]
}

interface StatusManual {
  online?: boolean
  instanciaStatus?: string
  detalhe?: string
  alertaEnviado?: boolean
  verificado?: boolean
  motivo?: string
}

const MONITOR_DEFAULT: MonitoramentoConfig = {
  ativo: true,
  emailAlerta: true,
  notificacaoPdm: true,
  ultimoCheck: null,
  ultimoStatus: null,
  ultimoErro: null,
}

export default function BotConfigAdminPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [config, setConfig] = useState<BotConfig>({
    pj: [],
    pf: [],
    usuarios: [],
    monitoramento: MONITOR_DEFAULT,
    logs: [],
  })
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [verificando, setVerificando] = useState(false)
  const [statusManual, setStatusManual] = useState<StatusManual | null>(null)

  const { data, isLoading: loading, isError, refetch } = useQuery<BotConfig>({
    queryKey: ["admin-bot-config"],
    queryFn: async () => {
      const res = await fetch("/api/admin/bot-config")
      if (!res.ok) throw new Error("Erro HTTP")
      return res.json()
    },
  })

  useEffect(() => {
    if (data) setConfig(data)
  }, [data])

  useEffect(() => {
    if (isError) toast.error("Erro ao carregar configuração do bot")
  }, [isError])

  const ativos = config.usuarios.filter(u => u.ativo)
  const inativos = config.usuarios.filter(u => !u.ativo)
  const monitor = config.monitoramento ?? MONITOR_DEFAULT
  const ultimoStatus = statusManual?.verificado ? (statusManual.online ? "ok" : "falha") : monitor.ultimoStatus
  const ultimoDetalhe = statusManual?.verificado ? statusManual.detalhe : monitor.ultimoErro
  const ultimoCheck = statusManual?.verificado ? "agora" : monitor.ultimoCheck

  function toggle(tipo: "pj" | "pf", id: number) {
    setConfig(prev => {
      const lista = prev[tipo]
      const mudou = lista.includes(id)
        ? lista.filter(x => x !== id)
        : [...lista, id]
      return { ...prev, [tipo]: mudou }
    })
    setDirty(true)
  }

  function toggleMonitor(campo: "ativo" | "emailAlerta" | "notificacaoPdm") {
    setConfig(prev => ({
      ...prev,
      monitoramento: { ...(prev.monitoramento ?? MONITOR_DEFAULT), [campo]: !(prev.monitoramento ?? MONITOR_DEFAULT)[campo] },
    }))
    setDirty(true)
  }

  async function verificarAgora() {
    setVerificando(true)
    setStatusManual(null)
    try {
      const res = await fetch("/api/crm/whatsapp/monitorar-bot", { method: "POST" })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || "Erro ao verificar")
      }
      const body = await res.json()
      setStatusManual(body)
      if (body.verificado === false) {
        toast.info("Monitoramento desativado. Ative no card abaixo para verificar.")
      } else if (body.online) {
        toast.success("Bot online — instância conectada ao WhatsApp")
      } else {
        toast.error("Bot fora do ar")
        if (body.alertaEnviado) toast.warning("Alerta enviado para os administradores")
      }
      refetch()
    } catch (err: any) {
      toast.error(err.message || "Erro ao verificar o bot")
    } finally {
      setVerificando(false)
    }
  }

  async function salvar() {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/bot-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pj: config.pj,
          pf: config.pf,
          monitoramento: {
            ativo: monitor.ativo,
            emailAlerta: monitor.emailAlerta,
            notificacaoPdm: monitor.notificacaoPdm,
          },
        }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erro ao salvar")
      }
      toast.success("Configuração do bot salva!")
      setDirty(false)
      refetch()
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-slate-400" size={32} />
      </div>
    )
  }

  function Card({ tipo, titulo, descricao }: { tipo: "pj" | "pf"; titulo: string; descricao: string }) {
    const selecionados = config[tipo]
    return (
      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <header className="border-b border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">{titulo}</h2>
            <p className="text-xs text-slate-500 mt-0.5">{descricao}</p>
          </div>
          <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
            {selecionados.length} selecionado{selecionados.length === 1 ? "" : "s"}
          </span>
        </header>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {ativos.map(usuario => {
            const marcado = selecionados.includes(usuario.id)
            return (
              <label
                key={usuario.id}
                className="flex items-center gap-3 px-5 py-3.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={marcado}
                  onChange={() => toggle(tipo, usuario.id)}
                  className="h-4 w-4 accent-blue-600"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{usuario.name}</p>
                  <p className="text-xs text-slate-500 truncate">{usuario.email}</p>
                </div>
                {usuario.celWhatsapp ? (
                  <span className="text-xs text-slate-500 shrink-0" title="Possui número de WhatsApp cadastrado">
                    WhatsApp ✓
                  </span>
                ) : (
                  <span className="text-xs text-slate-400 shrink-0">sem WhatsApp</span>
                )}
              </label>
            )
          })}
        </div>

        {inativos.length > 0 && (
          <footer className="border-t border-slate-100 dark:border-slate-800 px-5 py-3">
            <p className="text-xs text-slate-400">
              {inativos.length} usuário{inativos.length === 1 ? "" : "s"} inativo{inativos.length === 1 ? "" : "s"} oculto{inativos.length === 1 ? "" : "s"}
            </p>
          </footer>
        )}
      </section>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/admin/configuracoes" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <div className="flex items-center gap-2">
            <Bot className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
              Config Bot WhatsApp{info && <InfoButton content={info} />}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Quem recebe o contato quando o bot identifica uma nova pessoa física ou jurídica, e monitoramento do bot
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card
          tipo="pf"
          titulo="Pessoa Física (PF)"
          descricao="Recebe o contato quando o lead é pessoa física"
        />
        <Card
          tipo="pj"
          titulo="Pessoa Jurídica (PJ)"
          descricao="Recebe o contato quando o lead é pessoa jurídica (CNPJ)"
        />
      </div>

      <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <header className="border-b border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Activity className="text-emerald-600" size={22} />
            <div>
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Monitoramento do Bot</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Verifica diariamente se a instância da Evolution API está online
              </p>
            </div>
          </div>
          <span
            className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
              ultimoStatus === "ok"
                ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                : ultimoStatus === "falha"
                  ? "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
                  : "text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800"
            }`}
          >
            {ultimoStatus === "ok" ? "Online" : ultimoStatus === "falha" ? "Fora do ar" : "Sem verificação ainda"}
          </span>
        </header>

        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-sm">
              <span className="text-slate-500">Última verificação: </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {ultimoCheck ? (ultimoCheck === "agora" ? "agora" : new Date(ultimoCheck).toLocaleString("pt-BR")) : "nunca"}
              </span>
            </div>
            <div className="text-sm">
              <span className="text-slate-500">Status da instância: </span>
              <span className="font-medium text-slate-800 dark:text-slate-200">
                {statusManual?.instanciaStatus || (ultimoStatus === "ok" ? "open" : ultimoDetalhe ?? "—")}
              </span>
            </div>
            <button
              onClick={verificarAgora}
              disabled={verificando}
              className="flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {verificando ? <Loader2 className="animate-spin" size={15} /> : <RefreshCw size={15} />}
              {verificando ? "Verificando..." : "Verificar agora"}
            </button>
          </div>
          {(ultimoDetalhe || statusManual?.verificado === false) && (
            <p className="text-xs text-slate-500 break-words">
              {statusManual?.verificado === false
                ? "Monitoramento desativado — o cron não executa a verificação automaticamente."
                : ultimoDetalhe}
            </p>
          )}
        </div>

        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">Alertas</p>
          {(
            [
              { campo: "ativo", label: "Monitoramento ativo (verificação diária no cron)", desc: "Se desativado, o cron informa que o monitoramento está desligado e não executa a verificação." },
              { campo: "emailAlerta", label: "Enviar alerta por email para os administradores", desc: "Email com a situação detalhada da instância quando o bot fica fora do ar." },
              { campo: "notificacaoPdm", label: "Criar notificação no PDM", desc: "Notificação interna no sino do sistema para ADMIN/SUDO com os detalhes da queda." },
            ] as { campo: "ativo" | "emailAlerta" | "notificacaoPdm"; label: string; desc: string }[]
          ).map(item => (
            <label key={item.campo} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={monitor[item.campo]}
                onChange={() => toggleMonitor(item.campo)}
                className="h-4 w-4 accent-emerald-600 mt-0.5"
              />
              <div>
                <p className="text-sm text-slate-800 dark:text-slate-200">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="px-5 py-4">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-3">Últimos eventos do bot</p>
          {config.logs.length === 0 ? (
            <p className="text-xs text-slate-400">
              Nenhum evento registrado ainda. O log é alimentado pelo monitoramento, fila de processamento e fluxo do bot.
            </p>
          ) : (
            <ul className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {config.logs.map(log => (
                <li
                  key={log.id}
                  className="flex items-start gap-3 text-sm border border-slate-100 dark:border-slate-800 rounded-lg px-3 py-2"
                >
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full shrink-0 ${
                      log.status === "ok"
                        ? "text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
                        : log.status === "alerta"
                          ? "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40"
                          : "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40"
                    }`}
                  >
                    {log.tipo}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-slate-600 dark:text-slate-300 truncate">{log.erro ?? log.detalhe?.detalhe ?? log.tipo}</p>
                    {log.detalhe?.instanciaStatus && (
                      <p className="text-[11px] text-slate-400">Instância: {log.detalhe.instanciaStatus}</p>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400 shrink-0">
                    {log.createdAt ? new Date(log.createdAt).toLocaleString("pt-BR") : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={salvar}
          disabled={!dirty || saving}
          className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium text-sm"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? "Salvando..." : "Salvar Configuração"}
        </button>
      </div>
    </div>
  )
}