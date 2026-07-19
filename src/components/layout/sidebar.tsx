"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { useState, useEffect } from "react"
import {
  Settings,
  X,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react"

interface MenuItem {
  id: number
  titulo: string
  url: string
}

interface UserMenu {
  id: number
  titulo: string
  itens: MenuItem[]
}

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role as string | undefined
  const isAdminOuSudo = role === "ADMIN" || role === "SUDO"

  const [menus, setMenus] = useState<UserMenu[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedMenus, setExpandedMenus] = useState<Set<number>>(new Set())
  const [paginaInicial, setPaginaInicial] = useState("/dashboard")

  useEffect(() => {
    fetch("/api/user/pagina-inicial")
      .then(r => r.json())
      .then(data => { if (data?.paginaInicial) setPaginaInicial(data.paginaInicial) })
      .catch(() => {})
    fetch("/api/user/menus")
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setMenus(data)
      })
      .catch(() => setMenus([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (menus.length === 0) return
    for (const menu of menus) {
      if (menu.itens.some((i: MenuItem) => pathname === i.url || pathname?.startsWith(i.url + "/"))) {
        setExpandedMenus(prev => new Set(prev).add(menu.id))
      }
    }
  }, [pathname, menus])

  function toggleMenu(id: number) {
    setExpandedMenus(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function isAtiva(url: string) {
    return pathname === url || pathname?.startsWith(url + "/")
  }

  return (
    <div className="flex h-full flex-col bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 px-6">
        <Link href={paginaInicial} className="flex items-center gap-2.5" onClick={onClose}>
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
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 size={18} className="animate-spin text-slate-400" />
          </div>
        ) : menus.length > 0 ? (
          menus.map(menu => {
            const menuActive = menu.itens.some((i: MenuItem) => isAtiva(i.url))
            const isExpanded = expandedMenus.has(menu.id)
            return (
              <div key={menu.id}>
                <button
                  onClick={() => toggleMenu(menu.id)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                    menuActive
                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                  }`}
                >
                  {isExpanded ? <ChevronDown size={16} className="shrink-0" /> : <ChevronRight size={16} className="shrink-0" />}
                  <span className="flex-1 text-left">{menu.titulo}</span>
                  {menuActive && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
                </button>
                {isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-slate-200 dark:border-slate-700 pl-2">
                    {menu.itens.map(item => (
                      <Link
                        key={item.id}
                        href={item.url}
                        onClick={onClose}
                        className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-all ${
                          isAtiva(item.url)
                            ? "text-blue-600 dark:text-blue-400 font-medium bg-blue-50/50 dark:bg-blue-950/30"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
                        {item.titulo}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="text-center py-8">
            <p className="text-xs text-slate-400">Nenhum menu configurado</p>
          </div>
        )}

        {menus.length > 0 && isAdminOuSudo && (
          <div className="pt-2 mt-2 border-t border-slate-100 dark:border-slate-800">
            <Link
              href="/admin/configuracoes"
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                isAtiva("/admin/configuracoes")
                  ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Settings size={18} className={isAtiva("/admin/configuracoes") ? "text-blue-600 dark:text-blue-400" : ""} />
              Configurações
              {isAtiva("/admin/configuracoes") && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />}
            </Link>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 dark:border-slate-800 p-4">
        <div className="rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
          <p className="text-xs text-slate-500 dark:text-slate-400">Versão 1.0.0</p>
          <p className="text-xs text-slate-400 dark:text-slate-500">© 2026 PDM·PRO·TÊXTIL | @devtiagoabreu · Todos os direitos reservados</p>
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
