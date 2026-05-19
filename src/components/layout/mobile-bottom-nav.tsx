"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { LayoutDashboard, FileText, PlusCircle, Package, User, Factory, Settings, Users, Send, ClipboardList } from "lucide-react"

const mobileNavItems = {
  COMERCIAL: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
    { href: "/comercial/solicitacoes", icon: FileText, label: "Solicitações" },
    { href: "/amostras", icon: ClipboardList, label: "Amostras" },
    { href: "/perfil", icon: User, label: "Perfil" },
  ],
  TECELAGEM: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
    { href: "/tecelagem/solicitacoes", icon: FileText, label: "Solicitações" },
    { href: "/amostras", icon: ClipboardList, label: "Amostras" },
    { href: "/perfil", icon: User, label: "Perfil" },
  ],
  BENEFICIAMENTO: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
    { href: "/beneficiamento/solicitacoes", icon: FileText, label: "Solicitações" },
    { href: "/amostras", icon: ClipboardList, label: "Amostras" },
    { href: "/perfil", icon: User, label: "Perfil" },
  ],
  DESENVOLVIMENTO: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
    { href: "/comercial/solicitacoes", icon: FileText, label: "Solicitações" },
    { href: "/amostras", icon: ClipboardList, label: "Amostras" },
    { href: "/perfil", icon: User, label: "Perfil" },
  ],
  PCP: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
    { href: "/pcp/solicitacoes", icon: FileText, label: "Solicitações" },
    { href: "/amostras", icon: ClipboardList, label: "Amostras" },
    { href: "/perfil", icon: User, label: "Perfil" },
  ],
  ADMIN: [
    { href: "/dashboard", icon: LayoutDashboard, label: "Início" },
    { href: "/comercial/solicitacoes", icon: FileText, label: "Solicitações" },
    { href: "/amostras", icon: ClipboardList, label: "Amostras" },
    { href: "/perfil", icon: User, label: "Perfil" },
  ],
} as const

type NavRole = keyof typeof mobileNavItems

export function MobileBottomNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = (session?.user?.role as NavRole) || "COMERCIAL"
  const items = mobileNavItems[role] || mobileNavItems.COMERCIAL

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95 lg:hidden">
      <div className="flex justify-around py-2">
        {items.map((item) => {
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
