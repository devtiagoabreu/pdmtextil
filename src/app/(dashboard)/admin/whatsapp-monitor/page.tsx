"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from "sonner"
import { Loader2, RefreshCw, Check, X, SkipForward, AlertTriangle, ChevronDown, ChevronRight, Activity, Clock, MessageSquare } from "lucide-react"

interface StepLog {
  step: string
  status: "success" | "error" | "ignored" | "skipped"
  durationMs: number | null
  error: string | null
  input: Record<string, any> | null
  output: Record<string, any> | null
}

interface Execution {
  executionId: string
  remoteJid: string | null
  pushName: string | null
  startedAt: string
  totalSteps: number
  errorSteps: number
  lastStep: string
  steps: StepLog[]
}

const STEP_LABELS: Record<string, string> = {
  auth: "Autenticação",
  extract: "Extração",
  filter: "Filtro",
  find_conversation: "Buscar Conversa",
  groq_call: "Groq IA",
  state_machine: "Máquina de Estados",
  save_messages: "Salvar no Banco",
  send_response: "Enviar Resposta",
  create_lead: "Criar Lead",
  notify: "Notificar",
}

const STEP_ICONS: Record<string, string> = {
  auth: "🔐",
  extract: "📤",
  filter: "🔍",
  find_conversation: "💬",
  groq_call: "🤖",
  state_machine: "⚙️",
  save_messages: "💾",
  send_response: "📨",
  create_lead: "👤",
  notify: "🔔",
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "success":
      return <Check size={14} className="text-green-500" />
    case "error":
      return <X size={14} className="text-red-500" />
    case "ignored":
      return <SkipForward size={14} className="text-slate-400" />
    case "skipped":
      return <SkipForward size={14} className="text-slate-300" />
    default:
      return null
  }
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    error: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    ignored: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
    skipped: "bg-slate-50 text-slate-400 dark:bg-slate-900 dark:text-slate-500",
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] || colors.skipped}`}>
      <StatusIcon status={status} />
      {status}
    </span>
  )
}

function FlowDiagram({ steps, activeStep, onStepClick }: { steps: StepLog[]; activeStep: string | null; onStepClick: (step: string) => void }) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {steps.map((step: any, i: any) => (
        <div key={step.step} className="flex items-center gap-1">
          <button
            onClick={() => onStepClick(step.step)}
            className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all cursor-pointer min-w-[70px] ${
              activeStep === step.step
                ? "border-blue-400 bg-blue-50 dark:bg-blue-950/50 shadow-sm"
                : step.status === "error"
                ? "border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800"
                : step.status === "success"
                ? "border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800"
                : "border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            }`}
          >
            <span className="text-lg">{STEP_ICONS[step.step] || "❓"}</span>
            <span className="text-[10px] font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{STEP_LABELS[step.step] || step.step}</span>
            <StatusIcon status={step.status} />
          </button>
          {i < steps.length - 1 && (
            <div className={`w-4 h-0.5 ${step.status === "error" ? "bg-red-300" : "bg-slate-200 dark:bg-slate-700"}`} />
          )}
        </div>
      ))}
    </div>
  )
}

