"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Building2, Mail, Phone, Globe, MapPin, User, Plus, Trash2, Pencil, Check, X } from "lucide-react"
import { toast } from "sonner"
import { ConfirmModal } from "@/components/ui/confirm-modal"

const STATUS_OPTIONS = ["NOVO", "QUALIFICADO", "CONVERTIDO_CLIENTE", "PERDIDO", "INATIVO"]

const STATUS_CORES: Record<string, string> = {
  NOVO: "text-blue-600 bg-blue-50 dark:bg-blue-950/50 dark:text-blue-400",
  QUALIFICADO: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 dark:text-emerald-400",
  CONVERTIDO_CLIENTE: "text-green-600 bg-green-50 dark:bg-green-950/50 dark:text-green-400",
  PERDIDO: "text-red-600 bg-red-50 dark:bg-red-950/50 dark:text-red-400",
  INATIVO: "text-slate-400 bg-slate-100 dark:bg-slate-800 dark:text-slate-500",
}

export default function EmpresaDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [empresa, setEmpresa] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  useEffect(() => {
    fetch(`/api/crm/empresas/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setEmpresa(data)
        setForm(data)
      })
      .catch(() => toast.error("Erro ao carregar empresa"))
      .finally(() => setLoading(false))
  }, [params.id])

  async function handleSave() {
    try {
      const res = await fetch(`/api/crm/empresas/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      const updated = await res.json()
      setEmpresa(updated)
      setForm(updated)
      setEditing(false)
      toast.success("Empresa atualizada")
    } catch (err: any) {
      toast.error(err.message)
    }
  }

  async function handleDelete() {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/crm/empresas/${params.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      toast.success("Empresa excluída")
      router.push("/comercial/crm/empresas")
    } catch {
      toast.error("Erro ao excluir empresa")
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
      setEmpresa((prev: any) => ({ ...prev, contatos: [...(prev.contatos || []), novo] }))
      toast.success("Contato adicionado")
    } catch {
      toast.error("Erro ao adicionar contato")
    }
  }

  async function removeContato(contatoId: number) {
    try {
      const res = await fetch(`/api/crm/contatos/${contatoId}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Erro ao excluir")
      setEmpresa((prev: any) => ({
        ...prev,
        contatos: (prev.contatos || []).filter((c: any) => c.id !== contatoId),
      }))
      toast.success("Contato removido")
    } catch {
      toast.error("Erro ao remover contato")
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!empresa) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-500">Empresa não encontrada</p>
        <Link href="/comercial/crm/empresas" className="text-blue-600 hover:underline mt-2 inline-block">Voltar</Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
          <ArrowLeft size={18} className="text-slate-500" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">{empresa.razaoSocial}</h1>
            <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CORES[empresa.status] || ""}`}>
              {empresa.status}
            </span>
          </div>
          {empresa.nomeFantasia && (
            <p className="text-sm text-slate-500">{empresa.nomeFantasia}</p>
          )}
        </div>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button onClick={handleSave} className="flex items-center gap-1 text-xs font-medium text-emerald-600 hover:underline">
                <Check size={14} /> Salvar
              </button>
              <button onClick={() => { setEditing(false); setForm(empresa) }} className="flex items-center gap-1 text-xs font-medium text-slate-500 hover:underline">
                <X size={14} /> Cancelar
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
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
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Dados da Empresa</h2>
          <div className="space-y-3 text-sm">
            <Field label="CNPJ" value={empresa.cnpj} icon={Building2} />
            <Field label="Segmento" value={empresa.segmento} />
            <Field label="Porte" value={empresa.porte} />
            <Field label="Site" value={empresa.site} icon={Globe} />
            <Field label="Responsável" value={empresa.responsavelNome || "—"} icon={User} />
          </div>
          {empresa.observacoes && (
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <p className="text-xs text-slate-500 mb-1">Observações</p>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{empresa.observacoes}</p>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Contatos</h2>
            <button onClick={addContato} className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline">
              <Plus size={14} /> Adicionar
            </button>
          </div>
          {(empresa.contatos || []).length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">Nenhum contato cadastrado</p>
          ) : (
            <div className="space-y-2">
              {(empresa.contatos || []).map((contato: any) => (
                <div key={contato.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{contato.nome}</p>
                      {contato.principal && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">Principal</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      {contato.cargo && <span>{contato.cargo}</span>}
                      {contato.email && <span className="flex items-center gap-1"><Mail size={10} />{contato.email}</span>}
                      {contato.telefone && <span>{contato.telefone}</span>}
                    </div>
                  </div>
                  <button onClick={() => removeContato(contato.id)} className="p-1 text-slate-400 hover:text-red-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <ConfirmModal
        open={showDelete}
        title="Excluir empresa?"
        message={`Tem certeza que deseja excluir "${empresa.razaoSocial}"? Todos os contatos vinculados também serão removidos.`}
        confirmLabel="Excluir"
        variant="danger"
        loading={deleteLoading}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </div>
  )
}

function Field({ label, value, icon: Icon }: { label: string; value?: string | null; icon?: any }) {
  return (
    <div className="flex items-center gap-2">
      {Icon && <Icon size={14} className="text-slate-400 shrink-0" />}
      <span className="text-slate-500 min-w-[80px]">{label}:</span>
      <span className="text-slate-900 dark:text-slate-200">{value || "—"}</span>
    </div>
  )
}
