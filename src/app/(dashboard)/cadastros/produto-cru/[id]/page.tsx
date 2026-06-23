"use client"

import { useState, useEffect, type MouseEvent } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { ArrowLeft, Plus, Trash2, Loader2, ChevronDown, ChevronRight, FlaskConical, FileText } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { ReceitaDialog } from "@/components/receita/acabamento-receita-dialog"
import { LinksEditor } from "@/components/links/LinksEditor"
import { EntityChatButton } from "@/components/chat/entity-chat-button"
import { gerarSolicitacaoAmostraPdf } from "@/lib/gerar-solicitacao-amostra-pdf"

type FichaTecnica = {
  gramatura?: string
  gramaturaLinear?: string
  largura?: string
  passamento?: string
  batidas?: string
  densidade?: string
  ligamento?: string
  qtdeFiosUrdume?: string
  observacoes?: string
}

type ProdutoCru = {
  id: number
  codigoPdm: string
  descricao: string
  solicitacaoDesenvolvimentoId?: number | null
  status: string
  fichaTecnica?: FichaTecnica | null
  links?: { url: string; descricao: string }[]
  ativo: boolean
  idIntegracaoErpCru?: string | null
  idIntegracao?: string | null
}

interface Composicao {
  id: number
  material: string
  percentual: string
}

interface Estrutura {
  id: number
  tipo: string
  fioId?: number | null
  baseUrdumeId?: number | null
  ordem?: number | null
}

interface Amostra {
  id: number
  descricao?: string
  status: string
  motivoAprovacao?: string
  observacoes?: string
  links?: { url: string; descricao: string }[]
  data: string
  quantidadeProduzida?: string
  idIntegracaoErpCru?: string
}

interface Acabamento {
  id: number
  tipoAcabamento: string
  descricao?: string
  idIntegracaoErpAcabado?: string
  possuiReceita: boolean
  amostras: AcabamentoAmostra[]
}

interface AcabamentoAmostra {
  id: number
  descricao?: string
  status: string
  motivoAprovacao?: string
  observacoes?: string
  links?: { url: string; descricao: string }[]
  data: string
  quantidadeProduzida?: string
}

const STATUS_OPTIONS = [
  { value: "DESENVOLVIMENTO", label: "Em Desenvolvimento" },
  { value: "APROVADO", label: "Aprovado" },
  { value: "EM_PRODUCAO", label: "Em Produção" },
  { value: "OBSOLETO", label: "Obsoleto" },
]

const TIPO_ESTRUTURA = ["TRAMA", "URDUME"]
const STATUS_AMOSTRA = ["PENDENTE", "APROVADO", "REPROVADO"]
const TIPO_ACABAMENTO = ["TINGIMENTO", "ESTAMPARIA", "TERMOFIXACAO", "LAVAGEM", "OUTRO"]

const TABS = [
  { id: "capa", label: "Capa" },
  { id: "ficha-tecnica", label: "Ficha Técnica" },
  { id: "composicao", label: "Composição/Estrutura" },
  { id: "amostras", label: "Amostras" },
  { id: "links", label: "Links" },
]

