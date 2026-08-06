"use client"

import { BarChart3, Layers, Package, UserCheck, Users } from "lucide-react"

export type BiTabId = "dashboard" | "produto" | "grupo" | "representantes" | "clientes"

const TABS: { id: BiTabId; label: string; icon: any }[] = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "representantes", label: "Representantes", icon: Users },
  { id: "clientes", label: "Clientes", icon: UserCheck },
  { id: "produto", label: "Consulta por Produto", icon: Package },
  { id: "grupo", label: "Consulta por Artigo", icon: Layers },
]

interface Props {
  activeTab: BiTabId
  setActiveTab: (tab: BiTabId) => void
}

export function TabsNav({ activeTab, setActiveTab }: Props) {
  return (
    <div className="flex gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-1">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === tab.id
              ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400"
              : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
          }`}
        >
          <tab.icon className="w-4 h-4 inline mr-2" />
          {tab.label}
        </button>
      ))}
    </div>
  )
}
