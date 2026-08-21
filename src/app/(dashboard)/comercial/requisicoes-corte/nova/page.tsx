"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { SuggestionInput } from "@/components/ui/suggestion-input"
import { CreatableSelect } from "@/components/ui/creatable-select"
import { Plus, Trash2, Copy, ChevronUp, ChevronDown, UserPlus, Search, Loader2 } from "lucide-react"
import OcrInput from "@/components/ui/ocr-input"
import Link from "next/link"
import { toast } from "sonner"
import { PageSkeleton } from "@/components/ui/page-skeleton"

type DestinoTipo = "cliente" | "fornecedor" | "representante"

interface ItemLinha {
  id: string
  codigoProduto: string
  ordem: string
  artigo: string
  cor: string
  desenho: string
  quantidade: string
  destinoTipo: DestinoTipo | null
  clienteId: number | null
  clienteNome: string | null
  fornecedorId: number | null
  fornecedorNome: string | null
  representanteId: number | null
  representanteNome: string | null
}

function itemVazio(): ItemLinha {
  return {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()),
    codigoProduto: "",
    ordem: "",
    artigo: "",
    cor: "",
    desenho: "",
    quantidade: "",
    destinoTipo: null,
    clienteId: null,
    clienteNome: null,
    fornecedorId: null,
    fornecedorNome: null,
    representanteId: null,
    representanteNome: null,
  }
}

function copiarItem(item: ItemLinha): ItemLinha {
  return {
    ...item,
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now() + Math.random()),
  }
}

const TIPO_LABELS: Record<DestinoTipo, string> = { cliente: "Cliente", fornecedor: "Fornecedor", representante: "Representante" }

