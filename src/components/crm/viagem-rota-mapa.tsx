"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin } from "lucide-react"
import { agruparPontos, type PontoMapa } from "@/lib/crm/agrupar-pontos"

export type { PontoMapa } from "@/lib/crm/agrupar-pontos"

export default function ViagemRotaMapa({ pontos }: { pontos: PontoMapa[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el || pontos.length === 0) return
    let cancelled = false
    let mapa: any = null

    ;(async () => {
      try {
        const L = (await import("leaflet")).default
        if (cancelled || !el || pontos.length === 0) return
        const grupos = agruparPontos(pontos)
        const latlngs = grupos.map((g) => [g.latitude, g.longitude] as [number, number])
        mapa = L.map(el, { scrollWheelZoom: false })
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(mapa)
        L.polyline(latlngs, { color: "#2563eb", weight: 4, opacity: 0.85 }).addTo(mapa)
        grupos.forEach((grupo) => {
          const todos = grupo.ordem.length === 1
          const cor = todos ? "#2563eb" : "#b91c1c"
          const tamanho = todos ? 26 : 30
          const rotulo = todos ? String(grupo.ordem[0]) : String(grupo.ordem.length)
          const icone = L.divIcon({
            className: "",
            html: `<div style="width:${tamanho}px;height:${tamanho}px;border-radius:50%;background:${cor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:${todos ? 12 : 13}px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">${rotulo}</div>`,
            iconSize: [tamanho, tamanho],
            iconAnchor: [tamanho / 2, tamanho / 2],
          })
          const popup = todos
            ? `<strong>${grupo.ordem[0]}.</strong> ${grupo.rotulos[0]}`
            : `<strong>${grupo.ordem.length} visitas neste ponto</strong><br>` +
              grupo.ordem.map((n, i) => `<strong>${n}.</strong> ${grupo.rotulos[i]}`).join("<br>")
          L.marker([grupo.latitude, grupo.longitude], { icon: icone })
            .addTo(mapa)
            .bindPopup(popup)
        })
        if (latlngs.length === 1) {
          mapa.setView(latlngs[0], 14)
        } else {
          mapa.fitBounds(L.latLngBounds(latlngs), { padding: [32, 32] })
        }
        setTimeout(() => mapa?.invalidateSize(), 150)
      } catch {
        if (!cancelled) setErro(true)
      }
    })()

    return () => {
      cancelled = true
      if (mapa) mapa.remove()
    }
  }, [pontos])

  if (pontos.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <p className="text-sm text-slate-400 flex items-center gap-2">
          <MapPin size={16} /> Nenhuma visita com localização registrada
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="h-64 w-full rounded-xl overflow-hidden z-0 relative" data-testid="mapa-roteiro" />
      {erro && <p className="text-xs text-slate-400">Não foi possível carregar o mapa do trajeto.</p>}
    </div>
  )
}