"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import Link from "next/link"
import {
  ArrowRight,
  Factory,
  Settings,
  PenTool,
  ShoppingCart,
  Users,
  Wrench,
} from "lucide-react"

const PDM_TOOLTIP =
  "PDM·PRO·TÊXTIL — Ferramenta de integração para a indústria têxtil. Conecta ferramentas legadas (ERP, planilhas e sistemas antigos) às tecnologias atuais por APIs e integrações, com foco no desenvolvimento de produtos antes do pedido. A parte de vendas é o CRM — o PDM não substitui o ERP comercial."

const DEPARTMENTS = [
  {
    icon: Factory,
    abbr: "PCP",
    label: "Planejamento",
    phrase: "Acompanhe a produção do produto em desenvolvimento, do cru ao acabado",
  },
  {
    icon: ShoppingCart,
    abbr: "COM",
    label: "Comercial",
    phrase: "Recebe as solicitações de desenvolvimento e organiza clientes e pedidos",
  },
  {
    icon: Users,
    abbr: "CRM",
    label: "CRM",
    phrase: "Relacionamento, propostas e visitas que geram novas demandas",
  },
  {
    icon: PenTool,
    abbr: "DES",
    label: "Desenvolvimento",
    phrase: "O coração do PDM: fichas técnicas, receitas e amostras antes do pedido",
  },
  {
    icon: Settings,
    abbr: "ADM",
    label: "Admin",
    phrase: "Usuários, permissões, menus e configurações centralizadas",
  },
  {
    icon: Wrench,
    abbr: "FER",
    label: "Ferramentas",
    phrase: "Ferramentas personalizadas para cada tipo de negócio",
  },
]

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [tooltipAbove, setTooltipAbove] = useState(true)

  const checkPosition = useCallback(() => {
    if (tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect()
      setTooltipAbove(rect.top >= 10)
    }
  }, [])

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

      const activeThreads = threads.filter((t: any) => {
        if (t.type === "v") {
          return Math.sin(time * t.speed + t.phase) > 0
        } else {
          return Math.cos(time * t.speed + t.phase) > 0
        }
      })

      activeThreads.forEach((thread: any) => {
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
      activeThreads.forEach((t1: any) => {
        activeThreads.forEach((t2: any) => {
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

      intersections.forEach((point: any, i: any) => {
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

  useEffect(() => {
    if (showTooltip) setTimeout(checkPosition, 50)
  }, [showTooltip, checkPosition])

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0a0a0f]">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 h-full w-full" aria-hidden="true" />

      <div className="relative z-10 flex min-h-screen flex-col">
        <header className="flex items-center justify-between px-6 py-6 md:px-8">
          <div className="text-xl font-bold tracking-wide text-white">PDM·PRO·TÊXTIL</div>
          <nav className="flex items-center gap-3">
            <Link
              href="/sobre"
              className="rounded border border-slate-600 px-5 py-2 text-sm text-slate-300 transition-colors hover:border-slate-400 hover:text-white"
            >
              Sobre
            </Link>
            <Link
              href="/login"
              className="rounded border border-slate-600 px-5 py-2 text-sm text-slate-300 transition-colors hover:border-slate-400 hover:text-white"
            >
              Login
            </Link>
          </nav>
        </header>

        <main className="flex flex-1 items-center justify-center px-6">
          <div className="max-w-2xl text-center">
            <div className="relative mb-4 inline-block">
              <h1
                className="cursor-default text-5xl font-bold tracking-tight text-white md:text-7xl"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                PDM·PRO·TÊXTIL
              </h1>
              {showTooltip && (
                <div
                  ref={tooltipRef}
                  className={`absolute left-1/2 -translate-x-1/2 whitespace-pre-wrap rounded-lg border border-slate-700 bg-slate-900/90 px-4 py-3 text-sm text-white max-w-md ${
                    tooltipAbove ? "bottom-full mb-3" : "top-full mt-3"
                  }`}
                >
                  {PDM_TOOLTIP}
                </div>
              )}
            </div>
            <p className="mb-8 inline-block rounded-lg border border-slate-800 bg-slate-900/50 px-4 py-2 text-xl font-light text-slate-400">
              Integração entre as ferramentas que você já usa e as tecnologias atuais
            </p>

            <div className="mb-12 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-lg bg-white px-8 py-4 font-medium text-black transition-colors hover:bg-slate-200"
              >
                Acessar Sistema
                <ArrowRight size={18} />
              </Link>
              <Link
                href="/sobre"
                className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-8 py-4 font-medium text-white transition-colors hover:border-slate-400 hover:bg-slate-900/50"
              >
                Sobre o PDM
                <ArrowRight size={18} />
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-6">
              {DEPARTMENTS.map((dept: any) => (
                <div
                  key={dept.abbr}
                  className="group relative cursor-default rounded-lg border border-slate-800 bg-slate-900/50 p-4 transition-all duration-300 hover:border-slate-600"
                >
                  <dept.icon className="mx-auto mb-2 h-8 w-8 text-slate-400 transition-colors group-hover:text-white" />
                  <div className="text-lg font-bold text-slate-200">{dept.abbr}</div>
                  <div className="mt-1 text-xs text-slate-500">{dept.label}</div>
                  <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                    {dept.phrase}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>

        <footer className="border-t border-slate-900 px-6 py-6 text-center md:px-8">
          <p className="text-xs text-slate-600">
            © 2026 PDM·PRO·TÊXTIL | @devtiagoabreu · Todos os direitos reservados
          </p>
        </footer>
      </div>
    </div>
  )
}
