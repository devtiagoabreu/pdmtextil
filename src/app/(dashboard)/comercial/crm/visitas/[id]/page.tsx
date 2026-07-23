"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSession } from "next-auth/react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Pencil, Check, X, MapPin, ExternalLink, LogIn, LogOut, Loader2, Navigation, Undo2, AlertTriangle } from "lucide-react"
import PhotoUpload from "@/components/crm/photo-upload"
import { RelatoTemplateSelector } from "@/components/crm/relato-templates"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { sanitizeHtml } from "@/lib/sanitize"
import { useStatuses } from "@/hooks/use-statuses"
import { SelectUf } from "@/components/crm/select-uf"
import { SelectCidade } from "@/components/crm/select-cidade"
import { RichTextEditor } from "@/components/crm/rich-text-editor"
import VisitReportButton from "@/components/crm/visit-report-button"
import SendSurveyButton from "@/components/crm/send-survey-button"

const TIPO_OPTIONS = [
  { value: "PRESENCIAL", label: "Presencial" },
  { value: "VIDEO", label: "Vídeo" },
  { value: "TELEFONE", label: "Telefone" },
]

const TIPO_LABELS: Record<string, string> = Object.fromEntries(TIPO_OPTIONS.map(o => [o.value, o.label]))

export default function DetalheVisitaPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const params = useParams()
  const { getLabel, getColor } = useStatuses("VISITA")
  const [visita, setVisita] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [fotos, setFotos] = useState<string[]>([])
  const [conflictos, setConflictos] = useState<any[]>([])
  const conflictTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [estadoId, setEstadoId] = useState<number | null>(null)
  const [estados, setEstados] = useState<{ id: number; uf: string }[]>([])
  const [empresaEndereco, setEmpresaEndereco] = useState<Record<string, string>>({})
  const [checkLoading, setCheckLoading] = useState<"in" | "out" | null>(null)
  const { data: session } = useSession()

  const fetchEstados = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/estados")
      if (res.ok) setEstados(await res.json())
    } catch {}
  }, [])

  useEffect(() => { fetchEstados() }, [fetchEstados])

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
    if (!editing || !form.dataVisita || !form.hora) { setConflictos([]); return }
    conflictTimerRef.current = setTimeout(async () => {
      try {
        const sp = new URLSearchParams({ dataVisita: form.dataVisita, hora: form.hora, excludeId: String(params.id) })
        const res = await fetch(`/api/crm/visitas/conflictos?${sp}`)
        if (res.ok) {
          const data = await res.json()
          setConflictos(data.conflictos || [])
        }
      } catch {}
    }, 500)
  }, [form.dataVisita, form.hora, editing, params.id])

  async function loadVisita() {
    try {
      const res = await fetch(`/api/crm/visitas/${params.id}`)
      const data = await res.json()
      setVisita(data)
      setForm(data)
      setFotos(data.fotos || [])
    } catch {
      toast.error("Erro ao carregar visita")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadVisita() }, [params.id])

  function setField(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  function startEditing() {
    setForm({ ...visita })
    setFotos(visita.fotos || [])
    if (visita.empresaId) loadEmpresaEndereco(visita.empresaId)
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setForm(visita)
    setFotos(visita.fotos || [])
  }

  async function handleSave() {
    try {
      const res = await fetch(`/api/crm/visitas/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          fotos: fotos,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao atualizar")
      }
      await loadVisita()
      setEditing(false)
      toast.success("Visita atualizada")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/crm/visitas/${params.id}`, { method: "DELETE" })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao excluir")
      }
      toast.success("Visita excluída")
      router.push("/comercial/crm/visitas")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeleteLoading(false)
      setShowDelete(false)
    }
  }

  async function loadEmpresaEndereco(empresaId: number) {
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

  function copiarEnderecoEmpresa() {
    setForm((prev: any) => ({
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

  async function handleCheck(tipo: "check_in" | "check_out") {
    setCheckLoading(tipo === "check_in" ? "in" : "out")
    try {
      let lat: number | null = null
      let lng: number | null = null

      if ("geolocation" in navigator) {
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000, enableHighAccuracy: true })
          })
          lat = pos.coords.latitude
          lng = pos.coords.longitude
        } catch {
          toast.warning("Sem acesso à localização. Check-in/out será registrado sem GPS.")
        }
      }

      const res = await fetch(`/api/crm/visitas/${params.id}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo, latitude: lat, longitude: lng }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao registrar")
      }
      await loadVisita()
      toast.success(tipo === "check_in" ? "Check-in registrado!" : "Check-out registrado!")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCheckLoading(null)
    }
  }

  async function handleUndo(tipo: "undo_check_in" | "undo_check_out") {
    const label = tipo === "undo_check_in" ? "check-in" : "check-out"
    setCheckLoading(tipo === "undo_check_in" ? "in" : "out")
    try {
      const res = await fetch(`/api/crm/visitas/${params.id}/check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao desfazer")
      }
      await loadVisita()
      toast.success(`${label.charAt(0).toUpperCase() + label.slice(1)} desfeito!`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCheckLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!visita) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Visita não encontrada</p>
        <Link href="/comercial/crm/visitas" className="text-blue-600 hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    )
  }

  const STATUS_OPTIONS = ["AGENDADA", "EM_ANDAMENTO", "REALIZADA", "CANCELADA"]

  const userRole = (session?.user as any)?.role
  const userId = session?.user?.id ? parseInt(session.user.id) : null
  const isOwner = userId != null && visita?.criadoPor === userId
  const isAdmin = userRole === "ADMIN" || userRole === "SUDO"
  const canEdit = isAdmin || isOwner

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 shrink-0">
            <ArrowLeft size={18} className="text-slate-500" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-50 truncate">
                Visita — {visita.empresaNome || visita.clienteNome || `#${visita.id}`}{info && <InfoButton content={info} />}
              </h1>
              <span
                className="inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium shrink-0"
                style={{ backgroundColor: getColor(visita.status) + "20", color: getColor(visita.status) }}
              >
                {getLabel(visita.status)}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 truncate">
              {TIPO_LABELS[visita.tipo] || visita.tipo} — {visita.dataVisita ? new Date(visita.dataVisita + "T12:00:00").toLocaleDateString("pt-BR") : "—"}{visita.hora ? ` às ${visita.hora}` : ""}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          {editing ? (
            <>
              <button onClick={handleSave} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline px-2 py-1.5 rounded-lg min-h-[36px]">
                <Check size={14} /> Salvar
              </button>
              <button onClick={cancelEditing} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:underline px-2 py-1.5 rounded-lg min-h-[36px]">
                <X size={14} /> Cancelar
              </button>
            </>
          ) : (
            <>
              <VisitReportButton visita={visita} />
              <SendSurveyButton visitaId={visita.id} empresaNome={visita.empresaNome || visita.clienteNome || undefined} contatoEmail={visita.contatoEmail || undefined} contatoNome={visita.contatoNome || undefined} />
              {canEdit && (
                <>
                  <button onClick={startEditing} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline px-2 py-1.5 rounded-lg min-h-[36px]">
                    <Pencil size={14} /> Editar
                  </button>
                  <button onClick={() => setShowDelete(true)} className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline px-2 py-1.5 rounded-lg min-h-[36px]">
                    <Trash2 size={14} /> Excluir
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {editing ? (
          <>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Informações</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                  <select
                    value={form.status || visita.status}
                    onChange={e => setField("status", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{getLabel(s)}</option>
                    ))}
                  </select>
                </div>
                {form.status === "CANCELADA" && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Motivo do Cancelamento</label>
                    <textarea
                      value={form.motivoCancelamento || ""}
                      onChange={e => setField("motivoCancelamento", e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                  <select
                    value={form.tipo}
                    onChange={e => setField("tipo", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  >
                    {TIPO_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Data da Visita</label>
                  <input
                    type="date"
                    value={form.dataVisita ? form.dataVisita.split("T")[0] : ""}
                    onChange={e => setField("dataVisita", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Hora</label>
                  <input
                    type="time"
                    value={form.hora || ""}
                    onChange={e => setField("hora", e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
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
                  <label className="block text-xs font-medium text-slate-500 mb-1">Duracao Estimada</label>
                  <select
                    value={form.duracaoEstimada || ""}
                    onChange={e => setField("duracaoEstimada", e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
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
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Endereço</h2>
                <button
                  type="button"
                  onClick={() => {
                    if (!visita.empresaId) {
                      toast.error("Visita sem pessoa vinculada")
                      return
                    }
                    copiarEnderecoEmpresa()
                  }}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                >
                  Copiar endereço do negócio
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Logradouro</label>
                  <input type="text" value={form.endereco || ""} onChange={e => setField("endereco", e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Número</label>
                    <input type="text" value={form.numero || ""} onChange={e => setField("numero", e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Complemento</label>
                    <input type="text" value={form.complemento || ""} onChange={e => setField("complemento", e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Bairro</label>
                    <input type="text" value={form.bairro || ""} onChange={e => setField("bairro", e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">CEP</label>
                    <input type="text" value={form.cep || ""} onChange={e => setField("cep", e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">UF</label>
                    <SelectUf value={form.uf || ""} onChange={v => setField("uf", v)} />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 mb-1">Cidade</label>
                    <SelectCidade value={form.cidade || ""} onChange={v => setField("cidade", v)} estadoId={estadoId} />
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Informações</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Status</span>
                  <span className="inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium"
                    style={{ backgroundColor: getColor(visita.status) + "20", color: getColor(visita.status) }}>
                    {getLabel(visita.status)}
                  </span>
                </div>
                {visita.status === "CANCELADA" && visita.motivoCancelamento && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">Motivo do Cancelamento</span>
                    <p className="text-slate-900 dark:text-slate-200">{visita.motivoCancelamento}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Tipo</span>
                  <p className="text-slate-900 dark:text-slate-200">{TIPO_LABELS[visita.tipo] || visita.tipo}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">Data da Visita</span>
                  <p className="text-slate-900 dark:text-slate-200">{visita.dataVisita ? new Date(visita.dataVisita + "T12:00:00").toLocaleDateString("pt-BR") : "—"}{visita.hora ? ` às ${visita.hora}` : ""}</p>
                </div>
                {visita.duracaoEstimada && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">Duracao Estimada</span>
                    <p className="text-slate-900 dark:text-slate-200">{visita.duracaoEstimada >= 60 ? `${Math.floor(visita.duracaoEstimada / 60)}h${visita.duracaoEstimada % 60 ? ` ${visita.duracaoEstimada % 60}min` : ""}` : `${visita.duracaoEstimada} min`}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-slate-500 block mb-0.5">{visita.empresaId ? "Pessoa (Negócio)" : "Cliente"}</span>
                  {visita.empresaId ? (
                    <Link href={`/comercial/crm/pessoas/${visita.empresaId}`} className="text-blue-600 hover:underline inline-flex items-center gap-1">
                      {visita.empresaNome} <ExternalLink size={12} />
                    </Link>
                  ) : (
                    <p className="text-slate-900 dark:text-slate-200">{visita.clienteNome || "—"}</p>
                  )}
                </div>
                {visita.oportunidadeTitulo && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">Oportunidade</span>
                    <p className="text-slate-900 dark:text-slate-200">{visita.oportunidadeTitulo}</p>
                  </div>
                )}
                {visita.contatoNome && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">Contato</span>
                    <p className="text-slate-900 dark:text-slate-200">{visita.contatoNome}</p>
                  </div>
                )}
                {visita.criadoPorNome && (
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">Criado por</span>
                    <p className="text-slate-900 dark:text-slate-200">{visita.criadoPorNome}</p>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <div className="flex items-center gap-2 mb-4">
                <MapPin size={16} className="text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Endereço</h2>
              </div>
              {visita.endereco || visita.numero || visita.bairro || visita.cidade ? (
                <div className="space-y-3">
                  <div>
                    <span className="text-xs text-slate-500 block mb-0.5">Logradouro</span>
                    <p className="text-sm text-slate-900 dark:text-slate-200">{visita.endereco || "—"}</p>
                  </div>
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                    <div>
                      <span className="text-xs text-slate-500 block mb-0.5">Número</span>
                      <p className="text-sm text-slate-900 dark:text-slate-200">{visita.numero || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-0.5">Complemento</span>
                      <p className="text-sm text-slate-900 dark:text-slate-200">{visita.complemento || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-0.5">Bairro</span>
                      <p className="text-sm text-slate-900 dark:text-slate-200">{visita.bairro || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-0.5">CEP</span>
                      <p className="text-sm text-slate-900 dark:text-slate-200">{visita.cep || "—"}</p>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block mb-0.5">UF</span>
                      <p className="text-sm text-slate-900 dark:text-slate-200">{visita.uf || "—"}</p>
                    </div>
                    <div className="col-span-2">
                      <span className="text-xs text-slate-500 block mb-0.5">Cidade</span>
                      <p className="text-sm text-slate-900 dark:text-slate-200">{visita.cidade || "—"}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Nenhum endereço informado</p>
              )}
            </div>
          </>
        )}

        {!editing && canEdit && (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 md:col-span-2">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Check-in / Check-out</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <LogIn size={16} className={visita.checkInTime ? "text-emerald-500" : "text-slate-400"} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Check-in</span>
                </div>
                {visita.checkInTime ? (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                      {new Date(visita.checkInTime).toLocaleString("pt-BR")}
                    </p>
                    {visita.checkInLat != null && visita.checkInLng != null && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${visita.checkInLat},${visita.checkInLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <Navigation size={12} /> Ver no Maps
                      </a>
                    )}
                    <button
                      onClick={() => handleUndo("undo_check_in")}
                      disabled={!!checkLoading || !!visita.checkOutTime}
                      className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1.5 rounded-lg min-h-[36px]"
                    >
                      <Undo2 size={12} /> Desfazer
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleCheck("check_in")}
                    disabled={checkLoading === "in" || !!visita.checkOutTime}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkLoading === "in" ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />}
                    {checkLoading === "in" ? "Registrando..." : "Fazer Check-in"}
                  </button>
                )}
              </div>

              <div className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <LogOut size={16} className={visita.checkOutTime ? "text-emerald-500" : "text-slate-400"} />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Check-out</span>
                </div>
                {visita.checkOutTime ? (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-900 dark:text-slate-100 font-medium">
                      {new Date(visita.checkOutTime).toLocaleString("pt-BR")}
                    </p>
                    {visita.checkOutLat != null && visita.checkOutLng != null && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${visita.checkOutLat},${visita.checkOutLng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline"
                      >
                        <Navigation size={12} /> Ver no Maps
                      </a>
                    )}
                    <button
                      onClick={() => handleUndo("undo_check_out")}
                      disabled={!!checkLoading}
                      className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors px-2 py-1.5 rounded-lg min-h-[36px]"
                    >
                      <Undo2 size={12} /> Desfazer
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleCheck("check_out")}
                    disabled={checkLoading === "out" || !visita.checkInTime}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {checkLoading === "out" ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                    {checkLoading === "out" ? "Registrando..." : "Fazer Check-out"}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {editing ? (
        <>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Relato / Ata</h2>
            <RelatoTemplateSelector onSelect={html => setField("relato", html)} />
            <RichTextEditor
              value={form.relato || ""}
              onChange={v => setField("relato", v)}
              placeholder="Descreva o relato da visita..."
              minHeight="250px"
            />
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <PhotoUpload photos={fotos} onPhotosChange={setFotos} />
          </div>
        </>
      ) : (
        <>
          {visita.relato && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Relato / Ata</h2>
              <div className="text-sm text-slate-700 dark:text-slate-300 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(visita.relato) }} />
            </div>
          )}

          {visita.fotos && visita.fotos.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Fotos</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {visita.fotos.map((url: string, i: number) => (
                  <a
                    key={i}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group aspect-video rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
                  >
                    <img
                      src={url}
                      alt={`Foto ${i + 1}`}
                      className="object-cover w-full h-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none"
                        const parent = (e.target as HTMLImageElement).parentElement
                        if (parent) {
                          parent.innerHTML = `<span class="text-xs text-slate-400">URL invalida</span>`
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 group-active:bg-black/40 transition-colors flex items-center justify-center">
                      <ExternalLink size={16} className="text-white opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <ConfirmModal
        open={showDelete}
        title="Excluir visita?"
        message="Tem certeza que deseja excluir esta visita?"
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}