function StepDetail({ step }: { step: StepLog }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
      >
        {expanded ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
        <span className="text-lg">{STEP_ICONS[step.step] || "❓"}</span>
        <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{STEP_LABELS[step.step] || step.step}</span>
        <StatusBadge status={step.status} />
        {step.durationMs != null && step.durationMs > 0 && (
          <span className="text-xs text-slate-400 ml-auto flex items-center gap-1">
            <Clock size={12} />
            {step.durationMs}ms
          </span>
        )}
      </button>
      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-3">
          {step.error && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400 text-sm font-medium mb-1">
                <AlertTriangle size={14} />
                Erro
              </div>
              <p className="text-sm text-red-600 dark:text-red-300 font-mono">{step.error}</p>
            </div>
          )}
          {step.input && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Input</p>
              <pre className="text-xs bg-slate-50 dark:bg-slate-800 rounded-lg p-3 overflow-x-auto text-slate-700 dark:text-slate-300 font-mono">
                {JSON.stringify(step.input, null, 2)}
              </pre>
            </div>
          )}
          {step.output && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">Output</p>
              <pre className="text-xs bg-slate-50 dark:bg-slate-800 rounded-lg p-3 overflow-x-auto text-slate-700 dark:text-slate-300 font-mono">
                {JSON.stringify(step.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function WhatsAppMonitorPage() {
  const [executions, setExecutions] = useState<Execution[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [selectedExecution, setSelectedExecution] = useState<string | null>(null)
  const [activeStep, setActiveStep] = useState<string | null>(null)
  const [expandedExecutions, setExpandedExecutions] = useState<Set<string>>(new Set())

  const autoRefreshRef = useRef(false)
  autoRefreshRef.current = autoRefresh

  const fetchExecutions = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (statusFilter !== "all") params.set("status", statusFilter)
      params.set("limit", "50")

      const res = await fetch(`/api/admin/whatsapp-monitor?${params}`)
      if (!res.ok) throw new Error("Erro ao buscar")
      const data = await res.json()
      setExecutions(data.executions || [])
    } catch {
      if (!autoRefreshRef.current) {
        toast.error("Erro ao carregar execuções")
      }
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    fetchExecutions()
  }, [fetchExecutions])

  useEffect(() => {
    if (!autoRefresh) return
    const interval = setInterval(fetchExecutions, 10000)
    return () => clearInterval(interval)
  }, [autoRefresh, fetchExecutions])

  const toggleExpand = (id: string) => {
    setExpandedExecutions((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectedExec = executions.find((e: any) => e.executionId === selectedExecution)

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="text-blue-600" size={24} />
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Monitor WhatsApp IA</h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">Acompanhe as execuções do fluxo de atendimento automático</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw size={14} className={autoRefresh ? "animate-spin" : ""} />
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh"}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchExecutions} className="gap-2">
            <RefreshCw size={14} />
            Atualizar
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Buscar por nome ou numero..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-700 dark:text-slate-200"
        >
          <option value="all">Todos</option>
          <option value="error">Com erro</option>
          <option value="success">Sucesso</option>
          <option value="ignored">Ignorado</option>
        </select>
      </div>

      {selectedExec && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-slate-50">
                  {selectedExec.pushName || "Desconhecido"}{" "}
                  <span className="text-sm font-normal text-slate-500">({selectedExec.remoteJid?.replace(/@s\.whatsapp\.net$/, "")})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(selectedExec.startedAt).toLocaleString("pt-BR")} — {selectedExec.steps.length} etapas
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setSelectedExecution(null); setActiveStep(null) }}>
                Fechar
              </Button>
            </div>
            <FlowDiagram steps={selectedExec.steps} activeStep={activeStep} onStepClick={setActiveStep} />
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-slate-400" size={32} />
        </div>
      ) : executions.length === 0 ? (
        <div className="text-center py-16">
          <MessageSquare className="mx-auto text-slate-300 mb-3" size={48} />
          <p className="text-slate-500">Nenhuma execução encontrada</p>
          <p className="text-xs text-slate-400 mt-1">As execuções aparecerão aqui quando o bot receber mensagens</p>
        </div>
      ) : (
        <div className="space-y-3">
          {executions.map((exec: any) => (
            <div key={exec.executionId} className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900">
              <button
                onClick={() => {
                  toggleExpand(exec.executionId)
                  setSelectedExecution(exec.executionId)
                }}
                className="w-full flex items-center gap-4 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                {exec.errorSteps > 0 ? (
                  <X size={18} className="text-red-500 shrink-0" />
                ) : (
                  <Check size={18} className="text-green-500 shrink-0" />
                )}
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-slate-900 dark:text-slate-100">
                      {exec.pushName || "Desconhecido"}
                    </span>
                    <span className="text-xs text-slate-400">{exec.remoteJid?.replace(/@s\.whatsapp\.net$/, "")}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {new Date(exec.startedAt).toLocaleString("pt-BR")} — {exec.totalSteps} etapas
                    {exec.errorSteps > 0 && <span className="text-red-500 ml-1">({exec.errorSteps} erro{exec.errorSteps > 1 ? "s" : ""})</span>}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {exec.steps.slice(0, 8).map((step: any) => (
                    <div
                      key={step.step}
                      className={`w-2 h-2 rounded-full ${
                        step.status === "success" ? "bg-green-400" : step.status === "error" ? "bg-red-400" : step.status === "ignored" ? "bg-slate-300" : "bg-slate-200"
                      }`}
                      title={`${STEP_LABELS[step.step]}: ${step.status}`}
                    />
                  ))}
                </div>
                {expandedExecutions.has(exec.executionId) ? (
                  <ChevronDown size={16} className="text-slate-400" />
                ) : (
                  <ChevronRight size={16} className="text-slate-400" />
                )}
              </button>

              {expandedExecutions.has(exec.executionId) && (
                <div className="px-4 pb-4 space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3">
                  {exec.steps.map((step: any) => (
                    <StepDetail key={step.step} step={step} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