function ItemNovoModal({
  tipo,
  isConsultandoCnpj,
  onConsultarCnpj,
  onSuccess,
  onCancel,
}: {
  tipo: DestinoTipo
  isConsultandoCnpj: boolean
  onConsultarCnpj: () => Promise<void>
  onSuccess: (id: number, nome: string) => void
  onCancel: () => void
}) {
  const isCliente = tipo === "cliente"
  const isRepresentante = tipo === "representante"
  const [data, setData] = useState(() => isCliente
    ? { nome: "", cnpj: "", razaoSocial: "", email: "", emailNf: "", telefone: "", celular: "", contato: "", segmento: "", endereco: "", cidade: "", uf: "" }
    : { nome: "", cnpj: "", razaoSocial: "", email: "", telefone: "", contato: "", endereco: "", cidade: "", uf: "" }
  )
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!data.nome.trim()) { toast.error("Nome é obrigatório"); return }
    if (isRepresentante && !data.cnpj.trim()) { toast.error("CNPJ é obrigatório para representante"); return }
    setSaving(true)
    try {
      const url = isCliente ? "/api/clientes" : tipo === "fornecedor" ? "/api/cadastros/fornecedores" : "/api/representantes"
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) })
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Erro ao criar") }
      const created = await res.json()
      toast.success(`${TIPO_LABELS[tipo]} criado(a) com sucesso!`)
      onSuccess(created.id, created.nome)
    } catch (err: any) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const handleCnpjLookup = async () => {
    const digits = data.cnpj.replace(/\D/g, "")
    if (digits.length !== 14) { toast.error("CNPJ deve ter 14 dígitos"); return }
    try {
      const res = await fetch(`/api/crm/consulta-cnpj?cnpj=${digits}`)
      if (!res.ok) throw new Error((await res.json()).error)
      const result = await res.json()
      const api = result.apiData
      if (!api) { toast.error("CNPJ não encontrado"); return }
      setData((prev: any) => ({
        ...prev,
        nome: api.nome_fantasia || prev.nome,
        cnpj: api.cnpj || prev.cnpj,
        razaoSocial: api.razao_social || prev.razaoSocial,
        endereco: [api.logradouro, api.numero, api.bairro].filter(Boolean).join(", ") || prev.endereco,
        cidade: api.municipio || prev.cidade,
        uf: api.uf || prev.uf,
        ...(isCliente ? { segmento: api.cnae_principal_descricao || prev.segmento } : {}),
      }))
      toast.success("Dados preenchidos pela Receita Federal")
    } catch (err: any) { toast.error(err.message) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Novo {TIPO_LABELS[tipo]}</h3>
        <p className="text-sm text-slate-500">Digite o CNPJ e clique em Consultar para preencher automaticamente.</p>
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">CNPJ {isRepresentante && <span className="text-red-500">*</span>}</Label>
            <div className="flex gap-2">
              <Input value={data.cnpj} onChange={(e) => setData((p) => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" className="font-mono flex-1" maxLength={18} />
              <Button type="button" variant="outline" size="sm" onClick={handleCnpjLookup} disabled={isConsultandoCnpj || data.cnpj.replace(/\D/g, "").length !== 14} className="gap-1 shrink-0">
                {isConsultandoCnpj ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Consultar
              </Button>
            </div>
          </div>
          <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome <span className="text-red-500">*</span></Label><Input value={data.nome} onChange={(e) => setData((p) => ({ ...p, nome: e.target.value }))} placeholder={`Nome do ${TIPO_LABELS[tipo].toLowerCase()}`} /></div>
          <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Razão Social</Label><Input value={data.razaoSocial} onChange={(e) => setData((p) => ({ ...p, razaoSocial: e.target.value }))} placeholder="Razão Social" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label><Input type="email" value={data.email} onChange={(e) => setData((p) => ({ ...p, email: e.target.value }))} placeholder="contato@email.com" /></div>
            {isCliente && <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email NF</Label><Input type="email" value={(data as any).emailNf || ""} onChange={(e) => setData((p) => ({ ...p, emailNf: e.target.value } as any))} placeholder="nf@email.com" /></div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</Label><Input value={data.telefone} onChange={(e) => setData((p) => ({ ...p, telefone: e.target.value }))} placeholder="(11) 3333-4444" /></div>
            {isCliente && <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Celular</Label><Input value={(data as any).celular || ""} onChange={(e) => setData((p) => ({ ...p, celular: e.target.value } as any))} placeholder="(11) 99999-9999" /></div>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contato</Label><Input value={data.contato} onChange={(e) => setData((p) => ({ ...p, contato: e.target.value }))} placeholder="Nome do contato" /></div>
            {isCliente && <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Segmento</Label><Input value={(data as any).segmento || ""} onChange={(e) => setData((p) => ({ ...p, segmento: e.target.value } as any))} placeholder="Ex: Têxtil" /></div>}
          </div>
          <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Endereço</Label><Input value={data.endereco} onChange={(e) => setData((p) => ({ ...p, endereco: e.target.value }))} placeholder="Rua, número, bairro" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cidade</Label><Input value={data.cidade} onChange={(e) => setData((p) => ({ ...p, cidade: e.target.value }))} placeholder="São Paulo" /></div>
            <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">UF</Label><Input value={data.uf} onChange={(e) => setData((p) => ({ ...p, uf: e.target.value.toUpperCase() }))} placeholder="SP" maxLength={2} /></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" size="sm" onClick={onCancel}>Cancelar</Button>
          <Button type="button" size="sm" onClick={handleSave} disabled={saving || !data.nome.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
            {saving ? "Criando..." : `Criar ${TIPO_LABELS[tipo]}`}
          </Button>
        </div>
      </div>
    </div>
  )
}

function NovaRequisicaoCortePageContent() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const info = getInfoContent(pathname)
  const [submitting, setSubmitting] = useState(false)
  const [itens, setItens] = useState<ItemLinha[]>([itemVazio()])
  const [observacoes, setObservacoes] = useState("")
  const [entreguePor, setEntreguePor] = useState("")
  const [dataSolicitacao, setDataSolicitacao] = useState("")
  const [dataEntrega, setDataEntrega] = useState("")
  const [clienteIdGlobal, setClienteIdGlobal] = useState<number | null>(null)
  const [clienteNomeGlobal, setClienteNomeGlobal] = useState<string | null>(null)
  const [fornecedorIdGlobal, setFornecedorIdGlobal] = useState<number | null>(null)
  const [fornecedorNomeGlobal, setFornecedorNomeGlobal] = useState<string | null>(null)
  const [representanteIdGlobal, setRepresentanteIdGlobal] = useState<number | null>(null)
  const [representanteNomeGlobal, setRepresentanteNomeGlobal] = useState<string | null>(null)

  const [dialogCopiarAberto, setDialogCopiarAberto] = useState(false)
  const [qtdCopias, setQtdCopias] = useState("1")
  const emptyCliente = { nome: "", cnpj: "", razaoSocial: "", email: "", emailNf: "", telefone: "", celular: "", contato: "", segmento: "", endereco: "", cidade: "", uf: "" }
  const emptyFornecedor = { nome: "", cnpj: "", razaoSocial: "", email: "", telefone: "", contato: "", endereco: "", cidade: "", uf: "" }
  const emptyRepresentante = { nome: "", cnpj: "", razaoSocial: "", email: "", telefone: "", contato: "", endereco: "", cidade: "", uf: "" }

  const [showNovoCliente, setShowNovoCliente] = useState(false)
  const [novoClienteData, setNovoClienteData] = useState(emptyCliente)
  const [isCriandoCliente, setIsCriandoCliente] = useState(false)

  const [showNovoFornecedor, setShowNovoFornecedor] = useState(false)
  const [novoFornecedorData, setNovoFornecedorData] = useState(emptyFornecedor)
  const [isCriandoFornecedor, setIsCriandoFornecedor] = useState(false)

  const [showNovoRepresentante, setShowNovoRepresentante] = useState(false)
  const [novoRepresentanteData, setNovoRepresentanteData] = useState(emptyRepresentante)
  const [isCriandoRepresentante, setIsCriandoRepresentante] = useState(false)

  const [isConsultandoCnpj, setIsConsultandoCnpj] = useState(false)

  const [itemNovoTipo, setItemNovoTipo] = useState<DestinoTipo | null>(null)
  const [itemNovoIdx, setItemNovoIdx] = useState<number | null>(null)

  useEffect(() => {
    try {
      const raw = searchParams.get("copiar")
      if (!raw) return
      const dados = JSON.parse(raw)
      if (Array.isArray(dados.itens) && dados.itens.length > 0) {
        setItens(dados.itens.map((item: any) => ({
          id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
          codigoProduto: item.codigoProduto || "",
          ordem: item.ordem || "",
          artigo: item.artigo || "",
          cor: item.cor || "",
          desenho: item.desenho || "",
          quantidade: item.quantidade || "",
          clienteId: item.clienteId || null,
          clienteNome: item.clienteNome || null,
          fornecedorId: item.fornecedorId || null,
          fornecedorNome: item.fornecedorNome || null,
          representanteId: item.representanteId || null,
          representanteNome: item.representanteNome || null,
        })))
        if (dados.observacoes) setObservacoes(dados.observacoes)
        if (dados.entreguePor) setEntreguePor(dados.entreguePor)
        if (dados.dataSolicitacao) setDataSolicitacao(dados.dataSolicitacao)
        if (dados.dataEntrega) setDataEntrega(dados.dataEntrega)
        if (dados.clienteId) setClienteIdGlobal(dados.clienteId)
        if (dados.clienteNome) setClienteNomeGlobal(dados.clienteNome)
        if (dados.fornecedorId) setFornecedorIdGlobal(dados.fornecedorId)
        if (dados.fornecedorNome) setFornecedorNomeGlobal(dados.fornecedorNome)
        if (dados.representanteId) setRepresentanteIdGlobal(dados.representanteId)
        if (dados.representanteNome) setRepresentanteNomeGlobal(dados.representanteNome)
        toast.success(`Requisição copiada — ${dados.itens.length} item(ns) carregado(s)`)
      }
      router.replace(pathname, { scroll: false })
    } catch {}
  }, [searchParams, pathname, router])

  const handleItemChange = (index: number, field: keyof ItemLinha, value: any) => {
    setItens(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const handleItemCreatableChange = (index: number, idField: keyof ItemLinha, nomeField: keyof ItemLinha, id: number | null, nome: string | null) => {
    setItens(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [idField]: id, [nomeField]: nome }
      return next
    })
  }

  const addItem = () => {
    setItens(prev => [...prev, itemVazio()])
  }

  const copiarItemAtual = () => {
    const qtd = parseInt(qtdCopias) || 1
    setItens(prev => {
      const ultimo = prev[prev.length - 1]
      const copias = Array.from({ length: qtd }, () => copiarItem(ultimo))
      return [...prev, ...copias]
    })
    setDialogCopiarAberto(false)
    setQtdCopias("1")
    toast.success(`${qtd} cópia(s) adicionada(s)`)
  }

  const moverItem = (index: number, direcao: -1 | 1) => {
    setItens(prev => {
      const novoIndex = index + direcao
      if (novoIndex < 0 || novoIndex >= prev.length) return prev
      const next = [...prev]
      const temp = next[index]
      next[index] = next[novoIndex]
      next[novoIndex] = temp
      return next
    })
  }

  const removeItem = (index: number) => {
    if (itens.length <= 1) return
    setItens(prev => prev.filter((_: any, i: any) => i !== index))
  }

  const handleDestinoTipoChange = (index: number, novoTipo: DestinoTipo) => {
    setItens(prev => prev.map((item, i) => {
      if (i !== index) return item
      const updated = { ...item, destinoTipo: novoTipo }
      if (novoTipo === "cliente") { updated.fornecedorId = null; updated.fornecedorNome = null; updated.representanteId = null; updated.representanteNome = null }
      else if (novoTipo === "fornecedor") { updated.clienteId = null; updated.clienteNome = null; updated.representanteId = null; updated.representanteNome = null }
      else if (novoTipo === "representante") { updated.clienteId = null; updated.clienteNome = null; updated.fornecedorId = null; updated.fornecedorNome = null }
      return updated
    }))
  }

  const handleItemNovoSucesso = (id: number, nome: string) => {
    if (itemNovoIdx === null || !itemNovoTipo) return
    const idField = itemNovoTipo === "cliente" ? "clienteId" : itemNovoTipo === "fornecedor" ? "fornecedorId" : "representanteId"
    const nomeField = itemNovoTipo === "cliente" ? "clienteNome" : itemNovoTipo === "fornecedor" ? "fornecedorNome" : "representanteNome"
    setItens(prev => prev.map((item, i) => i === itemNovoIdx ? { ...item, destinoTipo: itemNovoTipo, [idField]: id, [nomeField]: nome } : item))
    setItemNovoIdx(null)
    setItemNovoTipo(null)
  }

  const handleOcrItens = (novosItens: any[]) => {
    setItens(prev => [
      ...prev.filter((item: any) => item.quantidade.trim()),
      ...novosItens.map((item: any) => ({
        id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random()),
        codigoProduto: item.codigoProduto || "",
        ordem: item.ordem || "",
        artigo: item.artigo || "",
        cor: item.cor || "",
        desenho: item.desenho || "",
        quantidade: item.quantidade || "",
        destinoTipo: null,
        clienteId: null,
        clienteNome: null,
        fornecedorId: null,
        fornecedorNome: null,
        representanteId: null,
        representanteNome: null,
      })),
    ])
  }

  const handleCriarCliente = async () => {
    if (!novoClienteData.nome.trim()) {
      toast.error("Nome do cliente é obrigatório")
      return
    }
    setIsCriandoCliente(true)
    try {
      const res = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoClienteData),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar cliente")
      }
      const cliente = await res.json()
      setClienteIdGlobal(cliente.id)
      setClienteNomeGlobal(cliente.nome)
      setShowNovoCliente(false)
      setNovoClienteData(emptyCliente)
      toast.success("Cliente criado com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar cliente.")
    } finally {
      setIsCriandoCliente(false)
    }
  }

  const handleConsultarCnpj = async () => {
    const digits = novoClienteData.cnpj.replace(/\D/g, "")
    if (digits.length !== 14) {
      toast.error("CNPJ deve ter 14 dígitos")
      return
    }
    setIsConsultandoCnpj(true)
    try {
      const res = await fetch(`/api/crm/consulta-cnpj?cnpj=${digits}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro na consulta")
      }
      const result = await res.json()
      const api = result.apiData
      if (!api) {
        toast.error("CNPJ não encontrado na Receita Federal")
        return
      }
      setNovoClienteData((prev) => ({
        ...prev,
        nome: api.nome_fantasia || prev.nome,
        cnpj: api.cnpj || prev.cnpj,
        razaoSocial: api.razao_social || prev.razaoSocial,
        endereco: [api.logradouro, api.numero, api.bairro].filter(Boolean).join(", ") || prev.endereco,
        cidade: api.municipio || prev.cidade,
        uf: api.uf || prev.uf,
        segmento: api.cnae_principal_descricao || prev.segmento,
      }))
      toast.success("Dados preenchidos pela Receita Federal")
    } catch (err: any) {
      toast.error(err.message || "Erro ao consultar CNPJ")
    } finally {
      setIsConsultandoCnpj(false)
    }
  }

  const handleCriarFornecedor = async () => {
    if (!novoFornecedorData.nome.trim()) {
      toast.error("Nome do fornecedor é obrigatório")
      return
    }
    setIsCriandoFornecedor(true)
    try {
      const res = await fetch("/api/cadastros/fornecedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoFornecedorData),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar fornecedor")
      }
      const f = await res.json()
      setFornecedorIdGlobal(f.id)
      setFornecedorNomeGlobal(f.nome)
      setShowNovoFornecedor(false)
      setNovoFornecedorData(emptyFornecedor)
      toast.success("Fornecedor criado com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar fornecedor.")
    } finally {
      setIsCriandoFornecedor(false)
    }
  }

  const handleConsultarCnpjFornecedor = async () => {
    const digits = novoFornecedorData.cnpj.replace(/\D/g, "")
    if (digits.length !== 14) { toast.error("CNPJ deve ter 14 dígitos"); return }
    setIsConsultandoCnpj(true)
    try {
      const res = await fetch(`/api/crm/consulta-cnpj?cnpj=${digits}`)
      if (!res.ok) throw new Error((await res.json()).error || "Erro na consulta")
      const result = await res.json()
      const api = result.apiData
      if (!api) { toast.error("CNPJ não encontrado na Receita Federal"); return }
      setNovoFornecedorData((prev) => ({
        ...prev,
        nome: api.nome_fantasia || prev.nome,
        cnpj: api.cnpj || prev.cnpj,
        razaoSocial: api.razao_social || prev.razaoSocial,
        endereco: [api.logradouro, api.numero, api.bairro].filter(Boolean).join(", ") || prev.endereco,
        cidade: api.municipio || prev.cidade,
        uf: api.uf || prev.uf,
      }))
      toast.success("Dados preenchidos pela Receita Federal")
    } catch (err: any) { toast.error(err.message || "Erro ao consultar CNPJ") }
    finally { setIsConsultandoCnpj(false) }
  }

  const handleCriarRepresentante = async () => {
    if (!novoRepresentanteData.nome.trim()) { toast.error("Nome do representante é obrigatório"); return }
    if (!novoRepresentanteData.cnpj.trim()) { toast.error("CNPJ do representante é obrigatório"); return }
    setIsCriandoRepresentante(true)
    try {
      const res = await fetch("/api/representantes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoRepresentanteData),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar representante")
      }
      const r = await res.json()
      setRepresentanteIdGlobal(r.id)
      setRepresentanteNomeGlobal(r.nome)
      setShowNovoRepresentante(false)
      setNovoRepresentanteData(emptyRepresentante)
      toast.success("Representante criado com sucesso!")
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar representante.")
    } finally {
      setIsCriandoRepresentante(false)
    }
  }

  const handleConsultarCnpjRepresentante = async () => {
    const digits = novoRepresentanteData.cnpj.replace(/\D/g, "")
    if (digits.length !== 14) { toast.error("CNPJ deve ter 14 dígitos"); return }
    setIsConsultandoCnpj(true)
    try {
      const res = await fetch(`/api/crm/consulta-cnpj?cnpj=${digits}`)
      if (!res.ok) throw new Error((await res.json()).error || "Erro na consulta")
      const result = await res.json()
      const api = result.apiData
      if (!api) { toast.error("CNPJ não encontrado na Receita Federal"); return }
      setNovoRepresentanteData((prev) => ({
        ...prev,
        nome: api.nome_fantasia || prev.nome,
        cnpj: api.cnpj || prev.cnpj,
        razaoSocial: api.razao_social || prev.razaoSocial,
        endereco: [api.logradouro, api.numero, api.bairro].filter(Boolean).join(", ") || prev.endereco,
        cidade: api.municipio || prev.cidade,
        uf: api.uf || prev.uf,
      }))
      toast.success("Dados preenchidos pela Receita Federal")
    } catch (err: any) { toast.error(err.message || "Erro ao consultar CNPJ") }
    finally { setIsConsultandoCnpj(false) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const itensValidos = itens.filter((item: any) => item.quantidade.trim())
    if (itensValidos.length === 0) {
      toast.error("Adicione pelo menos um item com quantidade")
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/comercial/requisicoes-corte", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itens: itensValidos,
          observacoes,
          entreguePor,
          dataSolicitacao,
          dataEntrega,
          clienteId: clienteIdGlobal,
          clienteNome: clienteNomeGlobal,
          fornecedorId: fornecedorIdGlobal,
          fornecedorNome: fornecedorNomeGlobal,
          representanteId: representanteIdGlobal,
          representanteNome: representanteNomeGlobal,
        }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Erro ao criar requisição")
      }
      toast.success("Requisição criada com sucesso")
      router.push("/comercial/requisicoes-corte")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar requisição")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-7xl mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Nova Requisição de Corte{info && <InfoButton content={info} />}
          </h1>
          <p className="text-sm text-slate-500 mt-1">Preencha os dados da requisição de corte</p>
        </div>
        <Link
          href="/comercial/requisicoes-corte"
          className="group/button inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent bg-clip-padding text-sm font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 border-border bg-background hover:bg-muted hover:text-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50 h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2"
        >
          Cancelar
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Itens de Corte</h2>

          <div className="min-h-[350px]">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="px-3 py-2 w-8"></th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase min-w-[200px]">Cód. Produto</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Ordem</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Artigo</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Cor</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Desenho</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Qtd <span className="text-red-500">*</span></th>
                  <th className="px-2 py-2 text-left text-xs font-medium text-slate-500 uppercase min-w-[220px]">Destino</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {itens.map((item: any, index: any) => (
                  <tr key={item.id}>
                    <td className="px-3 py-2">
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          onClick={() => moverItem(index, -1)}
                          disabled={index === 0}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed p-0"
                          title="Mover para cima"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moverItem(index, 1)}
                          disabled={index === itens.length - 1}
                          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed p-0"
                          title="Mover para baixo"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <SuggestionInput
                        value={item.codigoProduto}
                        onChange={(v) => handleItemChange(index, "codigoProduto", v)}
                        campo="codigoProduto"
                        placeholder="2.K2620..."
                        className="w-48"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <SuggestionInput
                        value={item.ordem}
                        onChange={(v) => handleItemChange(index, "ordem", v)}
                        campo="ordem"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <SuggestionInput
                        value={item.artigo}
                        onChange={(v) => handleItemChange(index, "artigo", v)}
                        campo="artigo"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <SuggestionInput
                        value={item.cor}
                        onChange={(v) => handleItemChange(index, "cor", v)}
                        campo="cor"
                        placeholder="Palha"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <SuggestionInput
                        value={item.desenho}
                        onChange={(v) => handleItemChange(index, "desenho", v)}
                        campo="desenho"
                        placeholder="500101"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <Input
                        value={item.quantidade}
                        onChange={(e) => handleItemChange(index, "quantidade", e.target.value)}
                        placeholder="2 M"
                        className="h-9 text-sm"
                      />
                    </td>
                    <td className="px-2 py-2">
                      <div className="flex items-center gap-1">
                        <select
                          value={item.destinoTipo || ""}
                          onChange={(e) => handleDestinoTipoChange(index, e.target.value as DestinoTipo)}
                          className="h-9 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-1.5 py-1 text-slate-700 dark:text-slate-300 w-20 shrink-0"
                        >
                          <option value="">Tipo</option>
                          <option value="cliente">Cliente</option>
                          <option value="fornecedor">Fornec.</option>
                          <option value="representante">Repr.</option>
                        </select>
                        {item.destinoTipo && (
                          <>
                            <CreatableSelect
                              valueId={item.destinoTipo === "cliente" ? item.clienteId : item.destinoTipo === "fornecedor" ? item.fornecedorId : item.representanteId}
                              valueNome={item.destinoTipo === "cliente" ? item.clienteNome : item.destinoTipo === "fornecedor" ? item.fornecedorNome : item.representanteNome}
                              onChange={(id, nome) => {
                                const idField = item.destinoTipo === "cliente" ? "clienteId" : item.destinoTipo === "fornecedor" ? "fornecedorId" : "representanteId"
                                const nomeField = item.destinoTipo === "cliente" ? "clienteNome" : item.destinoTipo === "fornecedor" ? "fornecedorNome" : "representanteNome"
                                handleItemCreatableChange(index, idField, nomeField, id, nome)
                              }}
                              fetchUrl={item.destinoTipo === "cliente" ? "/api/clientes" : item.destinoTipo === "fornecedor" ? "/api/cadastros/fornecedores" : "/api/representantes"}
                              placeholder="Buscar..."
                              className="text-xs flex-1 min-w-0"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 shrink-0"
                              onClick={() => { setItemNovoTipo(item.destinoTipo); setItemNovoIdx(index) }}
                              title={`Novo ${item.destinoTipo}`}
                            >
                              <UserPlus size={11} />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      {itens.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-500 hover:text-red-700 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-2">
            <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
              <Plus size={14} />
              Adicionar Item
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setQtdCopias("1")
                setDialogCopiarAberto(true)
              }}
              className="gap-1"
            >
              <Copy size={14} />
              Copiar Item
            </Button>
            <OcrInput onItensImportados={handleOcrItens} />
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Informações Adicionais</h2>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Digite aqui mais informações"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="entreguePor">Entregue por</Label>
            <Input
              id="entreguePor"
              value={entreguePor}
              onChange={(e) => setEntreguePor(e.target.value)}
              placeholder="Vilma"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataSolicitacao">Data de Solicitação</Label>
              <Input
                id="dataSolicitacao"
                type="date"
                value={dataSolicitacao}
                onChange={(e) => setDataSolicitacao(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataEntrega">Data de Entrega</Label>
              <Input
                id="dataEntrega"
                type="date"
                value={dataEntrega}
                onChange={(e) => setDataEntrega(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Cliente (geral)</Label>
              <div className="flex gap-2">
                <CreatableSelect
                  valueId={clienteIdGlobal}
                  valueNome={clienteNomeGlobal}
                  onChange={(id, nome) => { setClienteIdGlobal(id); setClienteNomeGlobal(nome) }}
                  fetchUrl="/api/clientes"
                  placeholder="Nenhum"
                  extraField="cnpj"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNovoCliente(true)}
                  className="h-9 px-2 shrink-0"
                  title="Cadastrar novo cliente"
                >
                  <UserPlus size={14} />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Fornecedor (geral)</Label>
              <div className="flex gap-2">
                <CreatableSelect
                  valueId={fornecedorIdGlobal}
                  valueNome={fornecedorNomeGlobal}
                  onChange={(id, nome) => { setFornecedorIdGlobal(id); setFornecedorNomeGlobal(nome) }}
                  fetchUrl="/api/cadastros/fornecedores"
                  placeholder="Nenhum"
                  extraField="cnpj"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNovoFornecedor(true)} className="h-9 px-2 shrink-0" title="Cadastrar novo fornecedor">
                  <UserPlus size={14} />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Representante (geral)</Label>
              <div className="flex gap-2">
                <CreatableSelect
                  valueId={representanteIdGlobal}
                  valueNome={representanteNomeGlobal}
                  onChange={(id, nome) => { setRepresentanteIdGlobal(id); setRepresentanteNomeGlobal(nome) }}
                  fetchUrl="/api/representantes"
                  placeholder="Nenhum"
                  extraField="cnpj"
                  className="flex-1"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => setShowNovoRepresentante(true)} className="h-9 px-2 shrink-0" title="Cadastrar novo representante">
                  <UserPlus size={14} />
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={submitting} className="bg-blue-600 hover:bg-blue-700 text-white">
            {submitting ? "Salvando..." : "Salvar Requisição"}
          </Button>
        </div>
      </form>

      {dialogCopiarAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl p-6 w-80 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Copiar último item</h3>
            <p className="text-sm text-slate-500">
              Quantas cópias do último item deseja adicionar?
            </p>
            <Input
              type="number"
              min="1"
              max="50"
              value={qtdCopias}
              onChange={(e) => setQtdCopias(e.target.value)}
              className="h-9 text-sm"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  copiarItemAtual()
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogCopiarAberto(false)}
              >
                Cancelar
              </Button>
              <Button type="button" size="sm" onClick={copiarItemAtual} className="bg-blue-600 hover:bg-blue-700 text-white">
                Copiar
              </Button>
            </div>
          </div>
        </div>
      )}

      {showNovoCliente && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Novo Cliente</h3>
            <p className="text-sm text-slate-500">Digite o CNPJ e clique em Consultar para preencher automaticamente.</p>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  CNPJ <span className="text-red-500">*</span>
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={novoClienteData.cnpj}
                    onChange={(e) => setNovoClienteData((prev) => ({ ...prev, cnpj: e.target.value }))}
                    placeholder="00.000.000/0001-00"
                    className="font-mono flex-1"
                    maxLength={18}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleConsultarCnpj}
                    disabled={isConsultandoCnpj || novoClienteData.cnpj.replace(/\D/g, "").length !== 14}
                    className="gap-1 shrink-0"
                  >
                    {isConsultandoCnpj ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                    Consultar
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Nome / Fantasia <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={novoClienteData.nome}
                  onChange={(e) => setNovoClienteData((prev) => ({ ...prev, nome: e.target.value }))}
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Razão Social</Label>
                <Input
                  value={novoClienteData.razaoSocial}
                  onChange={(e) => setNovoClienteData((prev) => ({ ...prev, razaoSocial: e.target.value }))}
                  placeholder="Razão Social completa"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label>
                  <Input type="email" value={novoClienteData.email} onChange={(e) => setNovoClienteData((prev) => ({ ...prev, email: e.target.value }))} placeholder="contato@email.com" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email NF</Label>
                  <Input type="email" value={novoClienteData.emailNf} onChange={(e) => setNovoClienteData((prev) => ({ ...prev, emailNf: e.target.value }))} placeholder="nf@email.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</Label>
                  <Input value={novoClienteData.telefone} onChange={(e) => setNovoClienteData((prev) => ({ ...prev, telefone: e.target.value }))} placeholder="(11) 3333-4444" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Celular</Label>
                  <Input value={novoClienteData.celular} onChange={(e) => setNovoClienteData((prev) => ({ ...prev, celular: e.target.value }))} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contato</Label>
                  <Input value={novoClienteData.contato} onChange={(e) => setNovoClienteData((prev) => ({ ...prev, contato: e.target.value }))} placeholder="Nome do contato" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Segmento</Label>
                  <Input value={novoClienteData.segmento} onChange={(e) => setNovoClienteData((prev) => ({ ...prev, segmento: e.target.value }))} placeholder="Ex: Têxtil" />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Endereço</Label>
                <Input value={novoClienteData.endereco} onChange={(e) => setNovoClienteData((prev) => ({ ...prev, endereco: e.target.value }))} placeholder="Rua, número, bairro" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cidade</Label>
                  <Input value={novoClienteData.cidade} onChange={(e) => setNovoClienteData((prev) => ({ ...prev, cidade: e.target.value }))} placeholder="São Paulo" />
                </div>
                <div>
                  <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">UF</Label>
                  <Input value={novoClienteData.uf} onChange={(e) => setNovoClienteData((prev) => ({ ...prev, uf: e.target.value.toUpperCase() }))} placeholder="SP" maxLength={2} />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => { setShowNovoCliente(false); setNovoClienteData({ nome: "", cnpj: "", razaoSocial: "", email: "", emailNf: "", telefone: "", celular: "", contato: "", segmento: "", endereco: "", cidade: "", uf: "" }) }}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleCriarCliente}
                disabled={isCriandoCliente || !novoClienteData.nome.trim() || !novoClienteData.cnpj.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isCriandoCliente ? "Criando..." : "Criar Cliente"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showNovoFornecedor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Novo Fornecedor</h3>
            <p className="text-sm text-slate-500">Digite o CNPJ e clique em Consultar para preencher automaticamente.</p>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">CNPJ</Label>
                <div className="flex gap-2">
                  <Input value={novoFornecedorData.cnpj} onChange={(e) => setNovoFornecedorData((p) => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" className="font-mono flex-1" maxLength={18} />
                  <Button type="button" variant="outline" size="sm" onClick={handleConsultarCnpjFornecedor} disabled={isConsultandoCnpj || novoFornecedorData.cnpj.replace(/\D/g, "").length !== 14} className="gap-1 shrink-0">
                    {isConsultandoCnpj ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Consultar
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome <span className="text-red-500">*</span></Label>
                <Input value={novoFornecedorData.nome} onChange={(e) => setNovoFornecedorData((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome do fornecedor" />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Razão Social</Label>
                <Input value={novoFornecedorData.razaoSocial} onChange={(e) => setNovoFornecedorData((p) => ({ ...p, razaoSocial: e.target.value }))} placeholder="Razão Social" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label><Input type="email" value={novoFornecedorData.email} onChange={(e) => setNovoFornecedorData((p) => ({ ...p, email: e.target.value }))} placeholder="contato@email.com" /></div>
                <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</Label><Input value={novoFornecedorData.telefone} onChange={(e) => setNovoFornecedorData((p) => ({ ...p, telefone: e.target.value }))} placeholder="(11) 3333-4444" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contato</Label><Input value={novoFornecedorData.contato} onChange={(e) => setNovoFornecedorData((p) => ({ ...p, contato: e.target.value }))} placeholder="Nome do contato" /></div>
              </div>
              <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Endereço</Label><Input value={novoFornecedorData.endereco} onChange={(e) => setNovoFornecedorData((p) => ({ ...p, endereco: e.target.value }))} placeholder="Rua, número, bairro" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cidade</Label><Input value={novoFornecedorData.cidade} onChange={(e) => setNovoFornecedorData((p) => ({ ...p, cidade: e.target.value }))} placeholder="São Paulo" /></div>
                <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">UF</Label><Input value={novoFornecedorData.uf} onChange={(e) => setNovoFornecedorData((p) => ({ ...p, uf: e.target.value.toUpperCase() }))} placeholder="SP" maxLength={2} /></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => { setShowNovoFornecedor(false); setNovoFornecedorData(emptyFornecedor) }}>Cancelar</Button>
              <Button type="button" size="sm" onClick={handleCriarFornecedor} disabled={isCriandoFornecedor || !novoFornecedorData.nome.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isCriandoFornecedor ? "Criando..." : "Criar Fornecedor"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showNovoRepresentante && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-900 rounded-lg shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Novo Representante</h3>
            <p className="text-sm text-slate-500">Digite o CNPJ e clique em Consultar para preencher automaticamente.</p>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">CNPJ <span className="text-red-500">*</span></Label>
                <div className="flex gap-2">
                  <Input value={novoRepresentanteData.cnpj} onChange={(e) => setNovoRepresentanteData((p) => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" className="font-mono flex-1" maxLength={18} />
                  <Button type="button" variant="outline" size="sm" onClick={handleConsultarCnpjRepresentante} disabled={isConsultandoCnpj || novoRepresentanteData.cnpj.replace(/\D/g, "").length !== 14} className="gap-1 shrink-0">
                    {isConsultandoCnpj ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />} Consultar
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome <span className="text-red-500">*</span></Label>
                <Input value={novoRepresentanteData.nome} onChange={(e) => setNovoRepresentanteData((p) => ({ ...p, nome: e.target.value }))} placeholder="Nome do representante" />
              </div>
              <div>
                <Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Razão Social</Label>
                <Input value={novoRepresentanteData.razaoSocial} onChange={(e) => setNovoRepresentanteData((p) => ({ ...p, razaoSocial: e.target.value }))} placeholder="Razão Social" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email</Label><Input type="email" value={novoRepresentanteData.email} onChange={(e) => setNovoRepresentanteData((p) => ({ ...p, email: e.target.value }))} placeholder="contato@email.com" /></div>
                <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Telefone</Label><Input value={novoRepresentanteData.telefone} onChange={(e) => setNovoRepresentanteData((p) => ({ ...p, telefone: e.target.value }))} placeholder="(11) 3333-4444" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Contato</Label><Input value={novoRepresentanteData.contato} onChange={(e) => setNovoRepresentanteData((p) => ({ ...p, contato: e.target.value }))} placeholder="Nome do contato" /></div>
              </div>
              <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Endereço</Label><Input value={novoRepresentanteData.endereco} onChange={(e) => setNovoRepresentanteData((p) => ({ ...p, endereco: e.target.value }))} placeholder="Rua, número, bairro" /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2"><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">Cidade</Label><Input value={novoRepresentanteData.cidade} onChange={(e) => setNovoRepresentanteData((p) => ({ ...p, cidade: e.target.value }))} placeholder="São Paulo" /></div>
                <div><Label className="text-sm font-medium text-slate-700 dark:text-slate-300">UF</Label><Input value={novoRepresentanteData.uf} onChange={(e) => setNovoRepresentanteData((p) => ({ ...p, uf: e.target.value.toUpperCase() }))} placeholder="SP" maxLength={2} /></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => { setShowNovoRepresentante(false); setNovoRepresentanteData(emptyRepresentante) }}>Cancelar</Button>
              <Button type="button" size="sm" onClick={handleCriarRepresentante} disabled={isCriandoRepresentante || !novoRepresentanteData.nome.trim() || !novoRepresentanteData.cnpj.trim()} className="bg-blue-600 hover:bg-blue-700 text-white">
                {isCriandoRepresentante ? "Criando..." : "Criar Representante"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {itemNovoTipo && itemNovoIdx !== null && (
        <ItemNovoModal
          tipo={itemNovoTipo}
          isConsultandoCnpj={isConsultandoCnpj}
          onConsultarCnpj={itemNovoTipo === "cliente" ? handleConsultarCnpj : itemNovoTipo === "fornecedor" ? handleConsultarCnpjFornecedor : handleConsultarCnpjRepresentante}
          onSuccess={handleItemNovoSucesso}
          onCancel={() => { setItemNovoTipo(null); setItemNovoIdx(null) }}
        />
      )}
    </div>
  )
}

export default function NovaRequisicaoCortePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <NovaRequisicaoCortePageContent />
    </Suspense>
  )
}
