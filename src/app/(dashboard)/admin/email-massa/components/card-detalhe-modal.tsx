"use client"

import { useMemo } from "react"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog"
import type { Envio } from "../types"

export type TipoCard = "total" | "enviados" | "lidos" | "cliques" | "falhas"

const TITULOS: Record<TipoCard, string> = {
  total: "Total",
  enviados: "Enviados",
  lidos: "Lidos",
  cliques: "Cliques",
  falhas: "Falhas",
}

function filtroPorTipo(tipo: TipoCard, e: Envio): boolean {
  switch (tipo) {
    case "total": return true
    case "enviados": return e.status === "enviado"
    case "lidos": return !!e.abertoEm
    case "cliques": return (e.totalCliques || 0) > 0
    case "falhas": return e.status === "falhou"
  }
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

function disparoLabel(e: Envio) {
  if (!e.disparoId) return "—"
  return e.disparoNome ? `#${e.disparoId} — ${e.disparoNome}` : `#${e.disparoId}`
}

export function CardDetalheModal({
  open,
  onOpenChange,
  tipo,
  envios,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipo: TipoCard
  envios: Envio[]
}) {
  const filtrados = useMemo(() => envios.filter((e) => filtroPorTipo(tipo, e)), [envios, tipo])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{TITULOS[tipo]} ({filtrados.length})</DialogTitle>
          <DialogDescription>
            Listagem dos contatos do card {TITULOS[tipo].toLowerCase()} com o disparo de origem.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-auto rounded-md border border-slate-200 dark:border-slate-700">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <th className="p-2 text-left font-medium text-slate-500 dark:text-slate-400">Disparo</th>
                <th className="p-2 text-left font-medium text-slate-500 dark:text-slate-400">Email</th>
                <th className="p-2 text-left font-medium text-slate-500 dark:text-slate-400">Nome</th>
                <th className="p-2 text-left font-medium text-slate-500 dark:text-slate-400">Assunto</th>
                <th className="p-2 text-center font-medium text-slate-500 dark:text-slate-400">Cliques</th>
                <th className="p-2 text-left font-medium text-slate-500 dark:text-slate-400">Enviado em</th>
                <th className="p-2 text-left font-medium text-slate-500 dark:text-slate-400">Aberto em</th>
                <th className="p-2 text-left font-medium text-slate-500 dark:text-slate-400">Erro</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-4 text-center text-sm text-slate-400">
                    Nenhum contato neste card.
                  </td>
                </tr>
              ) : (
                filtrados.map((e) => (
                  <tr key={e.id} className="border-b border-slate-100 dark:border-slate-800">
                    <td className="p-2 whitespace-nowrap font-medium">{disparoLabel(e)}</td>
                    <td className="p-2 text-slate-600 dark:text-slate-300 break-words">{e.email}</td>
                    <td className="p-2 truncate">{e.nome || "—"}</td>
                    <td className="p-2 text-slate-500 truncate">{e.assunto}</td>
                    <td className="p-2 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${e.totalCliques > 0 ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" : "bg-slate-100 text-slate-400 dark:bg-slate-800"}`}>
                        {e.totalCliques || 0}
                      </span>
                    </td>
                    <td className="p-2 text-slate-500 text-xs whitespace-nowrap">{formatDate(e.createdAt)}</td>
                    <td className="p-2 text-slate-500 text-xs whitespace-nowrap">{formatDate(e.abertoEm)}</td>
                    <td className="p-2 text-red-500 text-xs truncate">{e.error || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
