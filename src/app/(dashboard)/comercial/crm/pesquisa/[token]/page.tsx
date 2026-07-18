"use client"

import { useQuery, useMutation } from "@tanstack/react-query"
import { useParams } from "next/navigation"
import { useState } from "react"
import { CheckCircle2, Star, Loader2 } from "lucide-react"

type PesquisaData = {
  id: number
  visitaId: number
  email: string
  nome: string | null
  status: string
  alreadyAnswered?: boolean
  dataVisita: string | null
}

const PERGUNTAS = [
  {
    id: 1,
    pergunta: "Como voce avaliaria o atendimento?",
    tipo: "ESTRELAS",
  },
  {
    id: 2,
    pergunta: "O representante estava bem preparado?",
    tipo: "ALTERNATIVA",
    opcoes: ["Sim", "Nao", "Parcialmente"],
  },
  {
    id: 3,
    pergunta: "As informacoes foram claras e uteis?",
    tipo: "ALTERNATIVA",
    opcoes: ["Sim", "Nao", "Parcialmente"],
  },
  {
    id: 4,
    pergunta: "Voce recomendaria nossa empresa?",
    tipo: "ALTERNATIVA",
    opcoes: [
      "Definitivamente sim",
      "Provavelmente sim",
      "Neutro",
      "Provavelmente nao",
      "Definitivamente nao",
    ],
  },
  {
    id: 5,
    pergunta: "Como esta a necessidade atual?",
    tipo: "ALTERNATIVA",
    opcoes: ["Crescendo", "Estavel", "Reduzindo"],
  },
  {
    id: 6,
    pergunta: "Observacoes livres",
    tipo: "ABERTA",
  },
]

export default function PesquisaSatisfacaoPage() {
  const params = useParams()
  const token = params.token as string
  const [respostas, setRespostas] = useState<Record<number, string>>({})
  const [submitted, setSubmitted] = useState(false)

  const { data: pesquisa, isLoading } = useQuery<PesquisaData>({
    queryKey: ["pesquisa-satisfacao", token],
    queryFn: () => fetch(`/api/crm/pesquisa/${token}`).then((r) => r.json()),
    enabled: !!token,
  })

  const submitMutation = useMutation({
    mutationFn: async () => {
      const respostasArray = PERGUNTAS.map((p) => ({
        pergunta: p.pergunta,
        tipo: p.tipo,
        resposta: respostas[p.id] || "",
      }))

      const res = await fetch(`/api/crm/pesquisa/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respostas: respostasArray }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Erro ao enviar")
      }
      return res.json()
    },
    onSuccess: () => setSubmitted(true),
  })

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    )
  }

  if (pesquisa?.alreadyAnswered || submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="rounded-full bg-green-100 dark:bg-green-950/50 w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Obrigado!
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Sua resposta foi registrada com sucesso. Sua opiniao e muito importante para nos!
          </p>
        </div>
      </div>
    )
  }

  if (pesquisa?.status === "PENDENTE") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Pesquisa invalida
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Esta pesquisa ainda nao foi enviada.
          </p>
        </div>
      </div>
    )
  }

  const allAnswered = PERGUNTAS.every((p) => respostas[p.id]?.trim())

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8 px-4">
      <div className="max-w-lg mx-auto">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-[#073fb8] p-6">
            <h1 className="text-xl font-bold text-white">Pesquisa de Satisfacao</h1>
            <p className="text-sm text-blue-100 mt-1">PDM PRO TEXTIL</p>
            {pesquisa?.dataVisita && (
              <p className="text-xs text-blue-200 mt-1">
                Visita: {new Date(pesquisa.dataVisita + "T12:00:00").toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>

          <div className="p-6 space-y-6">
            {PERGUNTAS.map((pergunta) => (
              <div key={pergunta.id}>
                <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-3">
                  {pergunta.id}. {pergunta.pergunta}
                </label>

                {pergunta.tipo === "ESTRELAS" ? (
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRespostas((prev) => ({ ...prev, [pergunta.id]: String(star) }))}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          size={28}
                          className={
                            Number(respostas[pergunta.id]) >= star
                              ? "text-amber-400 fill-amber-400"
                              : "text-slate-300 dark:text-slate-600"
                          }
                        />
                      </button>
                    ))}
                    {respostas[pergunta.id] && (
                      <span className="text-sm text-slate-500 ml-2 self-center">
                        {respostas[pergunta.id]}/5
                      </span>
                    )}
                  </div>
                ) : pergunta.tipo === "ABERTA" ? (
                  <textarea
                    value={respostas[pergunta.id] || ""}
                    onChange={(e) => setRespostas((prev) => ({ ...prev, [pergunta.id]: e.target.value }))}
                    rows={3}
                    placeholder="Digite sua observacao..."
                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {pergunta.opcoes?.map((opcao) => (
                      <button
                        key={opcao}
                        type="button"
                        onClick={() => setRespostas((prev) => ({ ...prev, [pergunta.id]: opcao }))}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          respostas[pergunta.id] === opcao
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                        }`}
                      >
                        {opcao}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-700">
            <button
              onClick={() => submitMutation.mutate()}
              disabled={!allAnswered || submitMutation.isPending}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-[#073fb8] px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Respostas"
              )}
            </button>
            {!allAnswered && (
              <p className="text-xs text-slate-400 text-center mt-2">
                Responda todas as perguntas para enviar
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
