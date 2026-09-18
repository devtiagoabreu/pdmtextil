"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { ArrowLeft, Loader2 } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  CHAMADO_CATEGORIA_LABELS,
  CHAMADO_PRIORIDADE_LABELS,
} from "@/lib/chamados/constantes"
import type { ChamadoCategoria, ChamadoPrioridade } from "@/lib/db/schema/chamados"

interface Area {
  id: number
  nome: string
  siteNome?: string | null
}

interface Ativo {
  id: number
  nome: string
  codigo?: string | null
}

interface Processo {
  id: number
  nome: string
  codigo?: string | null
  areaId?: number | null
}

const selectClass =
  "w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"

export default function ChamadoNovoPage() {
  const router = useRouter()
  const pathname = usePathname()
  const info = getInfoContent(pathname)

  const [titulo, setTitulo] = useState("")
  const [descricao, setDescricao] = useState("")
  const [categoria, setCategoria] = useState<ChamadoCategoria>("SOLICITACAO")
  const [prioridade, setPrioridade] = useState<ChamadoPrioridade>("MEDIA")
  const [areaId, setAreaId] = useState("")
  const [ativoId, setAtivoId] = useState("")
  const [processoId, setProcessoId] = useState("")
  const [anexoUrl, setAnexoUrl] = useState("")
  const [saving, setSaving] = useState(false)

  const { data: areas = [] } = useQuery<Area[]>({
    queryKey: ["chamados-novo-areas"],
    queryFn: async () => {
      const res = await fetch("/api/processos/areas")
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: ativos = [] } = useQuery<Ativo[]>({
    queryKey: ["chamados-novo-ativos"],
    queryFn: async () => {
      const res = await fetch("/api/ativos")
      if (!res.ok) return []
      return res.json()
    },
  })

  const { data: processos = [] } = useQuery<Processo[]>({
    queryKey: ["chamados-novo-processos"],
    queryFn: async () => {
      const res = await fetch("/api/processos/processos")
      if (!res.ok) return []
      return res.json()
    },
  })

  const processosDaArea = processos.filter((p) => p.areaId === parseInt(areaId))

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!titulo.trim()) {
      toast.error("Informe o título")
      return
    }
    if (!descricao.trim()) {
      toast.error("Descreva o problema ou solicitação")
      return
    }
    if (!areaId) {
      toast.error("Selecione a fila (área responsável)")
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/chamados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: titulo.trim(),
          descricao: descricao.trim(),
          categoria,
          prioridade,
          areaId: parseInt(areaId),
          ativoId: ativoId ? parseInt(ativoId) : null,
          processoId: processoId ? parseInt(processoId) : null,
          anexos: anexoUrl.trim() ? [{ url: anexoUrl.trim() }] : [],
        }),
      })

      if (res.ok) {
        const body = await res.json()
        toast.success("Chamado aberto!")
        router.push(`/chamados/${body.id ?? ""}`.replace(/\/$/, ""))
      } else {
        const err = await res.json()
        throw new Error(err.error || "Erro ao abrir chamado")
      }
    } catch (error: unknown) {
      console.error(error)
      toast.error(error instanceof Error ? error.message : "Erro ao abrir chamado")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/chamados">
          <Button variant="ghost" size="icon">
            <ArrowLeft size={20} />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Novo Chamado
            {info && <InfoButton content={info} />}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="titulo" className="font-medium">
              Título
            </Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex.: Impressora do setor de corte não imprime"
              required
            />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="descricao" className="font-medium">
              Descrição
            </Label>
            <textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              placeholder="Descreva o problema ou a solicitação com o máximo de detalhes..."
              className="w-full p-2 rounded border bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categoria" className="font-medium">
              Categoria
            </Label>
            <select
              id="categoria"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as ChamadoCategoria)}
              className={selectClass}
            >
              {Object.entries(CHAMADO_CATEGORIA_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prioridade" className="font-medium">
              Prioridade
            </Label>
            <select
              id="prioridade"
              value={prioridade}
              onChange={(e) => setPrioridade(e.target.value as ChamadoPrioridade)}
              className={selectClass}
            >
              {Object.entries(CHAMADO_PRIORIDADE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="areaId" className="font-medium">
              Fila (área responsável)
            </Label>
            <select
              id="areaId"
              value={areaId}
              onChange={(e) => {
                const novaArea = parseInt(e.target.value)
                setAreaId(e.target.value)
                if (
                  processoId &&
                  processos.some((p) => p.id === parseInt(processoId) && p.areaId !== novaArea)
                ) {
                  setProcessoId("")
                }
              }}
              className={selectClass}
              required
            >
              <option value="">Selecione a fila</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.siteNome ? `${area.siteNome} — ` : ""}
                  {area.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ativoId" className="font-medium">
              Ativo relacionado <span className="text-slate-400">(opcional)</span>
            </Label>
            <select
              id="ativoId"
              value={ativoId}
              onChange={(e) => setAtivoId(e.target.value)}
              className={selectClass}
            >
              <option value="">Nenhum</option>
              {ativos.map((ativo) => (
                <option key={ativo.id} value={ativo.id}>
                  {ativo.codigo ? `${ativo.codigo} — ` : ""}
                  {ativo.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="processoId" className="font-medium">
              Processo relacionado <span className="text-slate-400">(opcional)</span>
            </Label>
            <select
              id="processoId"
              value={processoId}
              onChange={(e) => setProcessoId(e.target.value)}
              className={selectClass}
            >
              <option value="" disabled={!areaId}>
                {areaId ? "Nenhum" : "Selecione a fila primeiro"}
              </option>
              {processosDaArea.map((processo) => (
                <option key={processo.id} value={processo.id}>
                  {processo.codigo ? `${processo.codigo} — ` : ""}
                  {processo.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="anexoUrl" className="font-medium">
              Link de anexo <span className="text-slate-400">(opcional)</span>
            </Label>
            <Input
              id="anexoUrl"
              type="url"
              value={anexoUrl}
              onChange={(e) => setAnexoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving} className="gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            Criar
          </Button>
          <Link href="/chamados">
            <Button variant="outline" type="button">
              Cancelar
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}