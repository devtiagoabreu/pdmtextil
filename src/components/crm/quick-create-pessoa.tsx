"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Loader2, Search, Check, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import {
  Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogClose,
} from "@/components/ui/dialog"
import { SelectUf } from "./select-uf"
import { SelectCidade } from "./select-cidade"

type Props = {
  onCreated: (id: number, razaoSocial: string) => void
}

function formatCnpj(v: string) {
  const d = v.replace(/\D/g, "")
  if (d.length !== 14) return v
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`
}

export function QuickCreatePessoa({ onCreated }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [razaoSocial, setRazaoSocial] = useState("")
  const [nomeFantasia, setNomeFantasia] = useState("")
  const [cnpj, setCnpj] = useState("")
  const [segmento, setSegmento] = useState("")
  const [porte, setPorte] = useState("")
  const [endereco, setEndereco] = useState("")
  const [numero, setNumero] = useState("")
  const [complemento, setComplemento] = useState("")
  const [bairro, setBairro] = useState("")
  const [cidade, setCidade] = useState("")
  const [uf, setUf] = useState("")
  const [cep, setCep] = useState("")
  const [estadoId, setEstadoId] = useState<number | null>(null)
  const [estados, setEstados] = useState<{ id: number; uf: string }[]>([])

  const [consulting, setConsulting] = useState(false)
  const [consulted, setConsulted] = useState(false)
  const [apiData, setApiData] = useState<Record<string, any> | null>(null)

  const fetchEstados = useCallback(async () => {
    try {
      const res = await fetch("/api/crm/estados")
      if (res.ok) setEstados(await res.json())
    } catch {}
  }, [])

  useEffect(() => { fetchEstados() }, [fetchEstados])

  useEffect(() => {
    if (uf) {
      const found = estados.find(e => e.uf === uf)
      setEstadoId(found ? found.id : null)
    } else {
      setEstadoId(null)
    }
  }, [uf, estados])

  function resetForm() {
    setRazaoSocial("")
    setNomeFantasia("")
    setCnpj("")
    setSegmento("")
    setPorte("")
    setEndereco("")
    setNumero("")
    setComplemento("")
    setBairro("")
    setCidade("")
    setUf("")
    setCep("")
    setApiData(null)
    setConsulted(false)
  }

  async function handleConsultarCnpj() {
    const digits = cnpj.replace(/\D/g, "")
    if (digits.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos")
      return
    }
    setConsulting(true)
    setApiData(null)
    setConsulted(false)
    try {
      const res = await fetch(`/api/crm/consulta-cnpj?cnpj=${digits}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro na consulta")
      }
      const result = await res.json()
      const api = result.apiData
      if (!api) {
        setConsulted(true)
        toast.error("CNPJ não encontrado na Receita Federal")
        return
      }
      setApiData(api)
      setConsulted(true)
      setRazaoSocial(api.razao_social || "")
      setNomeFantasia(api.nome_fantasia || "")
      setSegmento(api.cnae_principal_descricao || "")
      setPorte(api.porte_empresa || "")
      setEndereco(api.logradouro || "")
      setNumero(api.numero || "")
      setComplemento(api.complemento || "")
      setBairro(api.bairro || "")
      setCidade(api.municipio || "")
      setUf(api.uf || "")
      setCep(api.cep || "")
      toast.success("Dados preenchidos automaticamente")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setConsulting(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!razaoSocial.trim() || !cnpj.trim()) {
      toast.error("Razão Social e CNPJ são obrigatórios")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/crm/pessoas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razaoSocial,
          nomeFantasia: nomeFantasia || null,
          cnpj,
          segmento: segmento || null,
          porte: porte || null,
          endereco: endereco || null,
          numero: numero || null,
          complemento: complemento || null,
          bairro: bairro || null,
          cidade: cidade || null,
          uf: uf || null,
          cep: cep || null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar pessoa")
      }
      const data = await res.json()
      onCreated(data.id, data.razaoSocial)
      setOpen(false)
      resetForm()
      toast.success("Pessoa criada com sucesso")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
      <DialogTrigger
        type="button"
        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
        title="Cadastrar nova pessoa (negócio)"
      >
        <Plus size={14} />
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl p-0">
        <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6">
          <DialogTitle>Nova Pessoa (Negócio)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Razão Social *</label>
            <input
              type="text"
              value={razaoSocial}
              onChange={e => setRazaoSocial(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nome Fantasia</label>
            <input
              type="text"
              value={nomeFantasia}
              onChange={e => setNomeFantasia(e.target.value)}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CNPJ *</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
                onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleConsultarCnpj())}
                className="flex-1 min-w-0 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                placeholder="00.000.000/0001-00"
                required
              />
              <button
                type="button"
                onClick={handleConsultarCnpj}
                disabled={consulting}
                className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-950/80 border border-blue-200 dark:border-blue-800 rounded-lg transition-colors disabled:opacity-50"
              >
                {consulting ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                <span className="hidden sm:inline">Consultar</span>
              </button>
            </div>
          </div>

          {consulted && !apiData && (
            <div className="rounded-lg border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0" />
              <p className="text-sm text-amber-700 dark:text-amber-300">
                CNPJ {formatCnpj(cnpj)} não encontrado na Receita Federal. Preencha os dados manualmente.
              </p>
            </div>
          )}

          {apiData && (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 p-3 flex items-start gap-2">
              <Check size={16} className="text-emerald-500 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-emerald-800 dark:text-emerald-300">{apiData.razao_social}</p>
                <p className="text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                  {apiData.nome_fantasia} — {apiData.situacao_cadastral}
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Segmento</label>
              <select
                value={segmento}
                onChange={e => setSegmento(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                <option value="CONFECCAO">Confecção</option>
                <option value="LAVANDERIA">Lavanderia</option>
                <option value="ESTAMPARIA">Estamparia</option>
                <option value="MALHARIA">Malharia</option>
                <option value="TINTURARIA">Tinturaria</option>
                <option value="ACABAMENTO">Acabamento</option>
                <option value="COMERCIO">Comércio</option>
                <option value="OUTRO">Outro</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Porte</label>
              <select
                value={porte}
                onChange={e => setPorte(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione...</option>
                <option value="ME">ME</option>
                <option value="EPP">EPP</option>
                <option value="MEDIO">Médio</option>
                <option value="GRANDE">Grande</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-400 mb-2">Endereço</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Logradouro</label>
                <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Número</label>
                <input type="text" value={numero} onChange={e => setNumero(e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Complemento</label>
                <input type="text" value={complemento} onChange={e => setComplemento(e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bairro</label>
                <input type="text" value={bairro} onChange={e => setBairro(e.target.value)} className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">UF</label>
                <SelectUf value={uf} onChange={setUf} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                <SelectCidade value={cidade} onChange={setCidade} estadoId={estadoId} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">CEP</label>
                <input type="text" value={cep} onChange={e => setCep(e.target.value)} placeholder="00.000-000" className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm" />
              </div>
            </div>
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <DialogClose
              type="button"
              className="w-full sm:w-auto px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-center"
            >
              Cancelar
            </DialogClose>
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors"
            >
              {saving && <Loader2 size={14} className="animate-spin" />}
              Criar
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
