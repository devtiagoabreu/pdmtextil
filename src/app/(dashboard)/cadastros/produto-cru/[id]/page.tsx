"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useParams, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { EntityChatButton } from "@/components/chat/entity-chat-button"
import { gerarSolicitacaoAmostraPdf } from "@/lib/gerar-solicitacao-amostra-pdf"
import { CapaTab } from "./components/capa-tab"
import { FichaTecnicaTab } from "./components/ficha-tecnica-tab"
import { ComposicaoTab } from "./components/composicao-tab"
import { AmostrasTab } from "./components/amostras-tab"
import { LinksTab } from "./components/links-tab"
import { ProdutoCruModais } from "./components/produto-cru-modais"
import type {
  Acabamento,
  AcabamentoAmostra,
  Amostra,
  Composicao,
  DeleteTarget,
  Estrutura,
  FichaTecnica,
  MotivoModalState,
  ProdutoCru,
} from "./components/types"

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

  const [motivoModal, setMotivoModal] = useState<MotivoModalState>({ open: false, target: null as any, novoStatus: "" })
  const [motivoText, setMotivoText] = useState("")
  const [receitaDialog, setReceitaDialog] = useState<{ amostraId: number; acabamentoId: number } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null)

  const [editAmostra, setEditAmostra] = useState<Amostra | null>(null)
  const [editAmostraDescricao, setEditAmostraDescricao] = useState("")
  const [editAmostraObs, setEditAmostraObs] = useState("")
  const [editAmostraQtd, setEditAmostraQtd] = useState("")
  const [editAmostraErp, setEditAmostraErp] = useState("")
  const [editAmostraTear, setEditAmostraTear] = useState("")

  const { data: fiosData } = useQuery<{ id: number; codigoFio: string; nome: string; idIntegracao: string | null }[]>({
    queryKey: ["cadastro-fios"],
    queryFn: async () => {
      const res = await fetch("/api/cadastros/fios")
      return res.json()
    },
  })

  const { data: basesUrdumeData } = useQuery<{ id: number; nome: string; idIntegracao: string | null }[]>({
    queryKey: ["cadastro-bases-urdume"],
    queryFn: async () => {
      const res = await fetch("/api/cadastros/bases-urdume")
      return res.json()
    },
  })

  const { data: solicitacoesData } = useQuery<{ id: number; cliente: string; projeto: string }[]>({
    queryKey: ["solicitacoes"],
    queryFn: async () => {
      const res = await fetch("/api/solicitacoes")
      return res.json()
    },
  })

  const { data: statusProdData } = useQuery<{ nome: string; rotulo?: string }[]>({
    queryKey: ["admin-status", "PRODUTO_CRU"],
    queryFn: async () => {
      const res = await fetch("/api/admin/status?tipo=PRODUTO_CRU")
      return res.json()
    },
  })

  const { data: statusAmostraData } = useQuery<{ nome: string; rotulo?: string }[]>({
    queryKey: ["admin-status", "AMOSTRA"],
    queryFn: async () => {
      const res = await fetch("/api/admin/status?tipo=AMOSTRA")
      return res.json()
    },
  })

  useEffect(() => {
    if (fiosData) setFios(fiosData)
  }, [fiosData])

  useEffect(() => {
    if (basesUrdumeData) setBasesUrdume(basesUrdumeData)
  }, [basesUrdumeData])

  useEffect(() => {
    if (solicitacoesData && Array.isArray(solicitacoesData)) setSolicitacoes(solicitacoesData)
  }, [solicitacoesData])

  useEffect(() => {
    if (Array.isArray(statusProdData)) setStatusOptionsProd(statusProdData.map((s) => ({ value: s.nome, label: s.rotulo || s.nome })))
  }, [statusProdData])

  useEffect(() => {
    if (Array.isArray(statusAmostraData)) setStatusOptionsAmostra(statusAmostraData.map((s) => ({ value: s.nome, label: s.rotulo || s.nome })))
  }, [statusAmostraData])

  const { data: produtoData, isLoading: loading } = useQuery<any>({
    queryKey: ["cadastro-produto-cru", id],
    queryFn: async () => {
      const res = await fetch(`/api/cadastros/produto-cru/${id}`)
      return res.json()
    },
    enabled: !!isEditing && !!id,
  })

  useEffect(() => {
    if (!produtoData) return
    setProduto({
      id: produtoData.id,
      codigoPdm: produtoData.codigoPdm || "",
      descricao: produtoData.descricao || "",
      solicitacaoDesenvolvimentoId: produtoData.solicitacaoDesenvolvimentoId || null,
      status: produtoData.status || "DESENVOLVIMENTO",
      fichaTecnica: produtoData.fichaTecnica || null,
      links: produtoData.links || [],
      ativo: produtoData.ativo ?? true,
      idIntegracaoErpCru: produtoData.idIntegracaoErpCru || "",
      idIntegracao: produtoData.idIntegracao || "",
    })
    setComposicao(produtoData.composicao || [])
    setEstrutura(produtoData.estrutura || [])
    setAmostras(produtoData.amostras || [])
    setAcabamentos(produtoData.acabamentos?.map((a: any) => ({ ...a, receitas: undefined })) || [])
  }, [produtoData])

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
      const temAmostraCruAprovada = amostras.some((a: any) => a.status.startsWith("APROVADA"))
      if (!temAmostraCruAprovada) {
        toast.error("—0 necessário pelo menos uma amostra de tecido cru aprovada para aprovar o produto")
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
      const temAmostraCruAprovada = amostras.some((a: any) => a.status.startsWith("APROVADA"))
      if (!temAmostraCruAprovada) {
        toast.error("—0 necessário pelo menos uma amostra de tecido cru aprovada para aprovar o produto")
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

  const removeItem = async (url: string, successMsg: string) => {
    try {
      const res = await fetch(url, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Erro ao remover")
      }
      toast.success(successMsg)
      return true
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro de rede ao remover")
      return false
    }
  }

  const removeComposicao = async (cid: number) => {
    if (!id) return
    if (await removeItem(`/api/cadastros/produto-cru/${id}/composicao/${cid}`, "Material removido")) {
      setComposicao(composicao.filter((c) => c.id !== cid))
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
    if (await removeItem(`/api/cadastros/produto-cru/${id}/estrutura/${eid}`, "Estrutura removida")) {
      setEstrutura(estrutura.filter((e) => e.id !== eid))
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
      setAcabamentos(acabamentos.map((a) =>
        a.id === acabamentoId
          ? { ...a, amostras: a.amostras.map((as) => as.id === asid ? { ...as, status, motivoAprovacao: motivo } : as) }
          : a
      ))
      toast.success("Status atualizado")
    } catch {
      toast.error("Erro ao atualizar status")
    }
  }

  const handleGerarPdfAmostra = async (amostra: Amostra | AcabamentoAmostra, tipoAmostra: string) => {
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
          dados: amostra.dados,
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
    const allow = ["REPROVADA"]
    if (novoStatus.startsWith("APROVADA") || allow.includes(novoStatus)) {
      setMotivoModal({ open: true, target: { type: "amostra", id: amostraId }, novoStatus })
    } else {
      await confirmUpdateStatusAmostra(amostraId, novoStatus)
    }
  }

  const updateStatusAmostraAcabamento = async (acabamentoId: number, asid: number, novoStatus: string) => {
    const allow = ["REPROVADA"]
    if (novoStatus.startsWith("APROVADA") || allow.includes(novoStatus)) {
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
      setAmostras(amostras.map((a) => a.id === amostraId ? atualizado : a))
      toast.success("Status atualizado")
    } catch {
      toast.error("Erro ao atualizar status")
    }
  }

  const saveAmostraLinks = async (amostraId: number, links: { url: string; descricao: string }[]) => {
    if (!id) return
    const anteriores = amostras.find((a) => a.id === amostraId)?.links || []
    try {
      const res = await fetch(`/api/cadastros/produto-cru/${id}/amostras/${amostraId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      })
      if (res.ok) {
        setAmostras(amostras.map((a) => a.id === amostraId ? { ...a, links } : a))
      } else {
        setAmostras(amostras.map((a) => a.id === amostraId ? { ...a, links: anteriores } : a))
        toast.error("Erro ao salvar links")
      }
    } catch {
      setAmostras(amostras.map((a) => a.id === amostraId ? { ...a, links: anteriores } : a))
      toast.error("Erro de rede ao salvar links")
    }
  }

  const saveAcabAmostraLinks = async (acabamentoId: number, amostraId: number, links: { url: string; descricao: string }[]) => {
    if (!id) return
    const anteriores = acabamentos
      .find((a) => a.id === acabamentoId)
      ?.amostras?.find((as) => as.id === amostraId)?.links || []
    try {
      const res = await fetch(`/api/cadastros/produto-cru/${id}/acabamentos/${acabamentoId}/amostras/${amostraId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links }),
      })
      if (res.ok) {
        setAcabamentos(acabamentos.map((a) =>
          a.id === acabamentoId
            ? { ...a, amostras: a.amostras.map((as) => as.id === amostraId ? { ...as, links } : as) }
            : a
        ))
      } else {
        setAcabamentos(acabamentos.map((a) =>
          a.id === acabamentoId
            ? { ...a, amostras: a.amostras.map((as) => as.id === amostraId ? { ...as, links: anteriores } : as) }
            : a
        ))
        toast.error("Erro ao salvar links")
      }
    } catch {
      setAcabamentos(acabamentos.map((a) =>
        a.id === acabamentoId
          ? { ...a, amostras: a.amostras.map((as) => as.id === amostraId ? { ...as, links: anteriores } : as) }
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
    if (await removeItem(`/api/cadastros/produto-cru/${id}/amostras/${amostraId}`, "Amostra removida")) {
      setAmostras(amostras.filter((a) => a.id !== amostraId))
    }
  }

  const editarAmostraAbrir = (a: Amostra) => {
    setEditAmostra(a)
    setEditAmostraDescricao(a.descricao || "")
    setEditAmostraObs(a.observacoes || "")
    setEditAmostraQtd(a.quantidadeProduzida || "")
    setEditAmostraErp(a.idIntegracaoErpCru || "")
    setEditAmostraTear(a.dados?.tear || "")
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
          dados: { tear: editAmostraTear || "" },
        }),
      })
      if (!res.ok) throw new Error()
      const atualizado = await res.json()
      setAmostras(amostras.map((a) => a.id === editAmostra.id ? atualizado : a))
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
    if (await removeItem(`/api/cadastros/produto-cru/${id}/acabamentos/${acabamentoId}`, "Acabamento removido")) {
      setAcabamentos(acabamentos.filter((a) => a.id !== acabamentoId))
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
      setAcabamentos(acabamentos.map((a) =>
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
    if (await removeItem(`/api/cadastros/produto-cru/${id}/acabamentos/${acabamentoId}/amostras/${asid}`, "Amostra removida")) {
      setAcabamentos(acabamentos.map((a) =>
        a.id === acabamentoId ? { ...a, amostras: a.amostras.filter((as) => as.id !== asid) } : a
      ))
    }
  }

  const confirmarMotivo = async () => {
    const { target, novoStatus } = motivoModal
    if (target.type === "amostra") {
      await confirmUpdateStatusAmostra(target.id, novoStatus, motivoText.trim())
    } else {
      await confirmUpdateStatusAmostraAcabamento(target.acabamentoId!, target.id, novoStatus, motivoText.trim())
    }
    setMotivoModal(m => ({ ...m, open: false }))
  }

  const excluirComposicao = (c: Composicao) => setDeleteTarget({ type: "composicao", label: `material "${c.material}"`, fn: () => removeComposicao(c.id) })
  const excluirEstrutura = (e: Estrutura) => setDeleteTarget({ type: "estrutura", label: "esta estrutura", fn: () => removeEstrutura(e.id) })
  const excluirAmostra = (a: Amostra) => setDeleteTarget({ type: "amostra", label: "esta amostra", fn: () => removeAmostra(a.id) })
  const excluirAcabamento = (a: Acabamento) => setDeleteTarget({ type: "acabamento", label: "este acabamento", fn: () => removeAcabamento(a.id) })
  const excluirAmostraAcabamento = (acabamentoId: number, asid: number) => setDeleteTarget({ type: "amostra-acabamento", label: "esta amostra", fn: () => removeAmostraAcabamento(acabamentoId, asid) })

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
            {isEditing ? "Editar Produto" : "Novo Produto"}
            {info && <InfoButton content={info} />}
          </h1>
        </div>
        {isEditing && id && (
          <EntityChatButton
            entidadeTipo="PRODUTO_CRU"
            entidadeId={id}
            titulo={produto.codigoPdm ? `Produto ${produto.codigoPdm} — ${produto.descricao}` : `Produto #${id}`}
          />
        )}
      </div>

      <div className="flex gap-1 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {TABS.map((tab) => (
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
          <CapaTab
            produto={produto}
            handleChange={handleChange}
            handleStatusChange={handleStatusChange}
            solicitacoes={solicitacoes}
            statusOptionsProd={statusOptionsProd}
            saving={saving}
            isEditing={!!isEditing}
          />
        )}

        {activeTab === "ficha-tecnica" && (
          <FichaTecnicaTab
            produto={produto}
            handleFichaTecnicaChange={handleFichaTecnicaChange}
            saving={saving}
            isEditing={!!isEditing}
          />
        )}

        {activeTab === "composicao" && (
          <ComposicaoTab
            isEditing={!!isEditing}
            composicao={composicao}
            totalPercentual={totalPercentual}
            percentualValido={percentualValido}
            novoMaterial={novoMaterial}
            setNovoMaterial={setNovoMaterial}
            novoPercentual={novoPercentual}
            setNovoPercentual={setNovoPercentual}
            onAddComposicao={addComposicao}
            onExcluirComposicao={excluirComposicao}
            estrutura={estrutura}
            fios={fios}
            fioLabel={fioLabel}
            basesUrdume={basesUrdume}
            baseLabel={baseLabel}
            novaEstruturaTipo={novaEstruturaTipo}
            setNovaEstruturaTipo={setNovaEstruturaTipo}
            novaEstruturaFioId={novaEstruturaFioId}
            setNovaEstruturaFioId={setNovaEstruturaFioId}
            novaEstruturaBaseUrdumeId={novaEstruturaBaseUrdumeId}
            setNovaEstruturaBaseUrdumeId={setNovaEstruturaBaseUrdumeId}
            novaEstruturaOrdem={novaEstruturaOrdem}
            setNovaEstruturaOrdem={setNovaEstruturaOrdem}
            onAddEstrutura={addEstrutura}
            onExcluirEstrutura={excluirEstrutura}
          />
        )}

        {activeTab === "amostras" && (
          <AmostrasTab
            isEditing={!!isEditing}
            amostras={amostras}
            statusOptionsAmostra={statusOptionsAmostra}
            onUpdateStatusAmostra={updateStatusAmostra}
            onGerarPdfAmostra={handleGerarPdfAmostra}
            gerandoPdf={gerandoPdf}
            onEditarAmostra={editarAmostraAbrir}
            amostraLinksAberta={amostraLinksAberta}
            setAmostraLinksAberta={setAmostraLinksAberta}
            onSaveAmostraLinks={saveAmostraLinks}
            onExcluirAmostra={excluirAmostra}
            novaAmostraDescricao={novaAmostraDescricao}
            setNovaAmostraDescricao={setNovaAmostraDescricao}
            novaAmostraObs={novaAmostraObs}
            setNovaAmostraObs={setNovaAmostraObs}
            novaAmostraQtd={novaAmostraQtd}
            setNovaAmostraQtd={setNovaAmostraQtd}
            novaAmostraErp={novaAmostraErp}
            setNovaAmostraErp={setNovaAmostraErp}
            onAddAmostra={addAmostra}
            acabamentos={acabamentos}
            expandedAcabamento={expandedAcabamento}
            setExpandedAcabamento={setExpandedAcabamento}
            expandedAmostraForm={expandedAmostraForm}
            setExpandedAmostraForm={setExpandedAmostraForm}
            onUpdateStatusAmostraAcabamento={updateStatusAmostraAcabamento}
            acabAmostraLinksAberta={acabAmostraLinksAberta}
            setAcabAmostraLinksAberta={setAcabAmostraLinksAberta}
            onSaveAcabAmostraLinks={saveAcabAmostraLinks}
            onExcluirAcabamento={excluirAcabamento}
            onExcluirAmostraAcabamento={excluirAmostraAcabamento}
            novoAcabamentoTipo={novoAcabamentoTipo}
            setNovoAcabamentoTipo={setNovoAcabamentoTipo}
            novoAcabamentoDescricao={novoAcabamentoDescricao}
            setNovoAcabamentoDescricao={setNovoAcabamentoDescricao}
            novoAcabamentoErp={novoAcabamentoErp}
            setNovoAcabamentoErp={setNovoAcabamentoErp}
            onAddAcabamento={addAcabamento}
            novaAmostraAcabDescricao={novaAmostraAcabDescricao}
            setNovaAmostraAcabDescricao={setNovaAmostraAcabDescricao}
            novaAmostraAcabQtd={novaAmostraAcabQtd}
            setNovaAmostraAcabQtd={setNovaAmostraAcabQtd}
            onAddAmostraAcabamento={addAmostraAcabamento}
            onAbrirReceita={(acabamentoId, amostraId) => setReceitaDialog({ acabamentoId, amostraId })}
          />
        )}

        {activeTab === "links" && (
          <LinksTab
            links={produto.links || []}
            onChangeLinks={links => setProduto(prev => ({ ...prev, links }))}
            saving={saving}
            isEditing={!!isEditing}
          />
        )}
      </form>

      <ProdutoCruModais
        motivoModal={motivoModal}
        onFecharMotivo={() => setMotivoModal(m => ({ ...m, open: false }))}
        motivoText={motivoText}
        setMotivoText={setMotivoText}
        onConfirmarMotivo={confirmarMotivo}
        editAmostra={editAmostra}
        editAmostraDescricao={editAmostraDescricao}
        setEditAmostraDescricao={setEditAmostraDescricao}
        editAmostraObs={editAmostraObs}
        setEditAmostraObs={setEditAmostraObs}
        editAmostraQtd={editAmostraQtd}
        setEditAmostraQtd={setEditAmostraQtd}
        editAmostraErp={editAmostraErp}
        setEditAmostraErp={setEditAmostraErp}
        editAmostraTear={editAmostraTear}
        setEditAmostraTear={setEditAmostraTear}
        onFecharEdicao={() => setEditAmostra(null)}
        onSalvarEdicao={saveAmostraEdit}
        receitaDialog={receitaDialog}
        onFecharReceita={() => setReceitaDialog(null)}
        produtoCruId={id}
        deleteTarget={deleteTarget}
        onCancelarExclusao={() => setDeleteTarget(null)}
        onConfirmarExclusao={() => { if (deleteTarget) { deleteTarget.fn(); setDeleteTarget(null) } }}
      />
    </div>
  )
}
