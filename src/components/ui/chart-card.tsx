"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"

interface ChartCardProps {
  children: ReactNode
  title?: string
  className?: string
  delay?: number
}

export function ChartCard({ children, title, className = "", delay = 0 }: ChartCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setVisible(true), delay)
          obs.disconnect()
        }
      },
      { threshold: 0.01, rootMargin: "50px" },
    )
    obs.observe(el)

    return () => obs.disconnect()
  }, [delay])

  return (
    <div
      ref={ref}
      className={`rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 ${
        visible ? "animate-chart-in chart-hover-effect" : "opacity-0" }
      } ${className}`}
    >
      {title && (
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">{title}</h3>
      )}
      {children}
    </div>
  )
}
