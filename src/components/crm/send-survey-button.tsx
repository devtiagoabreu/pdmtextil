"use client"

import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { Mail, Loader2, X } from "lucide-react"
import { toast } from "sonner"

interface SendSurveyButtonProps {
  visitaId: number
  empresaNome?: string
}

export default function SendSurveyButton({ visitaId, empresaNome }: SendSurveyButtonProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [nome, setNome] = useState("")

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/crm/visitas/${visitaId}/pesquisa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, nome }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao enviar")
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success("Pesquisa enviada com sucesso!")
      setOpen(false)
      setEmail("")
      setNome("")
    },
    onError: (err: Error) => {
      toast.error(err.message)
    },
  })

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:underline"
      >
        <Mail size={14} />
        Enviar Pesquisa
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                Enviar Pesquisa de Satisfacao
              </h2>
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={20} className="text-slate-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {empresaNome && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Visita: <span className="font-medium text-slate-900 dark:text-slate-100">{empresaNome}</span>
                </p>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Email do destinatario *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nome (opcional)
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome da pessoa"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => sendMutation.mutate()}
                disabled={!email.includes("@") || sendMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#073fb8] rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendMutation.isPending ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Mail size={14} />
                )}
                {sendMutation.isPending ? "Enviando..." : "Enviar Pesquisa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
