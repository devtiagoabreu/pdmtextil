"use client"

import { useState, useEffect, useRef } from "react"
import { AlertTriangle } from "lucide-react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Building2, UserCheck, Repeat } from "lucide-react"
import PhotoUpload from "@/components/crm/photo-upload"
import { RelatoTemplateSelector } from "@/components/crm/relato-templates"
import { toast } from "sonner"
import { QuickCreatePessoa } from "@/components/crm/quick-create-pessoa"
import { QuickCreateCliente } from "@/components/crm/quick-create-cliente"
import { QuickCreateContato } from "@/components/crm/quick-create-contato"
import { QuickCreateOportunidade } from "@/components/crm/quick-create-oportunidade"
import { SelectUf } from "@/components/crm/select-uf"
import { SelectCidade } from "@/components/crm/select-cidade"
import { RichTextEditor } from "@/components/crm/rich-text-editor"

const TIPO_OPTIONS = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "VIDEO", label: "Vídeo" },
  { value: "TELEFONE", label: "Telefone" },
]

export default function NovaVisitaPage() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const info = getInfoContent(pathname)
  const dataParam = searchParams.get("data")
  const [tipoEntidade, setTipoEntidade] = useState<"CLIENTE" | "PESSOA" | "">("")
  const [empresas, setEmpresas] = useState<any[]>([])
  const [clientesList, setClientesList] = useState<any[]>([])
  const [oportunidades, setOportunidades] = useState<any[]>([])
  const [contatos, setContatos] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [fotos, setFotos] = useState<string[]>([])
  const [conflictos, setConflictos] = useState<any[]>([])
  const [recorrencia, setRecorrencia] = useState<string>("nenhuma")
  const [recorrenciaFim, setRecorrenciaFim] = useState("")
  const conflictTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [empresaEndereco, setEmpresaEndereco] = useState<any>({})
  const [estadoId, setEstadoId] = useState<number | null>(null)
  const [estados, setEstados] = useState<{ id: number; uf: string }[]>([])
  const [form, setForm] = useState({
    empresaId: "",
    clienteId: "",
    oportunidadeId: "",
    contatoId: "",
    dataVisita: dataParam || new Date().toISOString().split("T")[0],
    hora: "",
    tipo: "PRESENCIAL",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    uf: "",
    cep: "",
    relato: "",
    duracaoEstimada: "",
  })

  function setField(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    async function load() {
      try {
        const [empresasRes, oportunidadesRes, clientesRes] = await Promise.allSettled([
          fetch("/api/crm/pessoas").then(r => {
            if (!r.ok) throw new Error(`pessoas ${r.status}`)
            return r.json()
          }),
          fetch("/api/crm/oportunidades").then(r => {
            if (!r.ok) throw new Error(`oportunidades ${r.status}`)
            return r.json()
          }),
          fetch("/api/clientes").then(r => {
            if (!r.ok) throw new Error(`clientes ${r.status}`)
            return r.json()
          }),
        ])
        if (empresasRes.status === "fulfilled" && Array.isArray(empresasRes.value)) setEmpresas(empresasRes.value)
        else console.error("[visitas/novo] pessoas failed:", empresasRes.status === "rejected" ? empresasRes.reason : empresasRes.value)
        if (oportunidadesRes.status === "fulfilled" && Array.isArray(oportunidadesRes.value)) setOportunidades(oportunidadesRes.value)
        else console.error("[visitas/novo] oportunidades failed:", oportunidadesRes.status === "rejected" ? oportunidadesRes.reason : oportunidadesRes.value)
        if (clientesRes.status === "fulfilled" && Array.isArray(clientesRes.value)) setClientesList(clientesRes.value)
        else console.error("[visitas/novo] clientes failed:", clientesRes.status === "rejected" ? clientesRes.reason : clientesRes.value)
      } catch (e) {
        console.error("[visitas/novo] load error:", e)
        toast.error("Erro ao carregar dados do formulário")
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (tipoEntidade === "PESSOA") {
      loadContatos(form.empresaId)
      loadEmpresaEndereco(form.empresaId)
    } else if (tipoEntidade === "CLIENTE") {
      loadContatosCliente()
      loadClienteEndereco(form.clienteId)
    } else {
      setContatos([])
    }
  }, [form.empresaId, form.clienteId, tipoEntidade])

  useEffect(() => {
    fetch("/api/crm/estados").then(r => r.json()).then(setEstados).catch(() => {})
  }, [])

  useEffect(() => {
    if (form.uf) {
      const found = estados.find(e => e.uf === form.uf)
      setEstadoId(found ? found.id : null)
    } else {
      setEstadoId(null)
    }
  }, [form.uf, estados])

  useEffect(() => {
    if (conflictTimerRef.current) clearTimeout(conflictTimerRef.current)
    if (!form.dataVisita || !form.hora) { setConflictos([]); return }
    conflictTimerRef.current = setTimeout(async () => {
      try {
        const sp = new URLSearchParams({ dataVisita: form.dataVisita, hora: form.hora })
        const res = await fetch(`/api/crm/visitas/conflictos?${sp}`)
        if (res.ok) {
          const data = await res.json()
          setConflictos(data.conflictos || [])
        }
      } catch {}
    }, 500)
  }, [form.dataVisita, form.hora])

  async function loadEmpresas() {
    try {
      const res = await fetch("/api/crm/pessoas")
      const data = await res.json()
      if (Array.isArray(data)) setEmpresas(data)
    } catch {}
  }

  async function loadClientes() {
    try {
      const res = await fetch("/api/clientes")
      const data = await res.json()
      if (Array.isArray(data)) setClientesList(data)
    } catch {}
  }

  async function loadOportunidades() {
    try {
      const res = await fetch("/api/crm/oportunidades")
      const data = await res.json()
      if (Array.isArray(data)) setOportunidades(data)
    } catch {}
  }

  function handleEmpresaCreated(id: number, razaoSocial: string) {
    loadEmpresas()
    setField("empresaId", String(id))
    setField("oportunidadeId", "")
    setField("contatoId", "")
  }

  function handleClienteCreated(id: number, nome: string) {
    loadClientes()
    setField("clienteId", String(id))
    setField("contatoId", "")
  }

  function handleContatoCreated(id: number) {
    if (tipoEntidade === "PESSOA") loadContatos(form.empresaId)
    else if (tipoEntidade === "CLIENTE") loadContatosCliente()
    setField("contatoId", String(id))
  }

  function handleOportunidadeCreated(id: number) {
    loadOportunidades()
    setField("oportunidadeId", String(id))
  }

  async function loadContatos(empresaId: string) {
    if (!empresaId) { setContatos([]); return }
    try {
      const res = await fetch(`/api/crm/pessoas/${empresaId}`)
      const data = await res.json()
      if (Array.isArray(data.contatos)) setContatos(data.contatos)
      else setContatos([])
    } catch { setContatos([]) }
  }

  async function loadContatosCliente() {
    if (!form.clienteId) { setContatos([]); return }
    try {
      const res = await fetch(`/api/crm/contatos?clienteId=${form.clienteId}`)
      const data = await res.json()
      if (Array.isArray(data)) setContatos(data)
      else setContatos([])
    } catch { setContatos([]) }
  }

  async function loadEmpresaEndereco(empresaId: string) {
    if (!empresaId) { setEmpresaEndereco({}); return }
    try {
      const res = await fetch(`/api/crm/pessoas/${empresaId}`)
      const data = await res.json()
      setEmpresaEndereco({
        endereco: data.endereco || "",
        numero: data.numero || "",
        complemento: data.complemento || "",
        bairro: data.bairro || "",
        cidade: data.cidade || "",
        uf: data.uf || "",
        cep: data.cep || "",
      })
    } catch { setEmpresaEndereco({}) }
  }

  async function loadClienteEndereco(clienteId: string) {
    if (!clienteId) { setEmpresaEndereco({}); return }
    try {
      const res = await fetch(`/api/clientes`)
      const data = await res.json()
      const cliente = Array.isArray(data) ? data.find((c: any) => String(c.id) === clienteId) : null
      if (cliente) {
        setEmpresaEndereco({
          endereco: cliente.endereco || "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: cliente.cidade || "",
          uf: cliente.uf || "",
          cep: "",
        })
      }
    } catch { setEmpresaEndereco({}) }
  }

  function copiarEnderecoEmpresa() {
    setForm(prev => ({
      ...prev,
      endereco: empresaEndereco.endereco || "",
      numero: empresaEndereco.numero || "",
      complemento: empresaEndereco.complemento || "",
      bairro: empresaEndereco.bairro || "",
      cidade: empresaEndereco.cidade || "",
      uf: empresaEndereco.uf || "",
      cep: empresaEndereco.cep || "",
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (tipoEntidade === "PESSOA" && !form.empresaId) {
      toast.error("Pessoa é obrigatória")
      return
    }
    if (tipoEntidade === "CLIENTE" && !form.clienteId) {
      toast.error("Cliente é obrigatório")
      return
    }
    if (recorrencia !== "nenhuma" && !recorrenciaFim) {
      toast.error("Informe a data final da recorrência")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/crm/visitas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId: tipoEntidade === "PESSOA" ? parseInt(form.empresaId) : null,
          clienteId: tipoEntidade === "CLIENTE" ? parseInt(form.clienteId) : null,
          oportunidadeId: form.oportunidadeId ? parseInt(form.oportunidadeId) : null,
          contatoId: form.contatoId ? parseInt(form.contatoId) : null,
          dataVisita: form.dataVisita,
          hora: form.hora || null,
          tipo: form.tipo,
          endereco: form.endereco || null,
          numero: form.numero || null,
          complemento: form.complemento || null,
          bairro: form.bairro || null,
          cidade: form.cidade || null,
          uf: form.uf || null,
          cep: form.cep || null,
          relato: form.relato || null,
          duracaoEstimada: form.duracaoEstimada ? parseInt(form.duracaoEstimada) : null,
          fotos: fotos,
          recorrencia: recorrencia !== "nenhuma" ? recorrencia : undefined,
          recorrenciaFim: recorrencia !== "nenhuma" ? recorrenciaFim : undefined,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar visita")
      }
      const data = await res.json()
      toast.success(data.total > 1 ? `${data.total} visitas criadas com sucesso` : "Visita criada com sucesso")
      router.push("/comercial/crm/visitas")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/comercial/crm/visitas" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">Nova Visita{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500">Agendar nova visita comercial</p>
        </div>
      </div>

      {!tipoEntidade && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 text-center">Quem você vai visitar?</h2>
          <p className="text-sm text-slate-500 text-center">Selecione o tipo de entidade para iniciar o agendamento.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <button
              type="button"
              onClick={() => setTipoEntidade("CLIENTE")}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer group"
            >
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/50 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
                <Building2 size={28} className="text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Cliente</p>
                <p className="text-xs text-slate-500 mt-1">Empresa já cadastrada no sistema</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTipoEntidade("PESSOA")}
              className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all cursor-pointer group"
            >
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
                <UserCheck size={28} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-slate-900 dark:text-slate-100">Pessoa</p>
                <p className="text-xs text-slate-500 mt-1">Futuro cliente (negócio)</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {tipoEntidade && (
        <form onSubmit={handleSubmit} className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {tipoEntidade === "CLIENTE" ? (
                <Building2 size={18} className="text-emerald-600" />
              ) : (
                <UserCheck size={18} className="text-blue-600" />
              )}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                {tipoEntidade === "CLIENTE" ? "Visitando Cliente" : "Visitando Pessoa (Negócio)"}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setTipoEntidade("")
                setField("empresaId", "")
                setField("clienteId", "")
                setField("oportunidadeId", "")
                setField("contatoId", "")
              }}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:underline"
            >
              Trocar
            </button>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {tipoEntidade === "CLIENTE" ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cliente *
                  <QuickCreateCliente onCreated={handleClienteCreated} />
                </label>
                <select
                  value={form.clienteId}
                  onChange={e => {
                    setField("clienteId", e.target.value)
                    setField("contatoId", "")
                  }}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {clientesList.map(c => (
                    <option key={c.id} value={String(c.id)}>{c.nome}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Pessoa (Negócio) *
                  <QuickCreatePessoa onCreated={handleEmpresaCreated} />
                </label>
                <select
                  value={form.empresaId}
                  onChange={e => {
                    setField("empresaId", e.target.value)
                    setField("oportunidadeId", "")
                    setField("contatoId", "")
                  }}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione...</option>
                  {empresas.map(e => (
                    <option key={e.id} value={String(e.id)}>{e.razaoSocial || e.nomeFantasia}</option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Data da Visita</label>
              <input
                type="date"
                value={form.dataVisita}
                onChange={e => setField("dataVisita", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Hora</label>
              <input
                type="time"
                value={form.hora}
                onChange={e => setField("hora", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {conflictos.length > 0 && (
                <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 px-3 py-2">
                  <AlertTriangle size={16} className="text-amber-500 mt-0.5 shrink-0" />
                  <div className="text-xs text-amber-700 dark:text-amber-300">
                    <p className="font-medium">{conflictos.length} visita(s) ja agendada(s) neste horario:</p>
                    <ul className="mt-1 space-y-0.5">
                      {conflictos.map((c: any) => (
                        <li key={c.id}>• {c.empresaNome || c.clienteNome || "Visita"} ({c.tipo})</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Tipo</label>
              <select
                value={form.tipo}
                onChange={e => setField("tipo", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {TIPO_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duracao Estimada</label>
              <select
                value={form.duracaoEstimada}
                onChange={e => setField("duracaoEstimada", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Nao definida</option>
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">1 hora</option>
                <option value="90">1h30</option>
                <option value="120">2 horas</option>
                <option value="180">3 horas</option>
                <option value="240">4 horas</option>
                <option value="480">Dia inteiro</option>
              </select>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Repeat size={16} className="text-slate-500" />
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Recorrencia</label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Frequencia</label>
                  <select
                    value={recorrencia}
                    onChange={e => setRecorrencia(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="nenhuma">Nenhuma (visita unica)</option>
                    <option value="semanal">Semanal (a cada 7 dias)</option>
                    <option value="quinzenal">Quinzenal (a cada 14 dias)</option>
                    <option value="mensal">Mensal (a cada 30 dias)</option>
                  </select>
                </div>
                {recorrencia !== "nenhuma" && (
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Repetir ate</label>
                    <input
                      type="date"
                      value={recorrenciaFim}
                      onChange={e => setRecorrenciaFim(e.target.value)}
                      min={form.dataVisita}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                )}
              </div>
              {recorrencia !== "nenhuma" && recorrenciaFim && form.dataVisita && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {(() => {
                    const start = new Date(form.dataVisita + "T12:00:00")
                    const end = new Date(recorrenciaFim + "T12:00:00")
                    const diffMs = end.getTime() - start.getTime()
                    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
                    const interval = recorrencia === "semanal" ? 7 : recorrencia === "quinzenal" ? 14 : 30
                    const count = Math.floor(days / interval) + 1
                    return `${count} visita(s) serao criadas`
                  })()}
                </p>
              )}
            </div>
            {tipoEntidade === "PESSOA" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Oportunidade
                  <QuickCreateOportunidade empresaId={form.empresaId} onCreated={handleOportunidadeCreated} />
                </label>
                <select
                  value={form.oportunidadeId}
                  onChange={e => setField("oportunidadeId", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione...</option>
                  {oportunidades
                    .filter((o: any) => !form.empresaId || String(o.empresaId) === form.empresaId)
                    .map((o: any) => (
                      <option key={o.id} value={String(o.id)}>{o.titulo}</option>
                    ))}
                </select>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Contato
                <QuickCreateContato
                  empresaId={tipoEntidade === "PESSOA" ? form.empresaId : ""}
                  clienteId={tipoEntidade === "CLIENTE" ? form.clienteId : ""}
                  clienteNome={tipoEntidade === "CLIENTE" ? clientesList.find((c: any) => String(c.id) === form.clienteId)?.nome || "" : ""}
                  onClickGuard={() => {
                    if (!form.empresaId && !form.clienteId) {
                      toast.error("Selecione uma pessoa ou cliente primeiro")
                      return false
                    }
                    return true
                  }}
                  onCreated={handleContatoCreated}
                />
              </label>
              <select
                value={form.contatoId}
                onChange={e => setField("contatoId", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                {contatos.map((c: any) => (
                  <option key={c.id} value={String(c.id)}>{c.nome}{c.cargo ? ` (${c.cargo})` : ""}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Endereço da Visita</h3>
              <button
                type="button"
                onClick={() => {
                  const entidadeId = tipoEntidade === "PESSOA" ? form.empresaId : form.clienteId
                  if (!entidadeId) {
                    toast.error(`Selecione um${tipoEntidade === "CLIENTE" ? " cliente" : "a pessoa"} primeiro`)
                    return
                  }
                  copiarEnderecoEmpresa()
                }}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                Copiar endereço {tipoEntidade === "CLIENTE" ? "do cliente" : "do negócio"}
              </button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logradouro</label>
                <input
                  type="text"
                  value={form.endereco}
                  onChange={e => setField("endereco", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número</label>
                <input
                  type="text"
                  value={form.numero}
                  onChange={e => setField("numero", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Complemento</label>
                <input
                  type="text"
                  value={form.complemento}
                  onChange={e => setField("complemento", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bairro</label>
                <input
                  type="text"
                  value={form.bairro}
                  onChange={e => setField("bairro", e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UF</label>
                <SelectUf value={form.uf} onChange={v => setField("uf", v)} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                <SelectCidade value={form.cidade} onChange={v => setField("cidade", v)} estadoId={estadoId} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CEP</label>
                <input
                  type="text"
                  value={form.cep}
                  onChange={e => setField("cep", e.target.value)}
                  placeholder="00.000-000"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Relato / Ata da Visita</label>
            <RelatoTemplateSelector onSelect={html => setField("relato", html)} />
            <RichTextEditor
              value={form.relato}
              onChange={v => setField("relato", v)}
              placeholder="Descreva o relato da visita..."
              minHeight="250px"
            />
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <PhotoUpload photos={fotos} onPhotosChange={setFotos} />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/comercial/crm/visitas"
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              <Save size={16} />
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
