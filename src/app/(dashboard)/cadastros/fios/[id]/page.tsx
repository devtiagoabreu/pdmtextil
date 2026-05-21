"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Plus, Trash2, Loader2, Link as LinkIcon, X } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { toast } from "sonner"

type Fio = {
  id: number
  codigoFio: string
  codigoCompleto: string
  nome: string
  nomeComercial?: string | null
  composicao?: string | null
  titulo?: string | null
  titulagemReal?: string | null
  ncm?: string | null
  torcao?: string | null
  resistencia?: string | null
  alongamento?: string | null
  links?: { url: string; descricao: string }[] | null
  observacoes?: string | null
  ativo: boolean
  idIntegracao?: string | null
}

interface Fornecedor {
  id: number
  nome: string
  cnpj?: string
  ativo?: boolean
}

interface FioFornecedor {
  id: number
  fornecedorId: number
  codigoFornecedor: string
  valorUnitario: string
  observacoes: string
  fornecedorNome: string
  fornecedorCnpj: string
}

interface NovoFornecedor {
  nome: string
  cnpj: string
  razaoSocial: string
  email: string
  telefone: string
  contato: string
  endereco: string
  cidade: string
  uf: string
  ativo: boolean
}

export default function FioFormPage() {
  const params = useParams()
  const router = useRouter()
  const isEditing = params.id && params.id !== "novo"
  const id = isEditing ? parseInt(params.id as string) : null

  const [fio, setFio] = useState<Fio>({
    id: 0,
    codigoFio: "",
    codigoCompleto: "",
    nome: "",
    nomeComercial: "",
    composicao: "",
    titulo: "",
    titulagemReal: "",
    ncm: "",
    torcao: "",
    resistencia: "",
    alongamento: "",
    links: [],
    observacoes: "",
    ativo: true,
    idIntegracao: "",
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [fioFornecedores, setFioFornecedores] = useState<FioFornecedor[]>([])
  const [showFornecedorForm, setShowFornecedorForm] = useState(false)
  const [selectedFornecedor, setSelectedFornecedor] = useState("")
  const [codigoFornecedor, setCodigoFornecedor] = useState("")
  const [valorUnitario, setValorUnitario] = useState("")
  
  // Estados do modal de novo fornecedor
  const [showNovoFornecedorModal, setShowNovoFornecedorModal] = useState(false)
  const [novoFornecedor, setNovoFornecedor] = useState<NovoFornecedor>({
    nome: "",
    cnpj: "",
    razaoSocial: "",
    email: "",
    telefone: "",
    contato: "",
    endereco: "",
    cidade: "",
    uf: "",
    ativo: true,
  })
  const [savingFornecedor, setSavingFornecedor] = useState(false)
  const [novoLink, setNovoLink] = useState({ url: "", descricao: "" })

  const adicionarLink = () => {
    if (!novoLink.url) return
    setFio(prev => ({
      ...prev,
      links: [...(prev.links || []), { url: novoLink.url, descricao: novoLink.descricao }],
    }))
    setNovoLink({ url: "", descricao: "" })
  }

  const removerLink = (idx: number) => {
    setFio(prev => ({
      ...prev,
      links: (prev.links || []).filter((_, i) => i !== idx),
    }))
  }

  useEffect(() => {
    fetch("/api/cadastros/fornecedores")
      .then(res => res.json())
      .then(data => setFornecedores(data))
  }, [])

  useEffect(() => {
    if (isEditing && id) {
      Promise.all([
        fetch(`/api/cadastros/fios/${id}`).then(res => res.json()),
        fetch(`/api/cadastros/fios/${id}/fornecedores`).then(res => res.json())
      ]).then(([fioData, fornecedoresData]) => {
        setFio({
          id: fioData.id,
          codigoFio: fioData.codigoFio || "",
          codigoCompleto: fioData.codigoCompleto || "",
          nome: fioData.nome || "",
          nomeComercial: fioData.nomeComercial || "",
          composicao: fioData.composicao || "",
          titulo: fioData.titulo || "",
          titulagemReal: fioData.titulagemReal || "",
          ncm: fioData.ncm || "",
          torcao: fioData.torcao || "",
          resistencia: fioData.resistencia || "",
          alongamento: fioData.alongamento || "",
          links: fioData.links || [],
          observacoes: fioData.observacoes || "",
          ativo: fioData.ativo ?? true,
          idIntegracao: fioData.idIntegracao || "",
        })
        setFioFornecedores(fornecedoresData)
        setLoading(false)
      })
    } else {
      setLoading(false)
    }
  }, [id, isEditing])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!fio.codigoFio || !fio.nome) {
      toast.error("Código e Nome são obrigatórios")
      return
    }

    const payload = { ...fio }
    
    setSaving(true)
    try {
      const url = isEditing ? `/api/cadastros/fios/${id}` : "/api/cadastros/fios"
      const method = isEditing ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao salvar")
      }
      
      toast.success(isEditing ? "Fio atualizado!" : "Fio criado!")
      router.push("/cadastros/fios")
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erro ao salvar fio")
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Fio, value: string | boolean) => {
    if (field === "codigoFio") {
      setFio(prev => ({
        ...prev,
        codigoFio: value as string,
        codigoCompleto: `7.${value}.XXX.000001`,
      }))
    } else {
      setFio(prev => ({ ...prev, [field]: value }))
    }
  }

  const addFornecedor = async () => {
    if (!selectedFornecedor || !id) {
      toast.error("Salve o fio primeiro para adicionar fornecedores")
      return
    }
    
    try {
      const res = await fetch(`/api/cadastros/fios/${id}/fornecedores`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fornecedorId: parseInt(selectedFornecedor),
          codigoFornecedor,
          valorUnitario: valorUnitario || null,
        }),
      })
      
      if (!res.ok) throw new Error()
      
      const novos = await fetch(`/api/cadastros/fios/${id}/fornecedores`).then(r => r.json())
      setFioFornecedores(novos)
      setSelectedFornecedor("")
      setCodigoFornecedor("")
      setShowFornecedorForm(false)
      toast.success("Fornecedor adicionado")
    } catch {
      toast.error("Erro ao adicionar fornecedor")
    }
  }

  const removeFornecedor = async (fid: number) => {
    if (!id) return
    
    try {
      await fetch(`/api/cadastros/fios/${id}/fornecedores/${fid}`, { method: "DELETE" })
      setFioFornecedores(fioFornecedores.filter(f => f.id !== fid))
      toast.success("Fornecedor removido", { duration: 1000 })
    } catch {
      toast.error("Erro ao remover fornecedor", { duration: 1000 })
    }
  }

  const criarFornecedor = async () => {
    if (!novoFornecedor.nome) {
      toast.error("Nome é obrigatório")
      return
    }

    setSavingFornecedor(true)
    try {
      const res = await fetch("/api/cadastros/fornecedores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoFornecedor),
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao criar")
      }

      const fornecedorCriado = await res.json()
      toast.success("Fornecedor criado!")

      // Atualiza lista de fornecedores
      const novaLista = await fetch("/api/cadastros/fornecedores").then(r => r.json())
      setFornecedores(novaLista)

      // Se tem ID do fio, adiciona o fornecedor automaticamente
      if (id && isEditing) {
        await fetch(`/api/cadastros/fios/${id}/fornecedores`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fornecedorId: fornecedorCriado.id,
            codigoFornecedor: "",
          }),
        })
        
        const atualizados = await fetch(`/api/cadastros/fios/${id}/fornecedores`).then(r => r.json())
        setFioFornecedores(atualizados)
      }

      setShowNovoFornecedorModal(false)
      setNovoFornecedor({
        nome: "",
        cnpj: "",
        razaoSocial: "",
        email: "",
        telefone: "",
        contato: "",
        endereco: "",
        cidade: "",
        uf: "",
        ativo: true,
      })

    } catch (error: any) {
      console.error(error)
      toast.error(error.message || "Erro ao criar fornecedor")
    } finally {
      setSavingFornecedor(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-slate-400" size={24} />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/cadastros/fios" className="rounded-md p-2 text-slate-500 hover:bg-slate-100">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            {isEditing ? "Editar Fio" : "Novo Fio"}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="codigoFio">Código Curto *</Label>
            <Input id="codigoFio" value={fio.codigoFio} onChange={e => handleChange("codigoFio", e.target.value)} placeholder="AL20" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nome">Nome *</Label>
            <Input id="nome" value={fio.nome} onChange={e => handleChange("nome", e.target.value)} placeholder="Fio de Algodão" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="nomeComercial">Nome Comercial</Label>
            <Input id="nomeComercial" value={fio.nomeComercial || ""} onChange={e => handleChange("nomeComercial", e.target.value)} placeholder="Nome comercial" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="composicao">Composição</Label>
            <Input id="composicao" value={fio.composicao || ""} onChange={e => handleChange("composicao", e.target.value)} placeholder="100% Algodão" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título</Label>
            <Input id="titulo" value={fio.titulo || ""} onChange={e => handleChange("titulo", e.target.value)} placeholder="20/1" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="titulagemReal">Titulagem Real</Label>
            <Input id="titulagemReal" value={fio.titulagemReal || ""} onChange={e => handleChange("titulagemReal", e.target.value)} placeholder="19.5" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="ncm">NCM</Label>
            <Input id="ncm" value={fio.ncm || ""} onChange={e => handleChange("ncm", e.target.value)} placeholder="5205.11.00" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="torcao">Torção</Label>
            <Input id="torcao" value={fio.torcao || ""} onChange={e => handleChange("torcao", e.target.value)} placeholder="Z" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="resistencia">Resistência (kgf)</Label>
            <Input id="resistencia" value={fio.resistencia || ""} onChange={e => handleChange("resistencia", e.target.value)} placeholder="120" />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="observacoes">Observações</Label>
          <Input id="observacoes" value={fio.observacoes || ""} onChange={e => handleChange("observacoes", e.target.value)} placeholder="Observações" />
        </div>

        <div className="space-y-3">
          <Label>Links</Label>
          {fio.links && fio.links.length > 0 && (
            <div className="space-y-1">
              {fio.links.map((link, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-md border border-slate-200 dark:border-slate-700 px-3 py-2">
                  <div className="text-sm truncate">
                    <span className="font-medium">{link.descricao || "Link"}</span>
                    <span className="text-slate-500 ml-2">{link.url}</span>
                  </div>
                  <button type="button" onClick={() => removerLink(idx)} className="text-red-400 hover:text-red-600">
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Input placeholder="URL" value={novoLink.url} onChange={e => setNovoLink(prev => ({ ...prev, url: e.target.value }))} />
            <Input placeholder="Descrição" value={novoLink.descricao} onChange={e => setNovoLink(prev => ({ ...prev, descricao: e.target.value }))} />
            <Button type="button" variant="outline" size="icon" onClick={adicionarLink}>
              <Plus size={16} />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input type="checkbox" id="ativo" checked={fio.ativo} onChange={e => handleChange("ativo", e.target.checked)} className="w-4 h-4" />
          <Label htmlFor="ativo">Ativo</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="idIntegracao">ID Integração (ERP/WMS/CRM/OUTROS)</Label>
          <Input id="idIntegracao" value={fio.idIntegracao || ""} onChange={e => handleChange("idIntegracao", e.target.value)} placeholder="Código do sistema externo" />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
          <Link href="/cadastros/fios">
            <Button variant="outline" type="button">Cancelar</Button>
          </Link>
        </div>
      </form>

      {isEditing && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Fornecedores</h2>
            <Button type="button" onClick={() => setShowFornecedorForm(true)} size="sm" className="gap-2">
              <Plus size={16} /> Adicionar
            </Button>
          </div>

          {fioFornecedores.length > 0 && (
            <div className="space-y-2 mb-4">
              {fioFornecedores.map(ff => (
                  <div key={ff.id} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
                    <div>
                      <p className="font-medium">{ff.fornecedorNome}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {ff.codigoFornecedor && <span>Código: {ff.codigoFornecedor}</span>}
                        {ff.valorUnitario && <span className="ml-3">R$ {ff.valorUnitario}</span>}
                      </p>
                    </div>
                  <Button variant="ghost" size="icon" onClick={() => removeFornecedor(ff.id)}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {showFornecedorForm && (
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-lg space-y-4">
              <div className="flex items-center justify-between">
                <select
                  value={selectedFornecedor}
                  onChange={e => setSelectedFornecedor(e.target.value)}
                  className="flex-1 p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
                >
                  <option value="">Selecione fornecedor</option>
                  {fornecedores.map(f => (
                    <option key={f.id} value={f.id}>{f.nome}</option>
                  ))}
                </select>
                <Button type="button" onClick={() => setShowNovoFornecedorModal(true)} variant="outline" size="sm" className="ml-2 gap-1">
                  <Plus size={14} /> Novo
                </Button>
              </div>
              <Input placeholder="Código do fio (fornecedor)" value={codigoFornecedor} onChange={e => setCodigoFornecedor(e.target.value)} />
              <Input placeholder="Valor unitário (R$)" value={valorUnitario} onChange={e => setValorUnitario(e.target.value)} />
              <div className="flex gap-2">
                <Button onClick={addFornecedor}>Adicionar</Button>
                <Button variant="outline" onClick={() => setShowFornecedorForm(false)}>Cancelar</Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal para criar novo fornecedor */}
      <Dialog open={showNovoFornecedorModal} onOpenChange={setShowNovoFornecedorModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Fornecedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="novoNome">Nome / Fantasia *</Label>
                <Input id="novoNome" value={novoFornecedor.nome} onChange={e => setNovoFornecedor(prev => ({ ...prev, nome: e.target.value }))} placeholder="Fornecedor XYZ" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novoCnpj">CNPJ</Label>
                <Input id="novoCnpj" value={novoFornecedor.cnpj} onChange={e => setNovoFornecedor(prev => ({ ...prev, cnpj: e.target.value }))} placeholder="00.000.000/0001-00" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="novoRazaoSocial">Razão Social</Label>
              <Input id="novoRazaoSocial" value={novoFornecedor.razaoSocial} onChange={e => setNovoFornecedor(prev => ({ ...prev, razaoSocial: e.target.value }))} placeholder="Razão social completa" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="novoEmail">Email</Label>
                <Input id="novoEmail" type="email" value={novoFornecedor.email} onChange={e => setNovoFornecedor(prev => ({ ...prev, email: e.target.value }))} placeholder="contato@fornecedor.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novoTelefone">Telefone</Label>
                <Input id="novoTelefone" value={novoFornecedor.telefone} onChange={e => setNovoFornecedor(prev => ({ ...prev, telefone: e.target.value }))} placeholder="(11) 99999-9999" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="novoCidade">Cidade</Label>
                <Input id="novoCidade" value={novoFornecedor.cidade} onChange={e => setNovoFornecedor(prev => ({ ...prev, cidade: e.target.value }))} placeholder="São Paulo" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="novoUf">UF</Label>
                <Input id="novoUf" value={novoFornecedor.uf} onChange={e => setNovoFornecedor(prev => ({ ...prev, uf: e.target.value }))} placeholder="SP" maxLength={2} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNovoFornecedorModal(false)}>Cancelar</Button>
            <Button onClick={criarFornecedor} disabled={savingFornecedor} className="gap-2">
              {savingFornecedor && <Loader2 size={16} className="animate-spin" />}
              Criar Fornecedor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}