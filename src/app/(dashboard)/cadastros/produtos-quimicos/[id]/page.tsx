"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Save, Trash2 } from "lucide-react"

export default function ProdutoQuimicoFormPage() {
  const router = useRouter()
  const params = useParams()
  const id = params?.id as string
  const isNew = id === "novo"

  const [form, setForm] = useState({
    codigo: "",
    nome: "",
    descricao: "",
    categoria: "",
    unidadePadrao: "kg",
    tipo: "",
    concentracao: "",
    densidade: "",
    ph: "",
    observacoes: "",
    fichaSeguranca: "",
    idIntegracao: "",
    ativo: true,
  })

  useEffect(() => {
    if (!isNew) {
      fetch(`/api/cadastros/produtos-quimicos/${id}`)
        .then((r) => r.json())
        .then((data) => {
          setForm({
            codigo: data.codigo || "",
            nome: data.nome || "",
            descricao: data.descricao || "",
            categoria: data.categoria || "",
            unidadePadrao: data.unidadePadrao || "kg",
            tipo: data.tipo || "",
            concentracao: data.concentracao || "",
            densidade: data.densidade?.toString() || "",
            ph: data.ph?.toString() || "",
            observacoes: data.observacoes || "",
            fichaSeguranca: data.fichaSeguranca || "",
            idIntegracao: data.idIntegracao || "",
            ativo: data.ativo ?? true,
          })
        })
    }
  }, [id, isNew])

  async function handleSave() {
    const method = isNew ? "POST" : "PUT"
    const url = isNew ? "/api/cadastros/produtos-quimicos" : `/api/cadastros/produtos-quimicos/${id}`
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        densidade: form.densidade ? parseFloat(form.densidade) : null,
        ph: form.ph ? parseFloat(form.ph) : null,
      }),
    })
    if (res.ok) {
      router.push("/cadastros/produtos-quimicos")
    } else {
      const err = await res.json()
      alert(err.error || "Erro ao salvar")
    }
  }

  async function handleDelete() {
    if (!confirm("Excluir este produto químico?")) return
    const res = await fetch(`/api/cadastros/produtos-quimicos/${id}`, { method: "DELETE" })
    if (res.ok) router.push("/cadastros/produtos-quimicos")
  }

  const update = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm({ ...form, [field]: e.target.value })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
        </Button>
        <h1 className="text-2xl font-bold">{isNew ? "Novo Produto Químico" : "Editar Produto Químico"}</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados Principais</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={form.codigo} onChange={update("codigo")} />
              </div>
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input value={form.nome} onChange={update("nome")} />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Input value={form.categoria} onChange={update("categoria")} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Input value={form.tipo} onChange={update("tipo")} />
              </div>
              <div className="space-y-2">
                <Label>Unidade Padrão</Label>
                <Input value={form.unidadePadrao} onChange={update("unidadePadrao")} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descrição</Label>
              <Textarea value={form.descricao} onChange={update("descricao")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Integração (ERP)</Label>
                <Input value={form.idIntegracao} onChange={update("idIntegracao")} placeholder="Código no sistema externo" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={update("observacoes")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Propriedades</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Concentração</Label>
              <Input value={form.concentracao} onChange={update("concentracao")} />
            </div>
            <div className="space-y-2">
              <Label>Densidade</Label>
              <Input type="number" step="0.0001" value={form.densidade} onChange={update("densidade")} />
            </div>
            <div className="space-y-2">
              <Label>pH</Label>
              <Input type="number" step="0.1" value={form.ph} onChange={update("ph")} />
            </div>
            <div className="space-y-2">
              <Label>Ficha de Segurança (URL)</Label>
              <Input value={form.fichaSeguranca} onChange={update("fichaSeguranca")} placeholder="Link para ficha de segurança" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2 justify-between">
        <div>
          {!isNew && (
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" /> Excluir
            </Button>
          )}
        </div>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-1" /> Salvar
        </Button>
      </div>
    </div>
  )
}
