"use client"

import { useState, useEffect, useCallback } from "react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Trash2, Pencil, Check, X, MapPin, Plus, ExternalLink } from "lucide-react"
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
  const [fotoInputs, setFotoInputs] = useState<string[]>([""])
  const [estadoId, setEstadoId] = useState<number | null>(null)
  const [estados, setEstados] = useState<{ id: number; uf: string }[]>([])
  const [empresaEndereco, setEmpresaEndereco] = useState<Record<string, string>>({})

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

  async function loadVisita() {
    try {
      const res = await fetch(`/api/crm/visitas/${params.id}`)
      const data = await res.json()
      setVisita(data)
      setForm(data)
      if (data.fotos?.length > 0) {
        setFotoInputs([...data.fotos, ""])
      }
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
    setFotoInputs(visita.fotos?.length > 0 ? [...visita.fotos, ""] : [""])
    if (visita.empresaId) loadEmpresaEndereco(visita.empresaId)
    setEditing(true)
  }

  function cancelEditing() {
    setEditing(false)
    setForm(visita)
    setFotoInputs(visita.fotos?.length > 0 ? [...visita.fotos, ""] : [""])
  }

  async function handleSave() {
    try {
      const fotos = fotoInputs.filter(f => f.trim())
      const res = await fetch(`/api/crm/visitas/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          fotos: fotos.length > 0 ? fotos : [],
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

  function addFotoInput() {
    setFotoInputs(prev => [...prev, ""])
  }

  function updateFotoInput(index: number, value: string) {
    setFotoInputs(prev => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function removeFotoInput(index: number) {
    setFotoInputs(prev => prev.filter((_, i) => i !== index))
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

  const STATUS_OPTIONS = ["AGENDADA", "REALIZADA", "CANCELADA"]

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              Visita — {visita.empresaNome || visita.clienteNome || `#${visita.id}`}{info && <InfoButton content={info} />}
            </h1>
            <span
              className="inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium"
              style={{ backgroundColor: getColor(visita.status) + "20", color: getColor(visita.status) }}
            >
              {getLabel(visita.status)}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            {TIPO_LABELS[visita.tipo] || visita.tipo} — {visita.dataVisita ? new Date(visita.dataVisita + "T12:00:00").toLocaleDateString("pt-BR") : "—"}
          </p>
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={handleSave} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline">
                <Check size={14} /> Salvar
              </button>
              <button onClick={cancelEditing} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:underline">
                <X size={14} /> Cancelar
              </button>
            </>
          ) : (
            <>
              <VisitReportButton visita={visita} />
              <SendSurveyButton visitaId={visita.id} empresaNome={visita.empresaNome || visita.clienteNome || undefined} />
              <button onClick={startEditing} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
                <Pencil size={14} /> Editar
              </button>
              <button onClick={() => setShowDelete(true)} className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
                <Trash2 size={14} /> Excluir
              </button>
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
                  <p className="text-slate-900 dark:text-slate-200">{visita.dataVisita ? new Date(visita.dataVisita + "T12:00:00").toLocaleDateString("pt-BR") : "—"}</p>
                </div>
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
                  <div className="grid grid-cols-2 gap-3">
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
      </div>

      {editing ? (
        <>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Relato / Ata</h2>
            <RichTextEditor
              value={form.relato || ""}
              onChange={v => setField("relato", v)}
              placeholder="Descreva o relato da visita..."
              minHeight="250px"
            />
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Fotos (URLs)</h2>
              <button type="button" onClick={addFotoInput} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                <Plus size={12} /> Adicionar foto
              </button>
            </div>
            <div className="space-y-2">
              {fotoInputs.map((url, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="url"
                    value={url}
                    onChange={e => updateFotoInput(i, e.target.value)}
                    placeholder="https://..."
                    className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                  />
                  {fotoInputs.length > 1 && (
                    <button type="button" onClick={() => removeFotoInput(i)} className="p-1 text-slate-400 hover:text-red-500">
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
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
                          parent.innerHTML = `<span class="text-xs text-slate-400">URL inválida</span>`
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
                      <ExternalLink size={16} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
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


