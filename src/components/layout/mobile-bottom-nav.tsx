"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import { LayoutDashboard, FileText, ClipboardList, User, Loader2 } from "lucide-react"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [paginaInicial, setPaginaInicial] = useState("/dashboard")

  useEffect(() => {
    fetch("/api/user/pagina-inicial")
      .then(r => r.json())
      .then(data => { if (data?.paginaInicial) setPaginaInicial(data.paginaInicial) })
      .catch(() => {})
  }, [])

  if (!session) return null

  const mobileNavItems = [
    { href: paginaInicial, icon: LayoutDashboard, label: "Home" },
    { href: "/dashboard/amostras", icon: ClipboardList, label: "Amostras Desenv." },
    { href: "/comercial/solicitacoes", icon: FileText, label: "Lista" },
    { href: "/perfil", icon: User, label: "Perfil" },
  ] as const

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
      <div className="flex justify-around py-2">
        {mobileNavItems.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-xl px-4 py-2 transition-colors ${
                isActive
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Icon size={22} />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
