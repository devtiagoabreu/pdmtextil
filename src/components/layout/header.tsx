"use client"

import { useState } from "react"
import { signOut, useSession } from "next-auth/react"
import { Bell, Search, Menu, User, LogOut, Settings } from "lucide-react"
import { ThemeToggle } from "./theme-toggle"

interface HeaderProps {
  onMenuClick?: () => void
}

const notifications = [
  { id: 1, title: "Nova solicitação #125", time: "5 min atrás", read: false },
  { id: 2, title: "Solicitação #124 aprovada", time: "1 hora atrás", read: false },
]

export function Header({ onMenuClick }: HeaderProps) {
  const { data: session } = useSession()
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:border-slate-800 dark:bg-slate-950/95 px-4 md:px-6">
      {/* LEFT: Menu button + Search */}
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div className="hidden md:flex items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Buscar..."
              className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-4 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
            />
          </div>
        </div>
      </div>

      {/* RIGHT: Theme, Notifications, User */}
      <div className="flex items-center gap-2">
        <ThemeToggle />

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false) }}
            className="relative rounded-md p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-xl border bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 animate-fade-in z-50">
              <div className="border-b p-3 font-semibold text-sm dark:border-slate-700 flex items-center justify-between">
                <span>Notificações</span>
                {unreadCount > 0 && (
                  <span className="text-xs bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 rounded-full px-2 py-0.5">
                    {unreadCount} novas
                  </span>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto divide-y dark:divide-slate-800">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                      !n.read ? "bg-blue-50/60 dark:bg-blue-950/30" : ""
                    }`}
                  >
                    {!n.read && (
                      <span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-2 mb-0.5" />
                    )}
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{n.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{n.time}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false) }}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 font-semibold text-sm">
              {session?.user?.name?.charAt(0) || "U"}
            </div>
            <span className="hidden text-sm font-medium md:block text-slate-700 dark:text-slate-200">
              {session?.user?.name}
            </span>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-xl border bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900 animate-fade-in z-50">
              <div className="border-b p-3 dark:border-slate-700">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{session?.user?.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{session?.user?.email}</p>
                <span className="mt-1.5 inline-block rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 text-xs font-medium">
                  {session?.user?.role}
                </span>
              </div>
              <div className="p-2">
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                  <User size={16} />
                  Meu Perfil
                </button>
                <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
                  <Settings size={16} />
                  Configurações
                </button>
                <hr className="my-1 dark:border-slate-700" />
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 transition-colors"
                >
                  <LogOut size={16} />
                  Sair
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
