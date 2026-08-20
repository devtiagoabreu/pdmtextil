"use client"

import { useState, useEffect } from "react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plane, Loader2, MapPin, Calendar, Users, Wallet } from "lucide-react"
import { toast } from "sonner"
import { ViagemForm, VIAGEM_STATUS_OPTIONS } from "@/components/crm/viagem-form"
import { linhaParaForm, type InvestimentoLinha } from "@/lib/crm/viagem"

const STATUS_CORES: Record<string, string> = {
  PLANEJADA: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  EM_ANDAMENTO: "text-amber-600 bg-amber-50 dark:bg-amber-950/50 dark:text-amber-400",
  CONCLUIDA: "text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400",
  CANCELADA: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400",
}

export default function ViagemDetailPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const params = useParams()
  const [viagem, setViagem] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [investimentos, setInvestimentos] = useState<InvestimentoLinha[]>([])
  const [saving, setSaving] = useState(false)

  function setField(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  useEffect(() => {
    fetch(`/api/crm/viagens/${params.id}`)
      .then((r: any) => r.json())
      .then((data: any) => {
        setViagem(data)
        setForm(data)
        setInvestimentos((data.investimentos || []).map(linhaParaForm))
      })
      .catch(() => toast.error("Erro ao carregar viagem"))
      .finally(() => setLoading(false))
  }, [params.id])

  function startEditing() {
    setForm(viagem)
    setInvestimentos((viagem.investimentos || []).map(linhaParaForm))
    setEditing(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const res = await fetch(`/api/crm/viagens/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: form.titulo,
          descricao: form.descricao || null,
          destinoCidade: form.destinoCidade || null,
          destinoUf: form.destinoUf || null,
          dataInicio: form.dataInicio || null,
          dataFim: form.dataFim || null,
          status: form.status,
          investimentos: investimentos
            .filter((i) => i.valor !== "" || i.observacao !== "")
            .map((i) => ({
              tipo: i.tipo,
              valor: i.valor !== "" ? Number(i.valor) : null,
              observacao: i.observacao,
            })),
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao atualizar viagem")
      }
      const updated = await res.json()
      setViagem({ ...viagem, ...updated, investimentos })
      setEditing(false)
      toast.success("Viagem atualizada")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="animate-spin h-8 w-8 text-slate-400" />
      </div>
    )
  }

  if (!viagem) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Viagem não encontrada</p>
        <Link href="/comercial/crm/viagens" className="text-blue-600 hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    )
  }

  const totalInvestimento = (viagem.investimentos || []).reduce(
    (acc: number, i: any) => acc + (Number(i.valor) || 0),
    0
  )
  const statusLabel = VIAGEM_STATUS_OPTIONS.find(s => s.value === viagem.status)?.label || viagem.status
  const statusColor = STATUS_CORES[viagem.status] || "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"

  return (
    <div className="max-w-3xl animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 flex items-center gap-2">
            <Plane size={20} className="text-blue-600" />
            {viagem.titulo}{info && <InfoButton content={info} />}
          </h1>
          <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 mt-1">
            {viagem.destinoCidade && (
              <span className="flex items-center gap-1">
                <MapPin size={13} />
                {viagem.destinoCidade}{viagem.destinoUf ? ` - ${viagem.destinoUf}` : ""}
              </span>
            )}
            {viagem.dataInicio && (
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {new Date(viagem.dataInicio + "T12:00:00").toLocaleDateString("pt-BR")}
                {viagem.dataFim && ` a ${new Date(viagem.dataFim + "T12:00:00").toLocaleDateString("pt-BR")}`}
              </span>
            )}
            <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${statusColor}`}>
              {statusLabel}
            </span>
          </div>
        </div>
        <button
          onClick={() => (editing ? setEditing(false) : startEditing())}
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          {editing ? "Cancelar" : "Editar"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">
            <Wallet size={16} className="text-emerald-600" />
            Investimento Total
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {totalInvestimento.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">
            <Users size={16} className="text-blue-600" />
            Visitas Vinculadas
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {(viagem.visitas || []).length}
          </p>
        </div>
      </div>

      {viagem.descricao && !editing && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-4">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Descrição</h2>
          <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{viagem.descricao}</p>
        </div>
      )}

      {editing ? (
        <div className="space-y-4">
          <ViagemForm
            form={form}
            setField={setField}
            investimentos={investimentos}
            setInvestimentos={setInvestimentos}
          />
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {saving && <Loader2 size={16} className="animate-spin" />}
              {saving ? "Salvando..." : "Salvar Alterações"}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <>
          {viagem.investimentos.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-4">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Investimentos</h2>
              <div className="space-y-2">
                {viagem.investimentos.map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{inv.tipo}</p>
                      {inv.observacao && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">{inv.observacao}</p>
                      )}
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {Number(inv.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-3">Visitas Vinculadas</h2>
            {viagem.visitas.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400 py-2">
                Nenhuma visita vinculada. Vincule visitas a esta viagem pelo campo &quot;Viagem&quot; ao criar/editar uma visita.
              </p>
            ) : (
              <div className="space-y-2">
                {viagem.visitas.map((v: any) => (
                  <Link
                    key={v.id}
                    href={`/comercial/crm/visitas/${v.id}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2.5 text-sm hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                  >
                    <span className="font-medium text-slate-900 dark:text-slate-100">
                      {v.empresaNome || v.clienteNome || v.nomeAvulso || `Visita #${v.id}`}
                    </span>
                    <span className="text-xs text-slate-500">
                      {v.dataVisita ? new Date(v.dataVisita + "T12:00:00").toLocaleDateString("pt-BR") : ""}
                      {v.hora ? ` às ${v.hora}` : ""}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
