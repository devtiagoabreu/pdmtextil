"use client"

import { useQuery } from "@tanstack/react-query"
import { usePathname, useRouter, useParams } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowLeft, Save, Loader2, Plus, X, FileText,
} from "lucide-react"
import { toast } from "sonner"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

type Modulo = { id: number; titulo: string }
type Licao = {
  id: number; moduloId: number; moduloTitulo: string
  titulo: string; conteudoMd: string; preRequisitos: string | null
  linksPop: { label: string; url: string }[]
  linksVideo: { label: string; url: string }[]
  pathnameRelacionado: string | null
  ordem: number; ativo: boolean
}

export default function EditarLicaoPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const router = useRouter()
  const params = useParams()

  const [form, setForm] = useState({
    moduloId: "",
    titulo: "",
    conteudoMd: "",
    preRequisitos: "",
    pathnameRelacionado: "",
    ordem: "0",
    ativo: true,
  })
  const [linksPop, setLinksPop] = useState<{ label: string; url: string }[]>([])
  const [linksVideo, setLinksVideo] = useState<{ label: string; url: string }[]>([])
  const [novoPop, setNovoPop] = useState({ label: "", url: "" })
  const [novoVideo, setNovoVideo] = useState({ label: "", url: "" })
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const { data: modulos } = useQuery<Modulo[]>({
    queryKey: ["crm-treinamento-modulos"],
    queryFn: () => fetch("/api/crm/treinamento/modulos").then((r) => r.json()),
  })

  useEffect(() => {
    fetch(`/api/crm/treinamento/${params.id}`)
      .then((r) => r.json())
      .then((data: Licao) => {
        setForm({
          moduloId: String(data.moduloId),
          titulo: data.titulo,
          conteudoMd: data.conteudoMd,
          preRequisitos: data.preRequisitos || "",
          pathnameRelacionado: data.pathnameRelacionado || "",
          ordem: String(data.ordem),
          ativo: data.ativo,
        })
        setLinksPop(data.linksPop || [])
        setLinksVideo(data.linksVideo || [])
      })
      .catch(() => toast.error("Erro ao carregar lição"))
      .finally(() => setLoading(false))
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.moduloId || !form.titulo) {
      toast.error("Módulo e título são obrigatórios")
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`/api/crm/treinamento/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          moduloId: parseInt(form.moduloId),
          titulo: form.titulo,
          conteudoMd: form.conteudoMd,
          preRequisitos: form.preRequisitos || null,
          linksPop,
          linksVideo,
          pathnameRelacionado: form.pathnameRelacionado || null,
          ordem: parseInt(form.ordem) || 0,
          ativo: form.ativo,
        }),
      })
      if (!res.ok) throw new Error()
      toast.success("Lição atualizada!")
      router.push("/comercial/crm/treinamento/admin")
    } catch {
      toast.error("Erro ao atualizar lição")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/comercial/crm/treinamento/admin"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-3">
          <FileText size={24} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Editar Lição{info && <InfoButton content={info} />}
          </h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Módulo *</label>
            <select
              value={form.moduloId}
              onChange={(e) => setForm({ ...form, moduloId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800"
              required
            >
              {modulos?.map((m) => (
                <option key={m.id} value={m.id}>{m.titulo}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Título *</label>
            <input
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Ordem</label>
            <input
              type="number"
              value={form.ordem}
              onChange={(e) => setForm({ ...form, ordem: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800"
            />
          </div>
          <div className="flex items-center gap-3 pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm({ ...form, ativo: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm text-slate-700 dark:text-slate-300">Ativo</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pathname relacionado</label>
            <input
              value={form.pathnameRelacionado}
              onChange={(e) => setForm({ ...form, pathnameRelacionado: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Pré-requisitos</label>
          <textarea
            value={form.preRequisitos}
            onChange={(e) => setForm({ ...form, preRequisitos: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800"
            rows={3}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Conteúdo (Markdown)</label>
          <textarea
            value={form.conteudoMd}
            onChange={(e) => setForm({ ...form, conteudoMd: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 font-mono"
            rows={16}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Links POP</label>
            {linksPop.map((link, i) => (
              <div key={i} className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mb-2">
                <span className="flex-1 truncate">{link.label}</span>
                <button type="button" onClick={() => setLinksPop(linksPop.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><X size={14} /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <input placeholder="Nome" value={novoPop.label} onChange={(e) => setNovoPop({ ...novoPop, label: e.target.value })} className="flex-1 px-2 py-1.5 border rounded-lg text-xs" />
              <input placeholder="URL" value={novoPop.url} onChange={(e) => setNovoPop({ ...novoPop, url: e.target.value })} className="flex-1 px-2 py-1.5 border rounded-lg text-xs" />
              <button type="button" onClick={() => { if (novoPop.label && novoPop.url) { setLinksPop([...linksPop, novoPop]); setNovoPop({ label: "", url: "" }) } }} className="p-1.5 text-indigo-600"><Plus size={16} /></button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Links Vídeos</label>
            {linksVideo.map((link, i) => (
              <div key={i} className="flex items-center gap-2 text-sm bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg mb-2">
                <span className="flex-1 truncate">{link.label}</span>
                <button type="button" onClick={() => setLinksVideo(linksVideo.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600"><X size={14} /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <input placeholder="Nome" value={novoVideo.label} onChange={(e) => setNovoVideo({ ...novoVideo, label: e.target.value })} className="flex-1 px-2 py-1.5 border rounded-lg text-xs" />
              <input placeholder="URL" value={novoVideo.url} onChange={(e) => setNovoVideo({ ...novoVideo, url: e.target.value })} className="flex-1 px-2 py-1.5 border rounded-lg text-xs" />
              <button type="button" onClick={() => { if (novoVideo.label && novoVideo.url) { setLinksVideo([...linksVideo, novoVideo]); setNovoVideo({ label: "", url: "" }) } }} className="p-1.5 text-indigo-600"><Plus size={16} /></button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? "Salvando..." : "Salvar"}
          </button>
          <Link href="/comercial/crm/treinamento/admin" className="text-sm text-slate-600 hover:text-slate-800">Cancelar</Link>
        </div>
      </form>
    </div>
  )
}
