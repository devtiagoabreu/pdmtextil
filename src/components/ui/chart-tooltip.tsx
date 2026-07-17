"use client"

import { useEffect, useState } from "react"

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color?: string }>
  label?: string
  formatter?: (value: number, name: string) => string
}

export function ChartTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (active) {
      setIsVisible(true)
    } else {
      const timer = setTimeout(() => setIsVisible(false), 100)
      return () => clearTimeout(timer)
    }
  }, [active])

  if (!isVisible || !payload?.length) return null

  return (
    <div
      className={`rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2.5 shadow-xl text-xs transition-all duration-150 ease-out ${
        active ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-1"
      }`}
      style={{ backdropFilter: "blur(8px)" }}
    >
      {label && (
        <p className="font-medium text-slate-500 dark:text-slate-400 mb-1.5 pb-1 border-b border-slate-100 dark:border-slate-700">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry, i) => (
          <p
            key={i}
            className="flex items-center gap-2 text-slate-700 dark:text-slate-200"
            style={{ animationDelay: `${i * 30}ms` }}
          >
            {entry.color && (
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 ring-2 ring-white dark:ring-slate-800"
                style={{ backgroundColor: entry.color }}
              />
            )}
            <span className="text-slate-500 dark:text-slate-400">{entry.name}:</span>
            <span className="font-bold text-slate-900 dark:text-slate-50">
              {formatter ? formatter(entry.value, entry.name) : entry.value}
            </span>
          </p>
        ))}
      </div>
    </div>
  )
}
