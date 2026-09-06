"use client"

import { useEffect, useRef, useState } from "react"
import { MapPin, Search, Loader2 } from "lucide-react"
import { agruparPontos, type PontoMapa } from "@/lib/crm/agrupar-pontos"
import { buscarLocal, formatarCoordenadas, type ResultadoBuscaLocal } from "@/lib/crm/buscar-local"

export type { PontoMapa } from "@/lib/crm/agrupar-pontos"

export default function ViagemRotaMapa({ pontos }: { pontos: PontoMapa[] }) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const mapaRef = useRef<any>(null)
  const [erro, setErro] = useState(false)
  const [termo, setTermo] = useState("")
  const [buscando, setBuscando] = useState(false)
  const [resultados, setResultados] = useState<ResultadoBuscaLocal[]>([])
  const [foco, setFoco] = useState<ResultadoBuscaLocal | null>(null)

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
        mapa = L.map(el, { scrollWheelZoom: true, zoomControl: true })
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
          const coords = formatarCoordenadas(grupo.latitude, grupo.longitude)
          const popup = todos
            ? `<strong>${grupo.ordem[0]}.</strong> ${grupo.rotulos[0]}<br><span style="color:#64748b">${coords}</span>`
            : `<strong>${grupo.ordem.length} visitas neste ponto</strong><br>` +
              grupo.ordem.map((n, i) => `<strong>${n}.</strong> ${grupo.rotulos[i]}`).join("<br>") +
              `<br><span style="color:#64748b">${coords}</span>`
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
        mapaRef.current = mapa
      } catch {
        if (!cancelled) setErro(true)
      }
    })()

    return () => {
      cancelled = true
      if (mapa) mapa.remove()
      mapaRef.current = null
    }
  }, [pontos])

  useEffect(() => {
    const texto = termo.trim()
    if (texto.length < 3) {
      setResultados([])
      setBuscando(false)
      return
    }
    setBuscando(true)
    const controller = new AbortController()
    const timer = setTimeout(async () => {
      const achados = await buscarLocal(texto, controller.signal)
      if (!controller.signal.aborted) {
        setResultados(achados)
        setBuscando(false)
      }
    }, 450)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [termo])

  function irPara(resultado: ResultadoBuscaLocal) {
    setFoco(resultado)
    setResultados([])
    setTermo("")
    const mapa = mapaRef.current
    if (!mapa) return
    import("leaflet").then(({ default: L }) => {
      if (!mapaRef.current) return
      mapa.flyTo([resultado.latitude, resultado.longitude], 15)
      const icone = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;border-radius:50%;background:#f59e0b;color:#fff;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35)">&#9873;</div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      })
      L.marker([resultado.latitude, resultado.longitude], { icon: icone })
        .addTo(mapa)
        .bindPopup(`<strong>${resultado.rotulo}</strong><br><span style="color:#64748b">${formatarCoordenadas(resultado.latitude, resultado.longitude)}</span>`)
        .openPopup()
    })
  }

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
      <div className="relative">
        <div ref={containerRef} className="h-64 w-full rounded-xl overflow-hidden z-0 relative" data-testid="mapa-roteiro" />
        <div className="absolute top-2 right-2 z-[1000] w-64" data-testid="mapa-busca">
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              placeholder="Buscar cidade/endereço..."
              aria-label="Buscar local no mapa"
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 py-1.5 pl-8 pr-7 text-sm shadow-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {buscando && <Loader2 size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 animate-spin" />}
          </div>
          {resultados.length > 0 && (
            <ul className="mt-1 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg max-h-48 overflow-y-auto">
              {resultados.map((r, i) => (
                <li key={`${r.latitude}-${r.longitude}-${i}`}>
                  <button
                    type="button"
                    onClick={() => irPara(r)}
                    className="w-full text-left px-3 py-2 text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="block truncate">{r.rotulo}</span>
                    <span className="block text-[10px] text-slate-400">{formatarCoordenadas(r.latitude, r.longitude)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {foco && (
            <div className="mt-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 px-2.5 py-1.5">
              <p className="text-[10px] font-medium text-amber-800 dark:text-amber-300">{foco.rotulo}</p>
              <p className="text-[10px] text-amber-700 dark:text-amber-400">Coordenadas: {formatarCoordenadas(foco.latitude, foco.longitude)}</p>
            </div>
          )}
        </div>
      </div>
      {erro && <p className="text-xs text-slate-400">Não foi possível carregar o mapa do trajeto.</p>}
    </div>
  )
}