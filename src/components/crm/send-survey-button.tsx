"use client"

import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { Mail, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog"

interface SendSurveyButtonProps {
  visitaId: number
  empresaNome?: string
  contatoEmail?: string
  contatoNome?: string
}

export default function SendSurveyButton({ visitaId, empresaNome, contatoEmail, contatoNome }: SendSurveyButtonProps) {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [nome, setNome] = useState("")

  function handleOpen() {
    setEmail(contatoEmail || "")
    setNome(contatoNome || "")
    setOpen(true)
  }

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
    <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) setOpen(false) }}>
      <DialogPrimitive.Trigger
        onClick={handleOpen}
        className="flex items-center gap-1.5 text-xs font-medium text-violet-600 hover:underline px-2 py-1.5 rounded-lg min-h-[36px]"
      >
        <Mail size={14} />
        Enviar Pesquisa
      </DialogPrimitive.Trigger>

      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop className="fixed inset-0 z-50 bg-black/50" onClick={() => setOpen(false)} />
        <DialogPrimitive.Popup className="fixed top-1/2 left-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 outline-none">
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <DialogPrimitive.Title className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Enviar Pesquisa de Satisfação
            </DialogPrimitive.Title>
            <DialogPrimitive.Close aria-label="Fechar" className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
              <X size={20} className="text-slate-500" />
            </DialogPrimitive.Close>
          </div>

            <div className="p-4 space-y-4">
              {empresaNome && (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Visita: <span className="font-medium text-slate-900 dark:text-slate-100">{empresaNome}</span>
                </p>
              )}

              <div>
                <label htmlFor="survey-email" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Email do destinatario *
                </label>
                <input
                  id="survey-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@exemplo.com"
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label htmlFor="survey-nome" className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Nome (opcional)
                </label>
                <input
                  id="survey-nome"
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
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
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
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}
