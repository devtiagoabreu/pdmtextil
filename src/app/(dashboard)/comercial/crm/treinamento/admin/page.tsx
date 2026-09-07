"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import {
  BookOpen, GraduationCap, Plus, FileText, Pencil, Trash2, Loader2,
  ArrowLeft, Settings, ExternalLink, Edit3,
} from "lucide-react"
import { toast } from "sonner"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

type Modulo = {
  id: number
  titulo: string
  descricao: string | null
  icone: string | null
  cor: string | null
  ordem: number
  ativo: boolean
  createdAt: string
}

type Licao = {
  id: number
  moduloId: number
  titulo: string
  ordem: number
  ativo: boolean
  pathnameRelacionado: string | null
}

type ModuloComLicoes = Modulo & {
  licoes: Licao[]
}

export default function AdminTreinamentoPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const router = useRouter()
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [showNovoModulo, setShowNovoModulo] = useState(false)
  const [novoModulo, setNovoModulo] = useState({ titulo: "", descricao: "", icone: "BookOpen", cor: "#6366f1" })

  const { data: modulos, isLoading } = useQuery<ModuloComLicoes[]>({
    queryKey: ["crm-treinamento"],
    queryFn: () => fetch("/api/crm/treinamento").then((r) => r.json()),
  })

  const deleteLicao = useMutation({
    mutationFn: (id: number) => fetch(`/api/crm/treinamento/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-treinamento"] })
      toast.success("Lição removida")
    },
    onError: () => toast.error("Erro ao remover lição"),
  })

  const deleteModulo = useMutation({
    mutationFn: (id: number) => fetch(`/api/crm/treinamento/modulos/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-treinamento"] })
      toast.success("Módulo removido")
    },
    onError: () => toast.error("Erro ao remover módulo"),
  })

  const criarModulo = useMutation({
    mutationFn: (data: typeof novoModulo) =>
      fetch("/api/crm/treinamento/modulos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm-treinamento"] })
      setShowNovoModulo(false)
      setNovoModulo({ titulo: "", descricao: "", icone: "BookOpen", cor: "#6366f1" })
      toast.success("Módulo criado")
    },
    onError: () => toast.error("Erro ao criar módulo"),
  })

  const handleDeleteLicao = (id: number, titulo: string) => {
    if (confirm(`Remover a lição "${titulo}"?`)) {
      setDeletingId(id)
      deleteLicao.mutate(id, { onSettled: () => setDeletingId(null) })
    }
  }

  const handleDeleteModulo = (id: number, titulo: string) => {
    if (confirm(`Remover o módulo "${titulo}" e todas as suas lições?`)) {
      deleteModulo.mutate(id)
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/comercial/crm/treinamento"
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <Settings size={24} className="text-indigo-600" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
            Gerenciar Treinamento{info && <InfoButton content={info} />}
          </h1>
        </div>
        <button
          onClick={() => setShowNovoModulo(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={16} />
          Novo Módulo
        </button>
      </div>

      {showNovoModulo && (
        <div className="mb-6 p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800/50">
          <h3 className="font-medium text-slate-900 dark:text-slate-50 mb-3">Novo Módulo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <input
              placeholder="Título do módulo"
              value={novoModulo.titulo}
              onChange={(e) => setNovoModulo({ ...novoModulo, titulo: e.target.value })}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800"
            />
            <input
              placeholder="Descrição (opcional)"
              value={novoModulo.descricao}
              onChange={(e) => setNovoModulo({ ...novoModulo, descricao: e.target.value })}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800"
            />
            <input
              placeholder="Ícone (BookOpen, GraduationCap, etc)"
              value={novoModulo.icone}
              onChange={(e) => setNovoModulo({ ...novoModulo, icone: e.target.value })}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800"
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={novoModulo.cor}
                onChange={(e) => setNovoModulo({ ...novoModulo, cor: e.target.value })}
                className="w-9 h-9 rounded cursor-pointer"
              />
              <span className="text-xs text-slate-500">{novoModulo.cor}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => criarModulo.mutate(novoModulo)}
              disabled={!novoModulo.titulo || criarModulo.isPending}
              className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {criarModulo.isPending ? "Salvando..." : "Salvar"}
            </button>
            <button
              onClick={() => setShowNovoModulo(false)}
              className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="space-y-6">
          {modulos?.map((modulo) => (
            <div key={modulo.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: modulo.cor || "#6366f1" }}
                >
                  <BookOpen size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="font-medium text-slate-900 dark:text-slate-50">{modulo.titulo}</h2>
                  {modulo.descricao && (
                    <p className="text-xs text-slate-500 truncate">{modulo.descricao}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/comercial/crm/treinamento/admin/novo?moduloId=${modulo.id}`}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors"
                    title="Nova lição neste módulo"
                  >
                    <Plus size={16} />
                  </Link>
                  <button
                    onClick={() => handleDeleteModulo(modulo.id, modulo.titulo)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                    title="Remover módulo"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {modulo.licoes.filter((l) => l.ativo).length === 0 ? (
                <p className="p-4 text-sm text-slate-400 text-center">Nenhuma lição neste módulo</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {modulo.licoes.filter((l) => l.ativo).map((licao) => (
                    <div key={licao.id} className="flex items-center gap-3 px-4 py-2.5 group">
                      <FileText size={15} className="text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{licao.titulo}</span>
                      {licao.pathnameRelacionado && (
                        <span className="text-[10px] text-slate-400 hidden sm:inline">{licao.pathnameRelacionado}</span>
                      )}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link
                          href={`/comercial/crm/treinamento/admin/${licao.id}`}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 size={14} />
                        </Link>
                        <button
                          onClick={() => handleDeleteLicao(licao.id, licao.titulo)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Remover"
                        >
                          {deletingId === licao.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
