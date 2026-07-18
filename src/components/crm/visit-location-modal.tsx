"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useState } from "react"
import { X, MapPin, Navigation, Trash2, ExternalLink, Loader2 } from "lucide-react"

type Localizacao = {
  id: number
  visitaId: number
  latitude: number
  longitude: number
  endereco: string | null
  observacao: string | null
  fotoUrl: string | null
  tipo: string
  criadoPor: number | null
  createdAt: string | null
}

interface VisitLocationModalProps {
  visitaId: number
  empresaNome?: string
  open: boolean
  onClose: () => void
}

export default function VisitLocationModal({ visitaId, empresaNome, open, onClose }: VisitLocationModalProps) {
  const queryClient = useQueryClient()
  const [observacao, setObservacao] = useState("")
  const [capturing, setCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: localizacoes = [], isLoading } = useQuery<Localizacao[]>({
    queryKey: ["visitas-localizacoes", visitaId],
    queryFn: () => fetch(`/api/crm/visitas/${visitaId}/localizacoes`).then((r) => r.json()),
    enabled: open && !!visitaId,
  })

  const addMutation = useMutation({
    mutationFn: async (data: { latitude: number; longitude: number; endereco?: string; observacao?: string }) => {
      const res = await fetch(`/api/crm/visitas/${visitaId}/localizacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error("Erro ao salvar localização")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitas-localizacoes", visitaId] })
      setObservacao("")
      setCapturing(false)
    },
    onError: () => setError("Erro ao salvar localização"),
  })

  const deleteMutation = useMutation({
    mutationFn: async (localizacaoId: number) => {
      const res = await fetch(`/api/crm/visitas/${visitaId}/localizacoes?localizacaoId=${localizacaoId}`, {
        method: "DELETE",
      })
      if (!res.ok) throw new Error("Erro ao excluir")
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["visitas-localizacoes", visitaId] })
    },
  })

  function handleCaptureLocation() {
    if (!navigator.geolocation) {
      setError("Geolocalização não suportada pelo navegador")
      return
    }

    setCapturing(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        addMutation.mutate({
          latitude,
          longitude,
          observacao: observacao || undefined,
        })
      },
      (err) => {
        setCapturing(false)
        if (err.code === 1) {
          setError("Permissão de localização negada. Ative nas configurações do navegador.")
        } else {
          setError("Erro ao obter localização. Tente novamente.")
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  function openGoogleMaps(lat: number, lng: number) {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank")
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              Localizações da Visita
            </h2>
            {empresaNome && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{empresaNome}</p>
            )}
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="animate-spin text-blue-600" size={24} />
            </div>
          ) : localizacoes.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Nenhuma localização registrada
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Clique no botão abaixo para registrar a localização atual
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {localizacoes.map((loc) => (
                <div
                  key={loc.id}
                  className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50"
                >
                  <div className="rounded-lg bg-blue-100 dark:bg-blue-950/50 p-2 mt-0.5">
                    <MapPin size={16} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                      {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                    </p>
                    {loc.endereco && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{loc.endereco}</p>
                    )}
                    {loc.observacao && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 italic">
                        &ldquo;{loc.observacao}&rdquo;
                      </p>
                    )}
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                      {loc.createdAt
                        ? new Date(loc.createdAt).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openGoogleMaps(loc.latitude, loc.longitude)}
                      className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                      title="Abrir no Google Maps"
                    >
                      <ExternalLink size={14} className="text-slate-500" />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(loc.id)}
                      className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/50 transition-colors"
                      title="Excluir localização"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
              Observação (opcional)
            </label>
            <input
              type="text"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Ex: Estacionamento lateral, portão azul..."
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleCaptureLocation}
            disabled={capturing || addMutation.isPending}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {capturing || addMutation.isPending ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Capturando localização...
              </>
            ) : (
              <>
                <Navigation size={16} />
                Registrar Localização Atual
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
