"use client"

import { useEffect, useRef, useState } from "react"
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BarcodeScannerProps {
  onDetected: (value: string) => void
  onClose: () => void
}

type Status = "starting" | "scanning" | "error"

export function BarcodeScanner({ onDetected, onClose }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const controlsRef = useRef<IScannerControls | null>(null)
  const [status, setStatus] = useState<Status>("starting")
  const [error, setError] = useState("")
  const stoppedRef = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function start() {
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setStatus("error")
        setError("Seu dispositivo não suporta acesso à câmera. Digite o número da OP manualmente.")
        return
      }
      try {
        const reader = new BrowserMultiFormatReader()
        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: { ideal: "environment" } } },
          videoRef.current!,
          (result) => {
            if (result && !stoppedRef.current) {
              onDetected(result.getText())
            }
          },
        )
        controlsRef.current = controls
        if (!cancelled) setStatus("scanning")
      } catch (err) {
        if (!cancelled) {
          setStatus("error")
          setError(
            "Não foi possível acessar a câmera. Verifique as permissões ou digite a OP manualmente.",
          )
          console.error("Erro ao iniciar câmera:", err)
        }
      }
    }

    start()

    return () => {
      cancelled = true
      stoppedRef.current = true
      controlsRef.current?.stop()
      if (videoRef.current?.srcObject && "getTracks" in videoRef.current.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach((t: MediaStreamTrack) => t.stop())
      }
    }
  }, [onDetected])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            Ler código de barras da OP
          </h2>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          {status === "starting" && (
            <div className="aspect-[4/3] rounded-xl bg-slate-100 dark:bg-slate-800 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-slate-400" size={28} />
              <p className="text-sm text-slate-500">Iniciando câmera…</p>
            </div>
          )}

          {status === "scanning" && (
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-900">
              <video ref={videoRef} className="h-full w-full object-cover" muted playsInline />
              <div className="pointer-events-none absolute inset-x-8 top-1/2 h-1 -translate-y-1/2 rounded bg-red-500/80 shadow-[0_0_12px_2px_rgba(239,68,68,0.8)]" />
            </div>
          )}

          {status === "error" && (
            <div className="aspect-[4/3] rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center px-6 text-center text-sm text-slate-500">
              {error}
            </div>
          )}

          <div className="mt-3 text-xs text-slate-500 dark:text-slate-400 text-center">
            Aponte a câmera para o código de barras da OP. A leitura é automática.
          </div>
        </div>

        <div className="px-4 pb-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  )
}
