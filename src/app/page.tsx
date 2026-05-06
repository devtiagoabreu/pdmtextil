"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { ArrowRight, Factory, ShoppingCart, Settings, PenTool } from "lucide-react"

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    let animationId: number
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener("resize", resize)

    const cols = 40
    const rows = 25
    const cellW = canvas.width / cols
    const cellH = canvas.height / rows

    const threads: { x: number; y: number; speed: number; type: "v" | "h"; phase: number }[] = []

    for (let i = 0; i < cols + rows; i++) {
      if (i < cols) {
        threads.push({
          x: i * cellW,
          y: Math.random() * canvas.height,
          speed: 0.5 + Math.random() * 0.5,
          type: "v",
          phase: Math.random() * Math.PI * 2,
        })
      } else {
        threads.push({
          x: Math.random() * canvas.width,
          y: (i - cols) * cellH,
          speed: 0.3 + Math.random() * 0.3,
          type: "h",
          phase: Math.random() * Math.PI * 2,
        })
      }
    }

    const draw = () => {
      ctx.fillStyle = "#0a0a0f"
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      time += 0.016

      const activeThreads = threads.filter((t) => {
        if (t.type === "v") {
          return Math.sin(time * t.speed + t.phase) > 0
        } else {
          return Math.cos(time * t.speed + t.phase) > 0
        }
      })

      activeThreads.forEach((thread) => {
        const alpha = 0.15 + Math.sin(time * 2 + thread.phase) * 0.1
        ctx.strokeStyle = `rgba(100, 120, 180, ${alpha})`
        ctx.lineWidth = 1

        if (thread.type === "v") {
          ctx.beginPath()
          ctx.moveTo(thread.x, 0)
          ctx.lineTo(thread.x, canvas.height)
          ctx.stroke()

          const waveY = Math.sin(time * 2 + thread.x * 0.01) * 20
          for (let y = 0; y < canvas.height; y += 60) {
            ctx.beginPath()
            ctx.arc(thread.x, y + waveY, 2, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(100, 140, 200, ${alpha + 0.2})`
            ctx.fill()
          }
        } else {
          ctx.beginPath()
          ctx.moveTo(0, thread.y)
          ctx.lineTo(canvas.width, thread.y)
          ctx.stroke()

          const waveX = Math.cos(time * 2 + thread.y * 0.01) * 30
          for (let x = 0; x < canvas.width; x += 80) {
            ctx.beginPath()
            ctx.arc(x + waveX, thread.y, 2, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(120, 160, 220, ${alpha + 0.2})`
            ctx.fill()
          }
        }
      })

      const intersections: { x: number; y: number }[] = []
      activeThreads.forEach((t1) => {
        activeThreads.forEach((t2) => {
          if (t1.type !== t2.type) {
            let ix: number, iy: number
            if (t1.type === "v" && t2.type === "h") {
              ix = t1.x
              iy = t2.y
            } else {
              ix = t2.x
              iy = t1.y
            }
            if (ix > 0 && ix < canvas.width && iy > 0 && iy < canvas.height) {
              intersections.push({ x: ix, y: iy })
            }
          }
        })
      })

      intersections.forEach((point, i) => {
        const pulse = Math.sin(time * 3 + i * 0.1) * 0.5 + 0.5
        ctx.beginPath()
        ctx.arc(point.x, point.y, 2 + pulse * 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(150, 180, 230, ${0.3 + pulse * 0.4})`
        ctx.fill()
      })

      animationId = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener("resize", resize)
    }
  }, [])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      <div className="relative z-10 min-h-screen flex flex-col">
        <header className="px-8 py-6 flex justify-between items-center">
          <div className="text-xl font-light tracking-[0.2em] text-slate-300">
            PDM <span className="font-bold text-white">PRO TEXTIL</span>
          </div>
          <Link
            href="/login"
            className="px-5 py-2 text-sm text-slate-300 hover:text-white transition-colors border border-slate-600 hover:border-slate-400 rounded"
          >
            Login
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center px-6">
          <div className="text-center max-w-2xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 tracking-tight">
              PDM Pro Têxtil
            </h1>
            <p className="text-sm text-slate-400 mb-6 font-light max-w-xl mx-auto">
             PDM - Sistema de gestão de desenvolvimento de produtos têxteis que conecta os departamentos Comercial, Desenvolvimento (Tecelagem e Beneficiamento) e PCP, centralizando solicitações, fichas técnicas, receitas e roteiros de produção.
            </p>
            <p className="text-xl text-slate-500 mb-12 font-light">
              Sistema integrado de gestão para indústria têxtil
            </p>

            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-black font-medium rounded-lg hover:bg-slate-200 transition-colors"
            >
              Acessar Sistema
              <ArrowRight size={18} />
            </Link>

            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                <Factory className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <div className="text-lg font-bold text-slate-200">PCP</div>
                <div className="text-xs text-slate-500 mt-1">Planejamento</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                <ShoppingCart className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <div className="text-lg font-bold text-slate-200">COM</div>
                <div className="text-xs text-slate-500 mt-1">Comercial</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                <PenTool className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <div className="text-lg font-bold text-slate-200">DES</div>
                <div className="text-xs text-slate-500 mt-1">Desenvolvimento</div>
              </div>
              <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800">
                <Settings className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                <div className="text-lg font-bold text-slate-200">ADM</div>
                <div className="text-xs text-slate-500 mt-1">Admin</div>
              </div>
            </div>
          </div>
        </main>

        <footer className="px-8 py-4 text-center">
          <p className="text-xs text-slate-600">
            © 2026 Pro Moda Têxtil · Todos os direitos reservados
          </p>
        </footer>
      </div>
    </div>
  )
}