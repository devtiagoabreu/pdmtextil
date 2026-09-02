"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useParams, usePathname, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { ArrowLeft, ExternalLink, CheckCircle2, XCircle, RefreshCw, Clock, Pencil, Trash2, Loader2, Check, X } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { toast } from "sonner"

async function fetchProposta(id: string) {
  const res = await fetch(`/api/crm/propostas/${id}`)
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

const STATUS_OPCOES = [
  { value: "ENVIADA", label: "Enviada", cor: "text-blue-600 bg-blue-100 dark:bg-blue-950 dark:text-blue-400" },
  { value: "REVISAO", label: "Em Revisão", cor: "text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-400" },
  { value: "ACEITA", label: "Aceita", cor: "text-green-600 bg-green-100 dark:bg-green-950 dark:text-green-400" },
  { value: "RECUSADA", label: "Recusada", cor: "text-red-600 bg-red-100 dark:bg-red-950 dark:text-red-400" },
]

export default function DetalhePropostaPage() {
  const params = useParams()
  const pathname = usePathname()
  const router = useRouter()
  const info = getInfoContent(pathname)
  const queryClient = useQueryClient()
  const { data: session } = useSession()
  const id = params.id as string
  const [statusToConfirm, setStatusToConfirm] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [showDelete, setShowDelete] = useState(false)

  const { data: proposta, isLoading } = useQuery({
    queryKey: ["crm-proposta", id],
    queryFn: () => fetchProposta(id),
    retry: 1,
  })

  const statusMutation = useMutation({
    mutationFn: async (novoStatus: string) => {
      const res = await fetch(`/api/crm/propostas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: novoStatus }),
      })
      if (!res.ok) throw new Error("Falha ao atualizar status")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-proposta", id] })
      queryClient.invalidateQueries({ queryKey: ["crm-propostas"] })
    },
  })

  const saveMutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch(`/api/crm/propostas/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Falha ao atualizar proposta")
      return res.json()
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["crm-proposta", id], data)
      queryClient.invalidateQueries({ queryKey: ["crm-propostas"] })
      setEditing(false)
      toast.success("Proposta atualizada com sucesso!")
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar proposta"),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/propostas/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      return res.json()
    },
    onSuccess: () => {
      toast.success("Proposta excluída")
      router.push("/comercial/crm/propostas")
    },
    onError: (err: any) => toast.error(err.message || "Erro ao excluir proposta"),
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!proposta) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Proposta não encontrada</p>
        <Link href="/comercial/crm/propostas" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          Voltar para propostas
        </Link>
      </div>
    )
  }

  const userRole = (session?.user as any)?.role
  const userId = session?.user?.id ? parseInt(session.user.id) : null
  const isAdmin = userRole === "ADMIN" || userRole === "SUDO"
  const isOwner = userId != null && proposta?.criadoPor === userId
  const canEdit = isAdmin || isOwner

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/comercial/crm/propostas" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">{proposta.titulo}{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Proposta #{proposta.id}</p>
        </div>
        {canEdit && (
          <div className="flex items-center gap-2">
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:underline"
              >
                <Pencil size={14} /> Editar
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setShowDelete(true)} className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:underline">
                <Trash2 size={14} /> Excluir
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-5">
          {editing ? (
            <EdicaoProposta
              proposta={proposta}
              saving={saveMutation.isPending}
              onCancel={() => setEditing(false)}
              onSave={(body) => saveMutation.mutate(body)}
            />
          ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Informações</h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Pessoa / Cliente</span>
                <span className="text-slate-900 dark:text-slate-200 font-medium">{proposta.empresaNome || proposta.clienteNome || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Oportunidade</span>
                <span className="text-slate-900 dark:text-slate-200">{proposta.oportunidadeId || "—"}</span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Valor</span>
                <span className="text-slate-900 dark:text-slate-200 font-semibold">
                  {proposta.valor ? `R$ ${Number(proposta.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "—"}
                </span>
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Prazo de Entrega</span>
                <span className="text-slate-900 dark:text-slate-200">{proposta.prazoEntrega || "—"}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-500 dark:text-slate-400 block text-xs">Condições de Pagamento</span>
                <span className="text-slate-900 dark:text-slate-200">{proposta.condicoesPagamento || "—"}</span>
              </div>
              {proposta.descricao && (
                <div className="col-span-2">
                  <span className="text-slate-500 dark:text-slate-400 block text-xs">Descrição</span>
                  <p className="text-slate-900 dark:text-slate-200 mt-1 whitespace-pre-wrap text-sm">{proposta.descricao}</p>
                </div>
              )}
            </div>

            {proposta.arquivoUrl && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                <a
                  href={proposta.arquivoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                  <ExternalLink size={16} />
                  Ver PDF da Proposta
                </a>
              </div>
            )}
          </div>
          )}

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-4">Timeline</h2>
            <div className="space-y-3">
              {proposta.dataEnvio && (
                <div className="flex items-center gap-3 text-sm">
                  <Clock size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500">Enviada em {new Date(proposta.dataEnvio).toLocaleString("pt-BR")}</span>
                </div>
              )}
              {proposta.dataResposta && (
                <div className="flex items-center gap-3 text-sm">
                  <RefreshCw size={14} className="text-slate-400 shrink-0" />
                  <span className="text-slate-500">Respondida em {new Date(proposta.dataResposta).toLocaleString("pt-BR")}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Clock size={14} className="text-slate-400 shrink-0" />
                <span className="text-slate-500">Criada em {new Date(proposta.createdAt).toLocaleString("pt-BR")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">Status</h2>
            <span
              className={`inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full font-medium ${
                STATUS_OPCOES.find((s: any) => s.value === proposta.status)?.cor || ""
              }`}
            >
              {proposta.status === "ACEITA" ? <CheckCircle2 size={14} /> :
               proposta.status === "RECUSADA" ? <XCircle size={14} /> :
               proposta.status === "REVISAO" ? <RefreshCw size={14} /> :
               <Clock size={14} />}
              {STATUS_OPCOES.find((s: any) => s.value === proposta.status)?.label || proposta.status}
            </span>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">Alterar Status</h2>
            <div className="space-y-2">
              {STATUS_OPCOES.map((opcao: any) => (
                <button
                  key={opcao.value}
                  onClick={() => {
                    if (opcao.value === "RECUSADA") {
                      setStatusToConfirm(opcao.value)
                    } else {
                      statusMutation.mutate(opcao.value)
                    }
                  }}
                  disabled={opcao.value === proposta.status || statusMutation.isPending}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    opcao.value === proposta.status
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                      : "hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <span className={`inline-block w-2 h-2 rounded-full mr-2 ${opcao.cor.split(" ")[0]}`} />
                  {opcao.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ConfirmModal
        open={!!statusToConfirm}
        title="Alterar status para Recusada?"
        message="A proposta será marcada como RECUSADA. Esta ação pode ser revertida alterando o status novamente."
        variant="danger"
        confirmLabel="Confirmar"
        loading={statusMutation.isPending}
        onConfirm={() => { if (statusToConfirm) { statusMutation.mutate(statusToConfirm); setStatusToConfirm(null) } }}
        onCancel={() => setStatusToConfirm(null)}
      />

      <ConfirmModal
        open={showDelete}
        title="Excluir proposta?"
        message={`Tem certeza que deseja excluir "${proposta.titulo}"?`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteMutation.isPending}
        onConfirm={() => deleteMutation.mutate()}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}

function EdicaoProposta({ proposta, saving, onCancel, onSave }: {
  proposta: any
  saving: boolean
  onCancel: () => void
  onSave: (body: any) => void
}) {
  const [titulo, setTitulo] = useState(proposta.titulo)
  const [valor, setValor] = useState(proposta.valor ?? "")
  const [prazoEntrega, setPrazoEntrega] = useState(proposta.prazoEntrega ?? "")
  const [condicoesPagamento, setCondicoesPagamento] = useState(proposta.condicoesPagamento ?? "")
  const [descricao, setDescricao] = useState(proposta.descricao ?? "")
  const [arquivoUrl, setArquivoUrl] = useState(proposta.arquivoUrl ?? "")

  function handleSave() {
    if (!titulo.trim()) {
      toast.error("O título é obrigatório")
      return
    }
    onSave({
      titulo,
      valor: valor ? parseFloat(valor) : null,
      prazoEntrega,
      condicoesPagamento,
      descricao,
      arquivoUrl: arquivoUrl || null,
    })
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">Editar Proposta</h2>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título *</label>
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Valor (R$)</label>
          <input
            type="number"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0,00"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Prazo de Entrega</label>
          <input
            type="text"
            value={prazoEntrega}
            onChange={(e) => setPrazoEntrega(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: 30 dias"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Condições de Pagamento</label>
        <input
          type="text"
          value={condicoesPagamento}
          onChange={(e) => setCondicoesPagamento(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ex: 30/60/90 dias"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Descrição</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Link do Arquivo (PDF)</label>
        <input
          type="url"
          value={arquivoUrl}
          onChange={(e) => setArquivoUrl(e.target.value)}
          className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://..."
        />
      </div>

      <div className="flex gap-3 justify-end pt-2">
        <button
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X size={14} />
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          Salvar Alterações
        </button>
      </div>
    </div>
  )
}
