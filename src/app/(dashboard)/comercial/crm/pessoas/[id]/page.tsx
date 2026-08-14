"use client"

import { Suspense, useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, useParams, usePathname, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Clock, MessageSquare } from "lucide-react"
import CrmPessoaTimeline from "@/components/crm/crm-pessoa-timeline"
import CrmPessoaWhatsapp from "@/components/crm/crm-pessoa-whatsapp"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { PessoaHeader } from "./components/header"
import { DadosPessoaCard } from "./components/dados-pessoa-card"
import { ContatosCard } from "./components/contatos-card"
import { RepresentantesCard } from "./components/representantes-card"
import { LeadsCard } from "./components/leads-card"
import { OportunidadesCard } from "./components/oportunidades-card"
import { PropostasCard } from "./components/propostas-card"

function PessoaDetailPageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const info = getInfoContent(pathname)
  const params = useParams()
  const [pessoa, setPessoa] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(searchParams.get("edit") === "true")
  const [form, setForm] = useState<any>({})
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PJ")
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [estadoId, setEstadoId] = useState<number | null>(null)
  const { data: estados = [] } = useQuery<{ id: number; uf: string }[]>({
    queryKey: ["crm-estados"],
    queryFn: async () => {
      const res = await fetch("/api/crm/estados")
      if (!res.ok) return []
      return res.json()
    },
  })

  const [vinculos, setVinculos] = useState<any[]>([])
  const { data: dadosVinculos, isLoading: loadingVinculos } = useQuery({
    queryKey: ["pessoa-representantes", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/crm/pessoas/${params.id}/representantes`)
      if (!res.ok) return []
      return res.json()
    },
  })

  useEffect(() => {
    if (dadosVinculos) setVinculos(dadosVinculos)
  }, [dadosVinculos])

  const [searchRep, setSearchRep] = useState("")
  const [repResults, setRepResults] = useState<any[]>([])
  const [searchingRep, setSearchingRep] = useState(false)
  const [repToRemove, setRepToRemove] = useState<any>(null)
  const [orfaos, setOrfaos] = useState<any[]>([])

  useEffect(() => {
    fetch("/api/crm/contatos?orfao=true")
      .then((r: any) => r.json())
      .then((data: any) => { if (Array.isArray(data)) setOrfaos(data) })
      .catch(() => toast.error("Erro ao carregar contatos órfãos"))
  }, [])

  useEffect(() => {
    if (form?.uf) {
      const found = estados.find((e: any) => e.uf === form.uf)
      setEstadoId(found ? found.id : null)
    } else {
      setEstadoId(null)
    }
  }, [form?.uf, estados])

  async function searchRepresentantes(query: string) {
    setSearchRep(query)
    if (query.length < 2) { setRepResults([]); return }
    setSearchingRep(true)
    try {
      const res = await fetch(`/api/representantes?q=${encodeURIComponent(query)}`)
      if (!res.ok) throw new Error()
      const data = await res.json()
      const existentes = new Set(vinculos.map((v: any) => v.representanteId))
      setRepResults(data.filter((r: any) => !existentes.has(r.id)))
    } catch {} finally {
      setSearchingRep(false)
    }
  }

  async function addRepresentante(representanteId: number) {
    try {
      const res = await fetch(`/api/crm/pessoas/${params.id}/representantes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ representanteId }),
      })
      if (!res.ok) throw new Error()
      const novo = await res.json()
      setVinculos(prev => [...prev, novo])
      setRepResults([])
      setSearchRep("")
      toast.success("Representante vinculado")
    } catch { toast.error("Erro ao vincular representante") }
  }

  async function removeRepresentante(vinculo: any) {
    try {
      const res = await fetch(`/api/crm/pessoas/${params.id}/representantes?id=${vinculo.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setVinculos(prev => prev.filter((v: any) => v.id !== vinculo.id))
      toast.success("Representante removido")
    } catch { toast.error("Erro ao remover representante") }
    setRepToRemove(null)
  }

  useEffect(() => {
    fetch(`/api/crm/pessoas/${params.id}`)
      .then((r: any) => r.json())
      .then((data: any) => {
        if (!data || data.error) {
          setPessoa(null)
          setForm({})
          return
        }
        setPessoa(data)
        setForm(data)
        setTipoPessoa(data.tipoPessoa || "PJ")
      })
      .catch(() => toast.error("Erro ao carregar"))
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleSave() {
    try {
      const res = await fetch(`/api/crm/pessoas/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      const updated = await res.json()
      setPessoa(updated)
      setForm(updated)
      setEditing(false)
      toast.success("Pessoa atualizada")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/crm/pessoas/${params.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast.success("Pessoa excluída")
      router.push("/comercial/crm/pessoas")
    } catch {
      toast.error("Erro ao excluir pessoa")
    } finally {
      setDeleteLoading(false)
      setShowDelete(false)
    }
  }

  async function addContato() {
    const nome = prompt("Nome do contato:")
    if (!nome) return
    try {
      const res = await fetch("/api/crm/contatos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, empresaId: parseInt(params.id as string) }),
      })
      if (!res.ok) throw new Error("Erro ao criar contato")
      const novo = await res.json()
      setPessoa((prev: any) => ({ ...prev, contatos: [...(prev.contatos || []), novo] }))
      toast.success("Contato adicionado")
    } catch {
      toast.error("Erro ao adicionar contato")
    }
  }

  async function removerContato(contatoId: number) {
    try {
      const res = await fetch(`/api/crm/contatos/${contatoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId: null, clienteId: null }),
      })
      if (!res.ok) throw new Error("Erro ao desvincular")
      const atualizado = await res.json()
      setPessoa((prev: any) => ({
        ...prev,
        contatos: (prev.contatos || []).filter((c: any) => c.id !== contatoId),
      }))
      setOrfaos(prev => [...prev, atualizado])
      toast.success("Contato desvinculado")
    } catch {
      toast.error("Erro ao desvincular contato")
    }
  }

  async function vincularContato(contatoId: number) {
    try {
      const res = await fetch(`/api/crm/contatos/${contatoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId: parseInt(params.id as string) }),
      })
      if (!res.ok) throw new Error("Erro ao vincular")
      const atualizado = await res.json()
      setPessoa((prev: any) => ({ ...prev, contatos: [...(prev.contatos || []), atualizado] }))
      setOrfaos(prev => prev.filter((c: any) => c.id !== contatoId))
      toast.success("Contato vinculado")
    } catch {
      toast.error("Erro ao vincular contato")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!pessoa) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Pessoa não encontrada</p>
        <Link href="/comercial/crm/pessoas" className="text-blue-600 hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <PessoaHeader
        pessoa={pessoa}
        info={info}
        editing={editing}
        onBack={() => router.back()}
        onSave={handleSave}
        onCancel={() => { setEditing(false); setForm(pessoa) }}
        onEdit={() => setEditing(true)}
        onDelete={() => setShowDelete(true)}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <DadosPessoaCard
          pessoa={pessoa}
          form={form}
          setForm={setForm}
          editing={editing}
          tipoPessoa={tipoPessoa}
          setTipoPessoa={setTipoPessoa}
          estadoId={estadoId}
        />

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Resumo IA
          </h2>
          {pessoa.resumoIa ? (
            <div className="space-y-3 text-sm">
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{pessoa.resumoIa}</p>
              {pessoa.sugestaoIa && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200 dark:border-amber-900">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Sugestão da IA</p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{pessoa.sugestaoIa}</p>
                </div>
              )}
              {pessoa.dataResumoIa && (
                <p className="text-[10px] text-slate-400">
                  Gerado em {new Date(pessoa.dataResumoIa).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">Nenhum resumo disponível</p>
          )}
        </div>

        <ContatosCard
          contatos={pessoa.contatos || []}
          orfaos={orfaos}
          onAdd={addContato}
          onVincular={vincularContato}
          onRemover={removerContato}
        />
      </div>

      <RepresentantesCard
        vinculos={vinculos}
        loadingVinculos={loadingVinculos}
        searchRep={searchRep}
        repResults={repResults}
        searchingRep={searchingRep}
        onSearch={searchRepresentantes}
        onAdd={addRepresentante}
        onRemoveClick={setRepToRemove}
      />

      <div className="grid gap-6 md:grid-cols-3">
        <LeadsCard empresaId={params.id as string} />
        <OportunidadesCard empresaId={params.id as string} />
        <PropostasCard empresaId={params.id as string} />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-slate-100 dark:border-slate-800">
            <Clock size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Timeline</h2>
          </div>
          <CrmPessoaTimeline pessoaId={params.id as string} />
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-slate-100 dark:border-slate-800">
            <MessageSquare size={16} className="text-emerald-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">WhatsApp</h2>
          </div>
          <CrmPessoaWhatsapp pessoaId={params.id as string} />
        </div>
      </div>

      <ConfirmModal
        open={!!repToRemove}
        title="Remover representante"
        message={`Deseja remover ${repToRemove?.nome} desta pessoa?`}
        variant="danger"
        confirmLabel="Remover"
        onConfirm={() => repToRemove && removeRepresentante(repToRemove)}
        onCancel={() => setRepToRemove(null)}
      />
      <ConfirmModal
        open={showDelete}
        title="Excluir pessoa?"
        message={`Tem certeza que deseja excluir "${pessoa.razaoSocial}"? Todos os registros vinculados (contatos, visitas, tarefas, propostas, timeline e conversas WhatsApp) também serão removidos. Esta ação não pode ser desfeita.`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}

export default function PessoaDetailPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <PessoaDetailPageContent />
    </Suspense>
  )
}
