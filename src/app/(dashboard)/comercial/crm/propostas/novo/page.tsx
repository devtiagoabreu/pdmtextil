"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Loader2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { QuickCreatePessoa } from "@/components/crm/quick-create-pessoa"
import { QuickCreateOportunidade } from "@/components/crm/quick-create-oportunidade"

async function fetchEmpresas() {
  const res = await fetch("/api/crm/pessoas")
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

async function fetchOportunidades() {
  const res = await fetch("/api/crm/oportunidades")
  if (!res.ok) throw new Error("Falha ao carregar")
  return res.json()
}

export default function NovaPropostaPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const queryClient = useQueryClient()
  const [titulo, setTitulo] = useState("")
  const [empresaId, setEmpresaId] = useState("")
  const [oportunidadeId, setOportunidadeId] = useState("")
  const [valor, setValor] = useState("")
  const [descricao, setDescricao] = useState("")
  const [condicoesPagamento, setCondicoesPagamento] = useState("")
  const [prazoEntrega, setPrazoEntrega] = useState("")
  const [arquivoUrl, setArquivoUrl] = useState("")

  const { data: empresas } = useQuery({ queryKey: ["crm-pessoas"], queryFn: fetchEmpresas })
  const { data: oportunidades } = useQuery({ queryKey: ["crm-oportunidades"], queryFn: fetchOportunidades })

  function handleEmpresaCreated(id: number) {
    queryClient.invalidateQueries({ queryKey: ["crm-pessoas"] })
    setEmpresaId(String(id))
  }

  function handleOportunidadeCreated(id: number) {
    queryClient.invalidateQueries({ queryKey: ["crm-oportunidades"] })
    setOportunidadeId(String(id))
  }

  const mutation = useMutation({
    mutationFn: async (body: any) => {
      const res = await fetch("/api/crm/propostas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error("Falha ao criar proposta")
      return res.json()
    },
    onSuccess: (data) => {
      router.push(`/comercial/crm/propostas/${data.id}`)
    },
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link href="/comercial/crm/propostas" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Nova Proposta{info && <InfoButton content={info} />}</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Preencha os dados da proposta comercial</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título *</label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ex: Proposta Comercial - Tecido X"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Pessoa (Negócio) *
              <QuickCreatePessoa onCreated={handleEmpresaCreated} />
            </label>
            <select
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione...</option>
              {(empresas || []).map((e: any) => (
                <option key={e.id} value={e.id}>{e.razaoSocial}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Oportunidade
              <QuickCreateOportunidade empresaId={empresaId} onCreated={handleOportunidadeCreated} />
            </label>
            <select
              value={oportunidadeId}
              onChange={(e) => setOportunidadeId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Nenhuma</option>
              {(oportunidades || []).map((o: any) => (
                <option key={o.id} value={o.id}>{o.titulo}</option>
              ))}
            </select>
          </div>
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
            placeholder="Detalhes da proposta..."
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
          <p className="text-[10px] text-slate-400 mt-1">URL do PDF hospedado (Blob storage futuramente)</p>
        </div>

        <div className="flex gap-3 justify-end pt-2">
          <Link
            href="/comercial/crm/propostas"
            className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            Cancelar
          </Link>
          <button
            onClick={() => mutation.mutate({
              titulo,
              empresaId: empresaId ? parseInt(empresaId) : null,
              oportunidadeId: oportunidadeId ? parseInt(oportunidadeId) : null,
              valor: valor ? parseFloat(valor) : null,
              descricao,
              condicoesPagamento,
              prazoEntrega,
              arquivoUrl: arquivoUrl || null,
            })}
            disabled={!titulo || !empresaId || mutation.isPending}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
          >
            {mutation.isPending && <Loader2 size={14} className="animate-spin" />}
            Criar Proposta
          </button>
        </div>
      </div>
    </div>
  )
}
