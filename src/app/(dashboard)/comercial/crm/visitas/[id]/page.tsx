"use client"

import { useState, useEffect } from "react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CalendarDays, Trash2, ExternalLink, Copy, MapPin } from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { useStatuses } from "@/hooks/use-statuses"

const TIPO_LABELS: Record<string, string> = {
  PRESENCIAL: "Presencial",
  VIDEO: "Vídeo",
  TELEFONE: "Telefone",
}

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

  useEffect(() => {
    fetch(`/api/crm/visitas/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setVisita(data)
        setForm(data)
      })
      .catch(() => toast.error("Erro ao carregar visita"))
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleSave() {
    try {
      const res = await fetch(`/api/crm/visitas/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      const updated = await res.json()
      setVisita(updated)
      setForm(updated)
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
      if (!res.ok) throw new Error("Erro ao excluir")
      toast.success("Visita excluída")
      router.push("/comercial/crm/visitas")
    } catch {
      toast.error("Erro ao excluir visita")
    } finally {
      setDeleteLoading(false)
      setShowDelete(false)
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

  function setField(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }))
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
              Visita — {visita.empresaNome || `#${visita.id}`}{info && <InfoButton content={info} />}
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
        <button onClick={() => setShowDelete(true)} className="flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
          <Trash2 size={14} /> Excluir
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Informações</h2>
          <div className="space-y-3 text-sm">
            <Field label="Empresa" value={visita.empresaNome} />
            {visita.empresaEndereco && (
              <Field label="End. Empresa" value={[visita.empresaEndereco, visita.empresaNumero, visita.empresaBairro, visita.empresaCidade, visita.empresaUf].filter(Boolean).join(", ")} />
            )}
            <Field label="Oportunidade" value={visita.oportunidadeTitulo} />
            <Field label="Contato" value={visita.contatoNome} />
            <Field label="Data" value={visita.dataVisita ? new Date(visita.dataVisita + "T12:00:00").toLocaleDateString("pt-BR") : "—"} />
            <Field label="Tipo" value={TIPO_LABELS[visita.tipo] || visita.tipo} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Status</h2>
            {!editing && (
              <button onClick={() => setEditing(true)} className="text-xs text-blue-600 hover:underline">
                Alterar status
              </button>
            )}
          </div>
          {editing ? (
            <div className="space-y-3">
              <select
                value={form.status || visita.status}
                onChange={e => setField("status", e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{getLabel(s)}</option>
                ))}
              </select>
              {form.status === "CANCELADA" && (
                <textarea
                  value={form.motivoCancelamento || ""}
                  onChange={e => setField("motivoCancelamento", e.target.value)}
                  placeholder="Motivo do cancelamento..."
                  rows={3}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
                />
              )}
              <div className="flex gap-2">
                <button onClick={handleSave} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                  Salvar
                </button>
                <button onClick={() => { setEditing(false); setForm(visita) }} className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1.5 rounded-lg">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <Field label="Status" value={getLabel(visita.status)} />
              {visita.motivoCancelamento && (
                <Field label="Motivo Cancelamento" value={visita.motivoCancelamento} />
              )}
            </div>
          )}
        </div>
      </div>

      {visita.endereco && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-slate-400" />
            Endereço da Visita
          </h2>
          <p className="text-sm text-slate-700 dark:text-slate-300">
            {[visita.endereco, visita.numero, visita.complemento, visita.bairro, visita.cidade, visita.uf].filter(Boolean).join(", ")}
            {visita.cep ? ` — CEP: ${visita.cep}` : ""}
          </p>
        </div>
      )}

      {visita.relato && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Relato / Ata</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{visita.relato}</p>
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

      <ConfirmModal
        open={showDelete}
        title="Excluir visita?"
        message={`Tem certeza que deseja excluir esta visita?`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-500 min-w-[100px]">{label}:</span>
      <span className="text-slate-900 dark:text-slate-200">{value || "—"}</span>
    </div>
  )
}
