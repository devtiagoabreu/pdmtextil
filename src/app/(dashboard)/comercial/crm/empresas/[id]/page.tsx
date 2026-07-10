"use client"

import { useState, useEffect, useCallback } from "react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useRouter, useParams, usePathname } from "next/navigation"
import Link from "next/link"
import { SelectUf } from "@/components/crm/select-uf"
import { SelectCidade } from "@/components/crm/select-cidade"
import { ArrowLeft, Mail, Phone, Globe, Plus, Trash2, Pencil, Check, X, Clock, MessageSquare } from "lucide-react"
import CrmEmpresaTimeline from "@/components/crm/crm-empresa-timeline"
import CrmEmpresaWhatsapp from "@/components/crm/crm-empresa-whatsapp"
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
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const params = useParams()
  const [empresa, setEmpresa] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<any>({})
  const [tipoPessoa, setTipoPessoa] = useState<"PF" | "PJ">("PJ")
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [estadoId, setEstadoId] = useState<number | null>(null)
  const [estados, setEstados] = useState<{ id: number; uf: string }[]>([])

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
    fetch(`/api/crm/empresas/${params.id}`)
      .then(r => r.json())
      .then(data => {
        setEmpresa(data)
        setForm(data)
        setTipoPessoa(data.tipoPessoa || "PJ")
      })
      .catch(() => toast.error("Erro ao carregar"))
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
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50">
              {empresa.tipoPessoa === "PF" ? (empresa.nome || empresa.razaoSocial) : empresa.razaoSocial}
              {info && <InfoButton content={info} />}
            </h1>
            {empresa.tipoPessoa && (
              <span className={`inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                empresa.tipoPessoa === "PF"
                  ? "text-purple-600 bg-purple-50 dark:bg-purple-950/50 dark:text-purple-400"
                  : "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50 dark:text-cyan-400"
              }`}>
                {empresa.tipoPessoa === "PF" ? "PF" : "PJ"}
              </span>
            )}
            <span className={`inline-flex text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_CORES[empresa.status] || ""}`}>
              {empresa.status}
            </span>
          </div>
          {empresa.tipoPessoa === "PJ" && empresa.nomeFantasia && (
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
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Dados da Pessoa</h2>
          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Tipo</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setTipoPessoa("PF"); setForm((p: any) => ({ ...p, tipoPessoa: "PF" })) }}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium border ${tipoPessoa === "PF" ? "border-purple-500 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                    PF
                  </button>
                  <button type="button" onClick={() => { setTipoPessoa("PJ"); setForm((p: any) => ({ ...p, tipoPessoa: "PJ" })) }}
                    className={`px-3 py-1.5 text-xs rounded-lg font-medium border ${tipoPessoa === "PJ" ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 text-cyan-700 dark:text-cyan-300" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"}`}>
                    PJ
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {tipoPessoa === "PF" ? (
                  <>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Nome</label>
                      <input type="text" value={form.nome || ""} onChange={e => setForm((p: any) => ({ ...p, nome: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">CPF</label>
                      <input type="text" value={form.cpf || ""} onChange={e => setForm((p: any) => ({ ...p, cpf: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-2">
                      <label className="block text-xs font-medium text-slate-500 mb-1">Razão Social</label>
                      <input type="text" value={form.razaoSocial || ""} onChange={e => setForm((p: any) => ({ ...p, razaoSocial: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Nome Fantasia</label>
                      <input type="text" value={form.nomeFantasia || ""} onChange={e => setForm((p: any) => ({ ...p, nomeFantasia: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">CNPJ</label>
                      <input type="text" value={form.cnpj || ""} onChange={e => setForm((p: any) => ({ ...p, cnpj: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                    </div>
                  </>
                )}
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Segmento</label>
                  <input type="text" value={form.segmento || ""} onChange={e => setForm((p: any) => ({ ...p, segmento: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Porte</label>
                  <select value={form.porte || ""} onChange={e => setForm((p: any) => ({ ...p, porte: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                    <option value="">Selecione...</option>
                    <option value="MEI">MEI</option>
                    <option value="ME">ME</option>
                    <option value="EPP">EPP</option>
                    <option value="MEDIO">Médio</option>
                    <option value="GRANDE">Grande</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Site</label>
                  <input type="url" value={form.site || ""} onChange={e => setForm((p: any) => ({ ...p, site: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 mb-1">Endereço</p>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Logradouro</label>
                  <input type="text" value={form.endereco || ""} onChange={e => setForm((p: any) => ({ ...p, endereco: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Número</label>
                  <input type="text" value={form.numero || ""} onChange={e => setForm((p: any) => ({ ...p, numero: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Complemento</label>
                  <input type="text" value={form.complemento || ""} onChange={e => setForm((p: any) => ({ ...p, complemento: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Bairro</label>
                  <input type="text" value={form.bairro || ""} onChange={e => setForm((p: any) => ({ ...p, bairro: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">UF</label>
                  <SelectUf value={form.uf || ""} onChange={v => setForm((p: any) => ({ ...p, uf: v }))} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Cidade</label>
                  <SelectCidade value={form.cidade || ""} onChange={v => setForm((p: any) => ({ ...p, cidade: v }))} estadoId={estadoId} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">CEP</label>
                  <input type="text" value={form.cep || ""} onChange={e => setForm((p: any) => ({ ...p, cep: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
                  <select value={form.status || "NOVO"} onChange={e => setForm((p: any) => ({ ...p, status: e.target.value }))} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Observações</label>
                  <textarea value={form.observacoes || ""} onChange={e => setForm((p: any) => ({ ...p, observacoes: e.target.value }))} rows={3} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-sm">
              {empresa.tipoPessoa === "PF" ? (
                <>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-0.5">Nome</p>
                    <p className="text-slate-900 dark:text-slate-200">{empresa.nome || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">CPF</p>
                    <p className="text-slate-900 dark:text-slate-200">{empresa.cpf || "—"}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-2">
                    <p className="text-xs text-slate-500 mb-0.5">Razão Social</p>
                    <p className="text-slate-900 dark:text-slate-200">{empresa.razaoSocial || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">Nome Fantasia</p>
                    <p className="text-slate-900 dark:text-slate-200">{empresa.nomeFantasia || "—"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-0.5">CNPJ</p>
                    <p className="text-slate-900 dark:text-slate-200">{empresa.cnpj || "—"}</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Segmento</p>
                <p className="text-slate-900 dark:text-slate-200">{empresa.segmento || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Porte</p>
                <p className="text-slate-900 dark:text-slate-200">{empresa.porte || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-0.5">Site</p>
                <p className="text-slate-900 dark:text-slate-200">{empresa.site || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-1 mb-1">Endereço</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-0.5">Logradouro</p>
                <p className="text-slate-900 dark:text-slate-200">{empresa.endereco || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Número</p>
                <p className="text-slate-900 dark:text-slate-200">{empresa.numero || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Complemento</p>
                <p className="text-slate-900 dark:text-slate-200">{empresa.complemento || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Bairro</p>
                <p className="text-slate-900 dark:text-slate-200">{empresa.bairro || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">UF</p>
                <p className="text-slate-900 dark:text-slate-200">{empresa.uf || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">Cidade</p>
                <p className="text-slate-900 dark:text-slate-200">{empresa.cidade || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-0.5">CEP</p>
                <p className="text-slate-900 dark:text-slate-200">{empresa.cep || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-0.5">Status</p>
                <p className="text-slate-900 dark:text-slate-200">{empresa.status || "—"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-slate-500 mb-0.5">Observações</p>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{empresa.observacoes || "—"}</p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Resumo IA
          </h2>
          {empresa.resumoIa ? (
            <div className="space-y-3 text-sm">
              <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">{empresa.resumoIa}</p>
              {empresa.sugestaoIa && (
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 p-3 border border-amber-200 dark:border-amber-900">
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mb-1">Sugestão da IA</p>
                  <p className="text-sm text-amber-800 dark:text-amber-300">{empresa.sugestaoIa}</p>
                </div>
              )}
              {empresa.dataResumoIa && (
                <p className="text-[10px] text-slate-400">
                  Gerado em {new Date(empresa.dataResumoIa).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-400 text-center py-6">Nenhum resumo disponível</p>
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

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-slate-100 dark:border-slate-800">
            <Clock size={16} className="text-slate-400" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Timeline</h2>
          </div>
          <CrmEmpresaTimeline empresaId={params.id as string} />
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b border-slate-100 dark:border-slate-800">
            <MessageSquare size={16} className="text-emerald-500" />
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50">WhatsApp</h2>
          </div>
          <CrmEmpresaWhatsapp empresaId={params.id as string} />
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