export default function ProdutoCruFormPage() {
  const router = useRouter()
  const params = useParams()
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [activeTab, setActiveTab] = useState("capa")

  const [produto, setProduto] = useState<ProdutoCru>({
    id: 0,
    codigoPdm: "",
    descricao: "",
    solicitacaoDesenvolvimentoId: null,
    status: "DESENVOLVIMENTO",
    fichaTecnica: null,
    links: [],
    ativo: true,
    idIntegracaoErpCru: "",
    idIntegracao: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [composicao, setComposicao] = useState<Composicao[]>([])
  const [estrutura, setEstrutura] = useState<Estrutura[]>([])
  const [amostras, setAmostras] = useState<Amostra[]>([])
  const [acabamentos, setAcabamentos] = useState<Acabamento[]>([])

  const [novoMaterial, setNovoMaterial] = useState("")
  const [novoPercentual, setNovoPercentual] = useState("")

  const [novaEstruturaTipo, setNovaEstruturaTipo] = useState("TRAMA")
  const [novaEstruturaFioId, setNovaEstruturaFioId] = useState("")
  const [novaEstruturaBaseUrdumeId, setNovaEstruturaBaseUrdumeId] = useState("")
  const [novaEstruturaOrdem, setNovaEstruturaOrdem] = useState("")

  const [novaAmostraDescricao, setNovaAmostraDescricao] = useState("")
  const [novaAmostraObs, setNovaAmostraObs] = useState("")
  const [novaAmostraQtd, setNovaAmostraQtd] = useState("")
  const [novaAmostraErp, setNovaAmostraErp] = useState("")

  const [novoAcabamentoTipo, setNovoAcabamentoTipo] = useState("TINGIMENTO")
  const [novoAcabamentoDescricao, setNovoAcabamentoDescricao] = useState("")
  const [novoAcabamentoErp, setNovoAcabamentoErp] = useState("")

  const [fios, setFios] = useState<{ id: number; codigoFio: string; nome: string; idIntegracao: string | null }[]>([])
  const [basesUrdume, setBasesUrdume] = useState<{ id: number; nome: string; idIntegracao: string | null }[]>([])
  const [statusOptionsProd, setStatusOptionsProd] = useState<{ value: string; label: string }[]>([])
  const [statusOptionsAmostra, setStatusOptionsAmostra] = useState<{ value: string; label: string }[]>([])

  const fioLabel = (f: typeof fios[0]) => [f.codigoFio, f.idIntegracao, f.nome].filter(Boolean).join(" — ")
  const baseLabel = (b: typeof basesUrdume[0]) => [b.idIntegracao, b.nome].filter(Boolean).join(" — ")
  const [solicitacoes, setSolicitacoes] = useState<{ id: number; cliente: string; projeto: string }[]>([])

  const [expandedAcabamento, setExpandedAcabamento] = useState<number | null>(null)
  const [expandedAmostraForm, setExpandedAmostraForm] = useState<number | null>(null)

  const [novaAmostraAcabDescricao, setNovaAmostraAcabDescricao] = useState("")
  const [novaAmostraAcabQtd, setNovaAmostraAcabQtd] = useState("")

  const [amostraLinksAberta, setAmostraLinksAberta] = useState<number | null>(null)
  const [acabAmostraLinksAberta, setAcabAmostraLinksAberta] = useState<string | null>(null)
  const [gerandoPdf, setGerandoPdf] = useState<string | null>(null)

  const [motivoModal, setMotivoModal] = useState<{
    open: boolean
    target: { type: "amostra" | "acabamento"; id: number; acabamentoId?: number }
    novoStatus: string
  }>({ open: false, target: null as any, novoStatus: "" })
  const [motivoText, setMotivoText] = useState("")
  const [receitaDialog, setReceitaDialog] = useState<{ amostraId: number; acabamentoId: number } | null>(null)

  const [editAmostra, setEditAmostra] = useState<Amostra | null>(null)
  const [editAmostraDescricao, setEditAmostraDescricao] = useState("")
  const [editAmostraObs, setEditAmostraObs] = useState("")
  const [editAmostraQtd, setEditAmostraQtd] = useState("")
  const [editAmostraErp, setEditAmostraErp] = useState("")

  useEffect(() => {
    fetch("/api/cadastros/fios")
      .then(res => res.json())
      .then(data => setFios(data))

    fetch("/api/cadastros/bases-urdume")
      .then(res => res.json())
      .then(data => setBasesUrdume(data))

    fetch("/api/solicitacoes")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setSolicitacoes(data)
      })
      .catch(() => {})

    fetch("/api/admin/status?tipo=PRODUTO_CRU")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStatusOptionsProd(data.map((s: any) => ({ value: s.nome, label: s.rotulo || s.nome })))
      })
      .catch(() => {})

    fetch("/api/admin/status?tipo=AMOSTRA")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setStatusOptionsAmostra(data.map((s: any) => ({ value: s.nome, label: s.rotulo || s.nome })))
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isEditing && id) {
      fetch(`/api/cadastros/produto-cru/${id}`)
        .then(res => res.json())
        .then(data => {
          setProduto({
            id: data.id,
            codigoPdm: data.codigoPdm || "",
            descricao: data.descricao || "",
            solicitacaoDesenvolvimentoId: data.solicitacaoDesenvolvimentoId || null,
            status: data.status || "DESENVOLVIMENTO",
            fichaTecnica: data.fichaTecnica || null,
            links: data.links || [],
            ativo: data.ativo ?? true,
            idIntegracaoErpCru: data.idIntegracaoErpCru || "",
            idIntegracao: data.idIntegracao || "",
          })
          setComposicao(data.composicao || [])
          setEstrutura(data.estrutura || [])
          setAmostras(data.amostras || [])
          setAcabamentos(data.acabamentos?.map((a: any) => ({ ...a, receitas: undefined })) || [])
        })
        .catch(err => console.error(err))
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [id, isEditing])

  useEffect(() => {
    if (!loading) {
      const params = new URLSearchParams(window.location.search)
      const tab = params.get("tab")
      const amostraId = params.get("amostraId")
      if (tab) setActiveTab(tab)
      if (tab === "amostras" && amostraId) {
        setTimeout(() => {
          const el = document.getElementById(amostraId)
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
        }, 300)
      }
    }
  }, [loading])

  const handleChange = (field: keyof ProdutoCru, value: string | boolean | number | null) => {
    setProduto(prev => ({ ...prev, [field]: value }))
  }

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === "APROVADO") {
      const temAmostraCruAprovada = amostras.some(a => a.status === "APROVADO")
      if (!temAmostraCruAprovada) {
        toast.error("É necessário pelo menos uma amostra de tecido cru aprovada para aprovar o produto")
        return
      }
    }
    setProduto(prev => ({ ...prev, status: newStatus }))
  }

  const handleFichaTecnicaChange = (field: keyof FichaTecnica, value: string) => {
    setProduto(prev => ({
      ...prev,
      fichaTecnica: { ...(prev.fichaTecnica || {}), [field]: value } as FichaTecnica,
    }))
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!produto.codigoPdm || !produto.descricao) {
      toast.error("Código PDM e Descrição são obrigatórios")
      return
    }

    if (produto.status === "APROVADO") {
      const temAmostraCruAprovada = amostras.some(a => a.status === "APROVADO")
      if (!temAmostraCruAprovada) {
        toast.error("É necessário pelo menos uma amostra de tecido cru aprovada para aprovar o produto")
        return
      }
    }

    setSaving(true)
    try {
      const url = isEditing ? `/api/cadastros/produto-cru/${id}` : "/api/cadastros/produto-cru"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(produto),
      })

      if (res.ok) {
        toast.success(isEditing ? "Produto atualizado!" : "Produto criado!")
        const novo = await res.json()
        if (isEditing) {
          router.push("/cadastros/produto-cru")
        } else {
          router.push(`/cadastros/produto-cru/${novo.id}`)
        }
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erro ao salvar produto")
    } finally {
      setSaving(false)
    }
  }

  const addComposicao = async () => {
    if (!novoMaterial || !novoPercentual || !id) {
      toast.error("Preencha material e percentual")
      return
    }
    try {
      const res = await fetch(`/api/cadastros/produto-cru/${id}/composicao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ material: novoMaterial, percentual: novoPercentual }),
      })
      if (!res.ok) throw new Error()
      const item = await res.json()
      setComposicao([...composicao, item])
      setNovoMaterial("")
      setNovoPercentual("")
      toast.success("Material adicionado")
    } catch {
      toast.error("Erro ao adicionar material")
    }
  }

  const removeComposicao = async (cid: number) => {
    if (!id) return
    try {
      await fetch(`/api/cadastros/produto-cru/${id}/composicao/${cid}`, { method: "DELETE" })
      setComposicao(composicao.filter(c => c.id !== cid))
    } catch {
      toast.error("Erro ao remover material")
    }
  }

  const addEstrutura = async () => {
    if (!id) { toast.error("Salve o produto primeiro"); return }
    try {
      const body: Record<string, unknown> = { tipo: novaEstruturaTipo }
      if (novaEstruturaTipo === "TRAMA") body.fioId = parseInt(novaEstruturaFioId)
      if (novaEstruturaTipo === "URDUME") body.baseUrdumeId = parseInt(novaEstruturaBaseUrdumeId)
      if (novaEstruturaOrdem) body.ordem = parseInt(novaEstruturaOrdem)

      const res = await fetch(`/api/cadastros/produto-cru/${id}/estrutura`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error()
      const item = await res.json()
      setEstrutura([...estrutura, item])
      setNovaEstruturaFioId("")
      setNovaEstruturaBaseUrdumeId("")
      setNovaEstruturaOrdem("")
      toast.success("Estrutura adicionada")
    } catch {
      toast.error("Erro ao adicionar estrutura")
    }
  }

  const removeEstrutura = async (eid: number) => {
    if (!id) return
    try {
      await fetch(`/api/cadastros/produto-cru/${id}/estrutura/${eid}`, { method: "DELETE" })
      setEstrutura(estrutura.filter(e => e.id !== eid))
    } catch {
      toast.error("Erro ao remover estrutura")
    }
  }

  const confirmUpdateStatusAmostraAcabamento = async (acabamentoId: number, asid: number, status: string, motivo?: string) => {
    if (!id) return
    try {
      const res = await fetch(`/api/cadastros/produto-cru/${id}/acabamentos/${acabamentoId}/amostras/${asid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, motivoAprovacao: motivo }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Erro ao atualizar status")
        return
      }
      setAcabamentos(acabamentos.map(a =>
        a.id === acabamentoId
          ? { ...a, amostras: a.amostras.map(as => as.id === asid ? { ...as, status, motivoAprovacao: motivo } : as) }
          : a
      ))
      toast.success("Status atualizado")
    } catch {
      toast.error("Erro ao atualizar status")
    }
  }

  const handleGerarPdfAmostra = async (amostra: { id: number; descricao?: string; status: string; observacoes?: string; data?: string; links?: { url: string; descricao: string }[]; quantidadeProduzida?: string }, tipoAmostra: string) => {
    const key = `${tipoAmostra}-${amostra.id}`
    setGerandoPdf(key)
    try {
      await gerarSolicitacaoAmostraPdf({
        amostra: {
          id: amostra.id,
          tipoAmostra,
          descricao: amostra.descricao,
          status: amostra.status,
          observacoes: amostra.observacoes,
          data: amostra.data,
          links: amostra.links,
          quantidadeProduzida: amostra.quantidadeProduzida,
          produtoCodigo: produto.codigoPdm,
          produtoDescricao: produto.descricao,
        },
        produtoCruId: produto.id,
        solicitacaoDesenvolvimentoId: produto.solicitacaoDesenvolvimentoId,
      })
    } catch {} finally {
      setGerandoPdf(null)
    }
  }

  const totalPercentual = composicao.reduce((sum, c) => sum + parseFloat(c.percentual || "0"), 0)
  const percentualValido = Math.abs(totalPercentual - 100) < 0.01

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    )
  }

  const updateStatusAmostra = async (amostraId: number, novoStatus: string) => {
    const allow = ["APROVADO", "REPROVADO"]
    if (allow.includes(novoStatus)) {
      setMotivoModal({ open: true, target: { type: "amostra", id: amostraId }, novoStatus })
    } else {
      await confirmUpdateStatusAmostra(amostraId, novoStatus)
    }
  }

  const updateStatusAmostraAcabamento = async (acabamentoId: number, asid: number, novoStatus: string) => {
    const allow = ["APROVADO", "REPROVADO"]
    if (allow.includes(novoStatus)) {
      setMotivoModal({ open: true, target: { type: "acabamento", id: asid, acabamentoId }, novoStatus })
    } else {
      await confirmUpdateStatusAmostraAcabamento(acabamentoId, asid, novoStatus)
    }
  }

  const confirmUpdateStatusAmostra = async (amostraId: number, status: string, motivo?: string) => {
    if (!id) return
    try {
      const res = await fetch(`/api/cadastros/produto-cru/${id}/amostras/${amostraId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, motivoAprovacao: motivo || null }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Erro ao atualizar status")
        return
      }
      const atualizado = await res.json()
      setAmostras(amostras.map(a => a.id === amostraId ? atualizado : a))
      toast.success("Status atualizado")
    } catch {
      toast.error("Erro ao atualizar status")
    }
  }

  const saveAmostraLinks = async (amostraId: number, links: { url: string; descricao: string }[]) => {
    if (!id) return
    const anteriores = amostras.find(a => a.id === amostraId)?.links || []
    try {
      const res = await fetch(`/api/cadastros/produto-cru/${id}/amostras/${amostraId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      })
      if (res.ok) {
        setAmostras(amostras.map(a => a.id === amostraId ? { ...a, links } : a))
      } else {
        setAmostras(amostras.map(a => a.id === amostraId ? { ...a, links: anteriores } : a))
        toast.error("Erro ao salvar links")
      }
    } catch {
      setAmostras(amostras.map(a => a.id === amostraId ? { ...a, links: anteriores } : a))
      toast.error("Erro de rede ao salvar links")
    }
  }

  const saveAcabAmostraLinks = async (acabamentoId: number, amostraId: number, links: { url: string; descricao: string }[]) => {
    if (!id) return
    const anteriores = acabamentos
      .find(a => a.id === acabamentoId)
      ?.amostras?.find(as => as.id === amostraId)?.links || []
    try {
      const res = await fetch(`/api/cadastros/produto-cru/${id}/acabamentos/${acabamentoId}/amostras/${amostraId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      })
      if (res.ok) {
        setAcabamentos(acabamentos.map(a =>
          a.id === acabamentoId
            ? { ...a, amostras: a.amostras.map(as => as.id === amostraId ? { ...as, links } : as) }
            : a
        ))
      } else {
        setAcabamentos(acabamentos.map(a =>
          a.id === acabamentoId
            ? { ...a, amostras: a.amostras.map(as => as.id === amostraId ? { ...as, links: anteriores } : as) }
            : a
        ))
        toast.error("Erro ao salvar links")
      }
    } catch {
      setAcabamentos(acabamentos.map(a =>
        a.id === acabamentoId
          ? { ...a, amostras: a.amostras.map(as => as.id === amostraId ? { ...as, links: anteriores } : as) }
          : a
      ))
      toast.error("Erro de rede ao salvar links")
    }
  }

  const addAmostra = async () => {
    if (!id) { toast.error("Salve o produto primeiro"); return }
    try {
      const res = await fetch(`/api/cadastros/produto-cru/${id}/amostras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: novaAmostraDescricao || null, observacoes: novaAmostraObs || null, quantidadeProduzida: novaAmostraQtd || null, idIntegracaoErpCru: novaAmostraErp || null }),
      })
      if (!res.ok) throw new Error()
      const item = await res.json()
      setAmostras([...amostras, item])
      setNovaAmostraDescricao("")
      setNovaAmostraObs("")
      setNovaAmostraQtd("")
      setNovaAmostraErp("")
      toast.success("Amostra adicionada")
    } catch {
      toast.error("Erro ao adicionar amostra")
    }
  }

  const removeAmostra = async (amostraId: number) => {
    if (!id) return
    try {
      await fetch(`/api/cadastros/produto-cru/${id}/amostras/${amostraId}`, { method: "DELETE" })
      setAmostras(amostras.filter(a => a.id !== amostraId))
    } catch {
      toast.error("Erro ao remover amostra")
    }
  }

  const editarAmostraAbrir = (a: Amostra) => {
    setEditAmostra(a)
    setEditAmostraDescricao(a.descricao || "")
    setEditAmostraObs(a.observacoes || "")
    setEditAmostraQtd(a.quantidadeProduzida || "")
    setEditAmostraErp(a.idIntegracaoErpCru || "")
  }

  const saveAmostraEdit = async () => {
    if (!id || !editAmostra) return
    try {
      const res = await fetch(`/api/cadastros/produto-cru/${id}/amostras/${editAmostra.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: editAmostraDescricao || null,
          observacoes: editAmostraObs || null,
          quantidadeProduzida: editAmostraQtd || null,
          idIntegracaoErpCru: editAmostraErp || null,
        }),
      })
      if (!res.ok) throw new Error()
      const atualizado = await res.json()
      setAmostras(amostras.map(a => a.id === editAmostra.id ? atualizado : a))
      setEditAmostra(null)
      toast.success("Amostra atualizada")
    } catch {
      toast.error("Erro ao atualizar amostra")
    }
  }

  const addAcabamento = async () => {
    if (!id) { toast.error("Salve o produto primeiro"); return }
    try {
      const res = await fetch(`/api/cadastros/produto-cru/${id}/acabamentos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoAcabamento: novoAcabamentoTipo,
          descricao: novoAcabamentoDescricao || null,
          idIntegracaoErpAcabado: novoAcabamentoErp || null,
        }),
      })
      if (!res.ok) throw new Error()
      const item = await res.json()
      setAcabamentos([...acabamentos, { ...item, amostras: [], receitas: undefined }])
      setNovoAcabamentoDescricao("")
      setNovoAcabamentoErp("")
      toast.success("Acabamento adicionado")
    } catch {
      toast.error("Erro ao adicionar acabamento")
    }
  }

  const removeAcabamento = async (acabamentoId: number) => {
    if (!id) return
    try {
      await fetch(`/api/cadastros/produto-cru/${id}/acabamentos/${acabamentoId}`, { method: "DELETE" })
      setAcabamentos(acabamentos.filter(a => a.id !== acabamentoId))
    } catch {
      toast.error("Erro ao remover acabamento")
    }
  }

  const addAmostraAcabamento = async (acabamentoId: number) => {
    if (!id) return
    try {
      const res = await fetch(`/api/cadastros/produto-cru/${id}/acabamentos/${acabamentoId}/amostras`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ descricao: novaAmostraAcabDescricao || null, quantidadeProduzida: novaAmostraAcabQtd || null }),
      })
      if (!res.ok) throw new Error()
      const item = await res.json()
      setAcabamentos(acabamentos.map(a =>
        a.id === acabamentoId ? { ...a, amostras: [...a.amostras, item] } : a
      ))
      setNovaAmostraAcabDescricao("")
      setNovaAmostraAcabQtd("")
      setExpandedAmostraForm(null)
      toast.success("Amostra adicionada")
    } catch {
      toast.error("Erro ao adicionar amostra")
    }
  }

  const removeAmostraAcabamento = async (acabamentoId: number, asid: number) => {
    if (!id) return
    try {
      await fetch(`/api/cadastros/produto-cru/${id}/acabamentos/${acabamentoId}/amostras/${asid}`, { method: "DELETE" })
      setAcabamentos(acabamentos.map(a =>
        a.id === acabamentoId ? { ...a, amostras: a.amostras.filter(as => as.id !== asid) } : a
      ))
    } catch {
      toast.error("Erro ao remover amostra")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/cadastros/produto-cru">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Produto Cru" : "Novo Produto Cru"}
            {info && <InfoButton content={info} />}
          </h1>
        </div>
        {isEditing && id && (
          <EntityChatButton
            entidadeTipo="PRODUTO_CRU"
            entidadeId={id}
            titulo={produto.codigoPdm ? `Produto Cru ${produto.codigoPdm} — ${produto.descricao}` : `Produto Cru #${id}`}
          />
        )}
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.id
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {activeTab === "capa" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="codigoPdm">Código PDM *</Label>
                  <Input
                    id="codigoPdm"
                    value={produto.codigoPdm}
                    onChange={e => handleChange("codigoPdm", e.target.value)}
                    placeholder="D28"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={produto.status}
                    onChange={e => handleStatusChange(e.target.value)}
                    className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                  >
                    {statusOptionsProd.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input
                  id="descricao"
                  value={produto.descricao}
                  onChange={e => handleChange("descricao", e.target.value)}
                  placeholder="Tecido Sarja Algodão 30/1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="solicitacao">Solicitação de Desenvolvimento</Label>
                <select
                  id="solicitacao"
                  value={produto.solicitacaoDesenvolvimentoId || ""}
                  onChange={e => handleChange("solicitacaoDesenvolvimentoId", e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                >
                  <option value="">Nenhuma</option>
                  {solicitacoes.map(s => (
                    <option key={s.id} value={s.id}>#{s.id} - {s.cliente}{s.projeto ? ` (${s.projeto})` : ""}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idIntegracaoErpCru">ID Integração ERP (Cru)</Label>
                  <Input id="idIntegracaoErpCru" value={produto.idIntegracaoErpCru || ""} onChange={e => handleChange("idIntegracaoErpCru", e.target.value)} placeholder="2.K1820.CRU.000CRU" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="idIntegracao">ID Integração (Sistema Externo)</Label>
                  <Input id="idIntegracao" value={produto.idIntegracao || ""} onChange={e => handleChange("idIntegracao", e.target.value)} placeholder="Código do sistema externo" />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" id="ativo" checked={produto.ativo} onChange={e => handleChange("ativo", e.target.checked)} className="w-4 h-4" />
                <Label htmlFor="ativo">Ativo</Label>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {isEditing ? "Atualizar" : "Criar"}
              </Button>
              <Link href="/cadastros/produto-cru">
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
            </div>
          </div>
        )}

        {activeTab === "ficha-tecnica" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
              <h2 className="font-semibold text-slate-900 dark:text-slate-50">Ficha Técnica</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Gramatura Linear (g/m)</Label>
                  <Input value={produto.fichaTecnica?.gramaturaLinear || ""} onChange={e => handleFichaTecnicaChange("gramaturaLinear", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Largura (m)</Label>
                  <Input value={produto.fichaTecnica?.largura || ""} onChange={e => handleFichaTecnicaChange("largura", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Gramatura (g/m²)</Label>
                  <Input value={produto.fichaTecnica?.gramatura || ""} onChange={e => handleFichaTecnicaChange("gramatura", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Densidade (fios/cm)</Label>
                  <Input value={produto.fichaTecnica?.densidade || ""} onChange={e => handleFichaTecnicaChange("densidade", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Ligamento</Label>
                  <Input value={produto.fichaTecnica?.ligamento || ""} onChange={e => handleFichaTecnicaChange("ligamento", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Passamento</Label>
                  <Input value={produto.fichaTecnica?.passamento || ""} onChange={e => handleFichaTecnicaChange("passamento", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Batidas</Label>
                  <Input value={produto.fichaTecnica?.batidas || ""} onChange={e => handleFichaTecnicaChange("batidas", e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Qtde Fios Urdume</Label>
                  <Input value={produto.fichaTecnica?.qtdeFiosUrdume || ""} onChange={e => handleFichaTecnicaChange("qtdeFiosUrdume", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Input value={produto.fichaTecnica?.observacoes || ""} onChange={e => handleFichaTecnicaChange("observacoes", e.target.value)} />
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {isEditing ? "Atualizar" : "Salvar"}
              </Button>
              <Link href="/cadastros/produto-cru">
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
            </div>
          </div>
        )}

        {activeTab === "composicao" && (
          <div className="space-y-6">
            {!isEditing ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center text-slate-500">
                Salve o produto primeiro para configurar composição e estrutura.
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
                  <h2 className="text-lg font-semibold">Composição</h2>

                  {composicao.length > 0 && (
                    <div className="space-y-2">
                      {composicao.map(c => (
                        <div key={c.id} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <span>{c.material} — {c.percentual}%</span>
                          <Button variant="ghost" size="icon" onClick={() => removeComposicao(c.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                      <p className={`text-sm ${percentualValido ? "text-green-600" : "text-red-500"}`}>
                        Total: {totalPercentual.toFixed(2)}% {!percentualValido && "(deve ser 100%)"}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <div className="space-y-1 flex-1">
                      <Label>Material</Label>
                      <Input value={novoMaterial} onChange={e => setNovoMaterial(e.target.value)} placeholder="Algodão" />
                    </div>
                    <div className="space-y-1 w-24">
                      <Label>%</Label>
                      <Input value={novoPercentual} onChange={e => setNovoPercentual(e.target.value)} placeholder="63" />
                    </div>
                    <Button onClick={addComposicao} size="sm"><Plus size={16} /></Button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
                  <h2 className="text-lg font-semibold">Estrutura</h2>

                  {estrutura.length > 0 && (
                    <div className="space-y-2">
                      {estrutura.map(e => (
                        <div key={e.id} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                          <span>
                            {e.tipo} — {e.tipo === "TRAMA"
                            ? (fios.find(f => f.id === e.fioId) ? fioLabel(fios.find(f => f.id === e.fioId)!) : `Fio #${e.fioId || "—"}`)
                            : (basesUrdume.find(b => b.id === e.baseUrdumeId) ? baseLabel(basesUrdume.find(b => b.id === e.baseUrdumeId)!) : `Base Urdume #${e.baseUrdumeId || "—"}`)
                          }
                            {e.ordem ? ` (Ordem: ${e.ordem})` : ""}
                          </span>
                          <Button variant="ghost" size="icon" onClick={() => removeEstrutura(e.id)}>
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-end flex-wrap">
                    <div className="space-y-1">
                      <Label>Tipo</Label>
                      <select value={novaEstruturaTipo} onChange={e => setNovaEstruturaTipo(e.target.value)}
                        className="p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                        {TIPO_ESTRUTURA.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    {novaEstruturaTipo === "TRAMA" ? (
                      <div className="space-y-1">
                        <Label>Fio</Label>
                        <select value={novaEstruturaFioId} onChange={e => setNovaEstruturaFioId(e.target.value)}
                          className="p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                          <option value="">Selecione</option>
                          {fios.map(f => <option key={f.id} value={f.id}>{fioLabel(f)}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Label>Base Urdume</Label>
                        <select value={novaEstruturaBaseUrdumeId} onChange={e => setNovaEstruturaBaseUrdumeId(e.target.value)}
                          className="p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                          <option value="">Selecione</option>
                          {basesUrdume.map(b => <option key={b.id} value={b.id}>{baseLabel(b)}</option>)}
                        </select>
                      </div>
                    )}
                    <div className="space-y-1 w-20">
                      <Label>Ordem</Label>
                      <Input value={novaEstruturaOrdem} onChange={e => setNovaEstruturaOrdem(e.target.value)} placeholder="1" />
                    </div>
                    <Button onClick={addEstrutura} size="sm"><Plus size={16} /></Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "amostras" && (
          <div className="space-y-6">
            {!isEditing ? (
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-center text-slate-500">
                Salve o produto primeiro para gerenciar amostras e acabamentos.
              </div>
            ) : (
              <>
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
                  <h2 id="amostras" className="text-lg font-semibold">Amostras (Tecido Cru)</h2>

                      {amostras.length > 0 && (
                    <div className="space-y-2">
                        {amostras.map(a => (
                          <div key={a.id} id={`amostra-${a.id}`}>
                            <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-medium truncate">{a.descricao || "Sem descrição"}</p>
                                  {a.quantidadeProduzida ? (
                                    <span className="text-xs font-medium text-purple-600 bg-purple-100 dark:bg-purple-900/30 px-2 py-0.5 rounded">Qtd: {a.quantidadeProduzida}</span>
                                  ) : (
                                    <span className="text-xs text-slate-400">Qtd: -</span>
                                  )}
                                  {a.idIntegracaoErpCru ? (
                                    <span className="text-xs font-medium text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded">ERP: {a.idIntegracaoErpCru}</span>
                                  ) : (
                                    <span className="text-xs text-slate-400">ERP: -</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                  {a.observacoes && (
                                    <span className="text-slate-400">{a.observacoes}</span>
                                  )}
                                  <select
                                    value={a.status}
                                    onChange={e => updateStatusAmostra(a.id, e.target.value)}
                                    className={`text-xs rounded-full px-2 py-0.5 border-0 font-medium ml-1 cursor-pointer ${
                                      a.status === "APROVADO" ? "bg-green-100 text-green-700" :
                                      a.status === "REPROVADO" ? "bg-red-100 text-red-700" :
                                      "bg-yellow-100 text-yellow-700"
                                    }`}
                                  >
                                    {statusOptionsAmostra.map(s => (
                                      <option key={s.value} value={s.value} className="bg-white text-slate-900">{s.label}</option>
                                    ))}
                                  </select>
                                  {a.motivoAprovacao && (
                                    <span className="text-slate-400 italic ml-2">Motivo: {a.motivoAprovacao}</span>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button variant="ghost" size="sm" className="text-xs" onClick={() => handleGerarPdfAmostra(a, "TECIDO_CRU")} disabled={gerandoPdf === `TECIDO_CRU-${a.id}`}>
                                  {gerandoPdf === `TECIDO_CRU-${a.id}` ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
                                  Solic. Amostra
                                </Button>
                                <Button variant="ghost" size="sm" className="text-xs" onClick={() => editarAmostraAbrir(a)}>
                                  Editar
                                </Button>
                                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setAmostraLinksAberta(amostraLinksAberta === a.id ? null : a.id)}>
                                  Links {a.links?.length ? `(${a.links.length})` : ""}
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => removeAmostra(a.id)}>
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </div>
                            {amostraLinksAberta === a.id && (
                              <div className="ml-4 mt-1 p-3 bg-white dark:bg-slate-800 rounded-lg border">
                                <LinksEditor
                                  links={a.links || []}
                                  onChange={links => saveAmostraLinks(a.id, links)}
                                />
                              </div>
                            )}
                          </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-end">
                    <div className="space-y-1 flex-1">
                      <Label>Descrição</Label>
                      <Input value={novaAmostraDescricao} onChange={e => setNovaAmostraDescricao(e.target.value)} placeholder="AMOSTRA - PILOTAGEM 001" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <Label>Observações</Label>
                      <Input value={novaAmostraObs} onChange={e => setNovaAmostraObs(e.target.value)} placeholder="Observações" />
                    </div>
                    <div className="space-y-1 w-28">
                      <Label>Qtd Produzida</Label>
                      <Input value={novaAmostraQtd} onChange={e => setNovaAmostraQtd(e.target.value)} placeholder="10 M" />
                    </div>
                    <div className="space-y-1 w-36">
                      <Label>ERP (Cru)</Label>
                      <Input value={novaAmostraErp} onChange={e => setNovaAmostraErp(e.target.value)} placeholder="ERP.00001" />
                    </div>
                    <Button onClick={addAmostra} size="sm"><Plus size={16} /></Button>
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Acabamentos</h2>
                  </div>

                  {acabamentos.length > 0 && (
                    <div className="space-y-3">
                      {acabamentos.map(acab => (
                        <div key={acab.id} className="rounded-xl border border-slate-200 dark:border-slate-800">
                          <div
                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50"
                            onClick={() => setExpandedAcabamento(expandedAcabamento === acab.id ? null : acab.id)}
                          >
                            <div className="flex items-center gap-2">
                              {expandedAcabamento === acab.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <span className="font-medium">{acab.tipoAcabamento}</span>
                              <span className="text-sm text-slate-500">{acab.descricao}</span>
                              {acab.idIntegracaoErpAcabado && (
                                <span className="text-xs text-slate-400">ERP: {acab.idIntegracaoErpAcabado}</span>
                              )}
                            </div>
                            <Button variant="ghost" size="icon" onClick={(e: MouseEvent<HTMLButtonElement>) => { e.stopPropagation(); removeAcabamento(acab.id) }}>
                              <Trash2 size={16} />
                            </Button>
                          </div>

                          {expandedAcabamento === acab.id && (
                            <div className="p-4 border-t space-y-4">
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <h3 className="text-sm font-medium">Amostras</h3>
                                  <Button size="sm" variant="outline" onClick={() => setExpandedAmostraForm(expandedAmostraForm === acab.id ? null : acab.id)}>
                                    <Plus size={14} /> Amostra
                                  </Button>
                                </div>
                                  {acab.amostras.map(as => {
                                  const key = `${acab.id}-${as.id}`
                                  return (
                                  <div key={as.id} id={`amostra-acab-${acab.id}-${as.id}`}>
                                    <div className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded mb-1">
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm">{as.descricao || "Sem descrição"}</span>
                                        {as.quantidadeProduzida && (
                                          <span className="text-xs text-slate-400 ml-2">Qtd: {as.quantidadeProduzida}</span>
                                        )}
                                        {as.motivoAprovacao && (
                                          <p className="text-xs text-slate-400 italic truncate">Motivo: {as.motivoAprovacao}</p>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => handleGerarPdfAmostra(as, "ACABAMENTO")} disabled={gerandoPdf === `ACABAMENTO-${as.id}`}>
                                          {gerandoPdf === `ACABAMENTO-${as.id}` ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
                                        </Button>
                                        <Button variant="ghost" size="sm" className="text-xs h-6" onClick={() => setAcabAmostraLinksAberta(acabAmostraLinksAberta === key ? null : key)}>
                                          Links {as.links?.length ? `(${as.links.length})` : ""}
                                        </Button>
                                        <select
                                          value={as.status}
                                          onChange={e => updateStatusAmostraAcabamento(acab.id, as.id, e.target.value)}
                                          className={`text-xs rounded-full px-2 py-0.5 border-0 font-medium cursor-pointer ${
                                            as.status === "APROVADO" ? "bg-green-100 text-green-700" :
                                            as.status === "REPROVADO" ? "bg-red-100 text-red-700" :
                                            "bg-yellow-100 text-yellow-700"
                                          }`}
                                        >
                                          {statusOptionsAmostra.map(s => (
                                            <option key={s.value} value={s.value} className="bg-white text-slate-900">{s.label}</option>
                                          ))}
                                        </select>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeAmostraAcabamento(acab.id, as.id)}>
                                          <Trash2 size={12} />
                                        </Button>
                                      </div>
                                    </div>
                                    {acabAmostraLinksAberta === key && (
                                      <div className="ml-4 mb-2 p-3 bg-white dark:bg-slate-800 rounded-lg border">
                                        <LinksEditor
                                          links={as.links || []}
                                          onChange={links => saveAcabAmostraLinks(acab.id, as.id, links)}
                                        />
                                      </div>
                                    )}
                                  </div>
                                  )})}
                                {expandedAmostraForm === acab.id && (
                                  <div className="flex gap-2 mt-2">
                                    <Input value={novaAmostraAcabDescricao} onChange={e => setNovaAmostraAcabDescricao(e.target.value)} placeholder="Descrição da amostra" />
                                    <Input value={novaAmostraAcabQtd} onChange={e => setNovaAmostraAcabQtd(e.target.value)} placeholder="Qtd produzida" className="w-32" />
                                    <Button size="sm" onClick={() => addAmostraAcabamento(acab.id)}>Adicionar</Button>
                                  </div>
                                )}
                              </div>

                              <div className="mt-3 border-t pt-3">
                                <h3 className="text-sm font-medium mb-2">Receitas de Beneficiamento</h3>
                                <div className="space-y-1">
                                  {acab.amostras.map(as => (
                                    <div key={as.id} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-800/50 rounded text-sm">
                                      <span className="text-slate-600">
                                        {as.descricao || `Amostra #${as.id}`}
                                        <span className={`ml-2 text-xs font-medium px-1.5 py-0.5 rounded ${
                                          as.status === "APROVADO" ? "bg-green-100 text-green-700" :
                                          as.status === "REPROVADO" ? "bg-red-100 text-red-700" :
                                          "bg-yellow-100 text-yellow-700"
                                        }`}>{as.status}</span>
                                      </span>
                                      <Button size="sm" variant="ghost" onClick={() => setReceitaDialog({ acabamentoId: acab.id, amostraId: as.id })}>
                                        <FlaskConical size={14} className="mr-1" /> Receita
                                      </Button>
                                    </div>
                                  ))}
                                  {acab.amostras.length === 0 && (
                                    <p className="text-xs text-slate-400 italic">Nenhuma amostra ainda</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2 items-end flex-wrap">
                    <div className="space-y-1">
                      <Label>Tipo Acabamento</Label>
                      <select value={novoAcabamentoTipo} onChange={e => setNovoAcabamentoTipo(e.target.value)}
                        className="p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600">
                        {TIPO_ACABAMENTO.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1 flex-1">
                      <Label>Descrição</Label>
                      <Input value={novoAcabamentoDescricao} onChange={e => setNovoAcabamentoDescricao(e.target.value)} placeholder="Tinto Branco" />
                    </div>
                    <div className="space-y-1 flex-1">
                      <Label>ERP (Acabado)</Label>
                      <Input value={novoAcabamentoErp} onChange={e => setNovoAcabamentoErp(e.target.value)} placeholder="2.K1820.TIN.000001" />
                    </div>
                    <Button onClick={addAcabamento} size="sm"><Plus size={16} /> Acabamento</Button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === "links" && (
          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
              <LinksEditor
                links={produto.links || []}
                onChange={links => setProduto(prev => ({ ...prev, links }))}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={saving} className="gap-2">
                {saving && <Loader2 size={16} className="animate-spin" />}
                {isEditing ? "Atualizar" : "Salvar"}
              </Button>
              <Link href="/cadastros/produto-cru">
                <Button variant="outline" type="button">Cancelar</Button>
              </Link>
            </div>
          </div>
        )}
      </form>

      {motivoModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-md mx-4 space-y-4">
            <h3 className="text-lg font-semibold">
              {motivoModal.novoStatus === "APROVADO" ? "Aprovar" : "Reprovar"} Amostra
            </h3>
            <p className="text-sm text-slate-500">
              {motivoModal.novoStatus === "APROVADO"
                ? "Informe o motivo da aprovação"
                : "Informe o motivo da reprovação"}
            </p>
            <textarea
              value={motivoText}
              onChange={e => setMotivoText(e.target.value)}
              className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 min-h-[100px] resize-y"
              placeholder="Motivo / Observação *"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setMotivoModal({ ...motivoModal, open: false })}
              >
                Cancelar
              </Button>
              <Button
                disabled={!motivoText.trim()}
                onClick={async () => {
                  const { target, novoStatus } = motivoModal
                  if (target.type === "amostra") {
                    await confirmUpdateStatusAmostra(target.id, novoStatus, motivoText.trim())
                  } else {
                    await confirmUpdateStatusAmostraAcabamento(target.acabamentoId!, target.id, novoStatus, motivoText.trim())
                  }
                  setMotivoModal({ ...motivoModal, open: false })
                }}
                className={motivoModal.novoStatus === "APROVADO" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
              >
                {motivoModal.novoStatus === "APROVADO" ? "Aprovar" : "Reprovar"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {editAmostra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-full max-w-lg mx-4 space-y-4">
            <h3 className="text-lg font-semibold">Editar Amostra</h3>
            <div className="space-y-3">
              <div>
                <Label>Descrição</Label>
                <Input value={editAmostraDescricao} onChange={e => setEditAmostraDescricao(e.target.value)} placeholder="AMOSTRA - PILOTAGEM 001" />
              </div>
              <div>
                <Label>Observações</Label>
                <Input value={editAmostraObs} onChange={e => setEditAmostraObs(e.target.value)} placeholder="Observações" />
              </div>
              <div>
                <Label>Qtd Produzida</Label>
                <Input value={editAmostraQtd} onChange={e => setEditAmostraQtd(e.target.value)} placeholder="10 M" />
              </div>
              <div>
                <Label>ERP (Cru)</Label>
                <Input value={editAmostraErp} onChange={e => setEditAmostraErp(e.target.value)} placeholder="ERP.00001" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditAmostra(null)}>Cancelar</Button>
              <Button onClick={saveAmostraEdit}>Salvar</Button>
            </div>
          </div>
        </div>
      )}

      {receitaDialog && id && (
        <ReceitaDialog
          produtoCruId={id}
          acabamentoId={receitaDialog.acabamentoId}
          amostraId={receitaDialog.amostraId}
          open={!!receitaDialog}
          onClose={() => setReceitaDialog(null)}
        />
      )}
    </div>
  )
}
