"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  FileText,
  PlusCircle,
  Factory,
  Users,
  Settings,
  Database,
  X,
  Building2,
  Send,
  Shield,
  ClipboardList,
} from "lucide-react"

const adminItems = [
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/roles", label: "Perfis (Roles)", icon: Shield },
  { href: "/admin/email-massa", label: "Email em Massa", icon: Send },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings },
] as const

const baseNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/comercial/solicitacoes", label: "Solicitações", icon: FileText },
  { href: "/comercial/solicitacoes/nova", label: "Nova Solicitação", icon: PlusCircle },
  { href: "/comercial/clientes", label: "Clientes", icon: Building2 },
  { href: "/amostras", label: "Amostras", icon: ClipboardList },
  { href: "/cadastros", label: "Cadastros", icon: Database },
  { href: "/cadastros/produto-cru", label: "Produtos Cru", icon: Factory },
] as const

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === "ADMIN"
  const items = isAdmin ? [...baseNav, ...adminItems] : baseNav

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6">
        <Link href="/dashboard" className="flex items-center gap-2.5" onClick={onClose}>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
            <span className="text-sm font-bold text-white">PM</span>
          </div>
          <span className="text-base font-semibold text-slate-900 dark:text-slate-50">PDM Pro Moda</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600 lg:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4 scrollbar-hide">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isActive
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Icon size={18} className={isActive ? "text-blue-600 dark:text-blue-400" : ""} />
              {item.label}
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-4">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">Versão 1.0.0</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">© 2026 Pro Moda Têxtil</p>
        </div>
      </div>
    </div>
  )
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Desktop sidebar — always visible */}
      <aside className="hidden w-64 lg:flex flex-col h-screen fixed left-0 top-0 z-20">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
          <div className="fixed left-0 top-0 h-full w-72 animate-slide-in shadow-2xl">
            <SidebarContent onClose={onClose} />
          </div>
        </div>
      )}
    </>
  )
}
