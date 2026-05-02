"use client"

import { useTheme } from "next-themes"
import { Moon, Sun, Monitor } from "lucide-react"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  if (!mounted) return null

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
      <button
        onClick={() => setTheme("light")}
        className={`p-1.5 rounded-md transition-all ${
          theme === "light"
            ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
        }`}
        title="Modo Claro"
      >
        <Sun size={16} />
      </button>
      <button
        onClick={() => setTheme("dark")}
        className={`p-1.5 rounded-md transition-all ${
          theme === "dark"
            ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
        }`}
        title="Modo Escuro"
      >
        <Moon size={16} />
      </button>
      <button
        onClick={() => setTheme("system")}
        className={`p-1.5 rounded-md transition-all ${
          theme === "system"
            ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600"
            : "text-slate-500 hover:text-slate-700 dark:text-slate-400"
        }`}
        title="Preferência do sistema"
      >
        <Monitor size={16} />
      </button>
    </div>
  )
}
