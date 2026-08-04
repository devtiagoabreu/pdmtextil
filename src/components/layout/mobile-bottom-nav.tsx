"use client"

import { NavLink } from "@/components/ui/nav-link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useQuery } from "@tanstack/react-query"
import { LayoutDashboard, Calendar, List, User, Loader2 } from "lucide-react"

export function MobileBottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const { data: paginaInicialData } = useQuery<{ paginaInicial: string }>({
    queryKey: ["user-pagina-inicial"],
    queryFn: () => fetch("/api/user/pagina-inicial").then((r: any) => r.json()),
  })

  const paginaInicial = paginaInicialData?.paginaInicial || "/dashboard"

  if (!session) return null

  const mobileNavItems = [
    { href: paginaInicial, icon: LayoutDashboard, label: "Início" },
    { href: "/comercial/crm/visitas/novo", icon: Calendar, label: "Nova Visita" },
    { href: "/comercial/crm/visitas", icon: List, label: "Agenda" },
    { href: "/perfil", icon: User, label: "Perfil" },
  ] as const

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
      <div className="flex justify-around py-2">
        {mobileNavItems.map((item: any) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <NavLink
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
            </NavLink>
          )
        })}
      </div>
    </div>
  )
}
