"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, Edit3, ChevronDown, ChevronRight, Save } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Tela {
  id: string
  label: string
  href: string
  module: string
}

interface MenuItem {
  id?: number
  titulo: string
  url: string
  ordem: number
}

interface Menu {
  id?: number
  titulo: string
  icone?: string | null
  ordem: number
  itens: MenuItem[]
}

export default function ConfigurarMenusPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  const [telas, setTelas] = useState<Tela[]>([])
  const [menus, setMenus] = useState<Menu[]>([])
  const [loading, setLoading] = useState(true)
  const [paginaInicial, setPaginaInicial] = useState("")
  const [expandedMenu, setExpandedMenu] = useState<number | null>(null)
  const [editingMenuId, setEditingMenuId] = useState<number | null>(null)
  const [editingItemId, setEditingItemId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/user/menus").then(r => r.json()),
      fetch("/api/user/pagina-inicial").then(r => r.json()),
      fetch("/api/user/menus/todas-telas").then(r => r.json()),
    ]).then(([menusData, paginaData, telasData]) => {
      setMenus(Array.isArray(menusData) ? menusData : [])
      setPaginaInicial(paginaData.paginaInicial || "/dashboard")
      setTelas(Array.isArray(telasData) ? telasData : [])
    }).catch(() => toast.error("Erro ao carregar dados"))
      .finally(() => setLoading(false))
  }, [])

  async function salvarPaginaInicial() {
    setSaving(true)
    try {
      const res = await fetch("/api/user/pagina-inicial", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paginaInicial }),
      })
      if (!res.ok) throw new Error()
      toast.success("Página inicial atualizada")
    } catch {
      toast.error("Erro ao salvar página inicial")
    }
    setSaving(false)
  }

  async function criarMenu() {
    const titulo = prompt("Nome do menu:")
    if (!titulo?.trim()) return
    try {
      const res = await fetch("/api/user/menus", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: titulo.trim(), ordem: menus.length }),
      })
      if (!res.ok) throw new Error()
      const novo = await res.json()
      setMenus(prev => [...prev, { ...novo, itens: [] }])
      toast.success("Menu criado")
    } catch {
      toast.error("Erro ao criar menu")
    }
  }

  async function deletarMenu(id: number) {
    if (!confirm("Excluir este menu e todos os seus itens?")) return
    try {
      const res = await fetch(`/api/user/menus/${id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setMenus(prev => prev.filter(m => m.id !== id))
      toast.success("Menu excluído")
    } catch {
      toast.error("Erro ao excluir menu")
    }
  }

  async function salvarMenu(id: number) {
    const form = editForm[`menu-${id}`]
    if (!form?.titulo?.trim()) return
    try {
      const res = await fetch(`/api/user/menus/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setMenus(prev => prev.map(m => m.id === id ? { ...m, ...updated } : m))
      setEditingMenuId(null)
      toast.success("Menu atualizado")
    } catch {
      toast.error("Erro ao atualizar menu")
    }
  }

  async function criarItem(menuId: number) {
    const telaId = editForm[`novo-item-${menuId}`]
    if (!telaId) { toast.error("Selecione uma tela"); return }
    const tela = telas.find(t => t.id === telaId)
    if (!tela) return
    try {
      const res = await fetch(`/api/user/menus/${menuId}/itens`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo: tela.label, url: tela.href, ordem: 0 }),
      })
      if (!res.ok) throw new Error()
      const item = await res.json()
      setMenus(prev => prev.map(m => m.id === menuId ? { ...m, itens: [...m.itens, item] } : m))
      setEditForm(prev => ({ ...prev, [`novo-item-${menuId}`]: "" }))
      toast.success("Item adicionado")
    } catch {
      toast.error("Erro ao adicionar item")
    }
  }

  async function deletarItem(menuId: number, itemId: number) {
    if (!confirm("Excluir este item?")) return
    try {
      const res = await fetch(`/api/user/menus/${menuId}/itens/${itemId}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      setMenus(prev => prev.map(m => m.id === menuId ? { ...m, itens: m.itens.filter(i => i.id !== itemId) } : m))
      toast.success("Item excluído")
    } catch {
      toast.error("Erro ao excluir item")
    }
  }

  async function salvarItem(menuId: number, itemId: number) {
    const form = editForm[`item-${itemId}`]
    if (!form?.titulo?.trim() || !form?.url?.trim()) return
    try {
      const res = await fetch(`/api/user/menus/${menuId}/itens/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error()
      const updated = await res.json()
      setMenus(prev => prev.map(m => m.id === menuId ? { ...m, itens: m.itens.map(i => i.id === itemId ? { ...i, ...updated } : i) } : m))
      setEditingItemId(null)
      toast.success("Item atualizado")
    } catch {
      toast.error("Erro ao atualizar item")
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Menu de Navegação{info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Personalize os menus e a página inicial do seu nav
        </p>
      </div>

      {/* Página Inicial */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">Página Inicial</h2>
        <div className="flex items-end gap-3">
          <div className="flex-1 space-y-2">
            <Label>Escolha a tela que abre ao clicar no logo ou na home</Label>
            <Select value={paginaInicial} onValueChange={(v: string | null) => { if (v) setPaginaInicial(v) }}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a página inicial" />
              </SelectTrigger>
              <SelectContent>
                {telas.map(t => (
                  <SelectItem key={t.id} value={t.href}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={salvarPaginaInicial} disabled={saving} className="gap-2">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            Salvar
          </Button>
        </div>
      </div>

      {/* Menus */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Menus</h2>
          <Button onClick={criarMenu} size="sm" className="gap-1">
            <Plus size={14} />
            Novo Menu
          </Button>
        </div>

        {menus.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            Nenhum menu criado. Clique em "Novo Menu" para começar.
          </p>
        ) : (
          <div className="space-y-3">
            {menus.map((menu, idx) => (
              <div key={menu.id} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                {/* Cabeçalho do Menu */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => setExpandedMenu(expandedMenu === menu.id ? null : menu.id!)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {expandedMenu === menu.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                    {editingMenuId === menu.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <Input
                          value={editForm[`menu-${menu.id}`]?.titulo || ""}
                          onChange={e => setEditForm(prev => ({ ...prev, [`menu-${menu.id}`]: { ...prev[`menu-${menu.id}`], titulo: e.target.value } }))}
                          className="h-8 text-sm max-w-xs"
                          placeholder="Título do menu"
                        />
                        <Button size="sm" variant="ghost" onClick={() => salvarMenu(menu.id!)} className="h-8">
                          <Save size={14} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingMenuId(null)} className="h-8">
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{menu.titulo}</span>
                        <span className="text-xs text-slate-400">{menu.itens.length} item(ns)</span>
                      </>
                    )}
                  </div>
                  {editingMenuId !== menu.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setEditingMenuId(menu.id!)
                          setEditForm(prev => ({ ...prev, [`menu-${menu.id}`]: { titulo: menu.titulo, icone: menu.icone, ordem: menu.ordem } }))
                        }}
                        className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        onClick={() => deletarMenu(menu.id!)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Itens */}
                {expandedMenu === menu.id && (
                  <div className="px-4 py-3 space-y-2">
                    {menu.itens.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-3 pl-6 py-1.5">
                        {editingItemId === `item-${item.id}` ? (
                          <div className="flex items-center gap-2 flex-1">
                            <Input
                              value={editForm[`item-${item.id}`]?.titulo || ""}
                              onChange={e => setEditForm(prev => ({ ...prev, [`item-${item.id}`]: { ...prev[`item-${item.id}`], titulo: e.target.value } }))}
                              className="h-8 text-sm max-w-[200px]"
                              placeholder="Título"
                            />
                            <Input
                              value={editForm[`item-${item.id}`]?.url || ""}
                              onChange={e => setEditForm(prev => ({ ...prev, [`item-${item.id}`]: { ...prev[`item-${item.id}`], url: e.target.value } }))}
                              className="h-8 text-sm flex-1 font-mono"
                              placeholder="/url"
                            />
                            <Button size="sm" variant="ghost" onClick={() => salvarItem(menu.id!, item.id!)} className="h-8">
                              <Save size={14} />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditingItemId(null)} className="h-8">
                              Cancelar
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              <span className="text-sm text-slate-700 dark:text-slate-300">{item.titulo}</span>
                              <span className="text-xs text-slate-400 font-mono truncate">{item.url}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setEditingItemId(`item-${item.id}`)
                                  setEditForm(prev => ({ ...prev, [`item-${item.id}`]: { titulo: item.titulo, url: item.url, ordem: item.ordem } }))
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 rounded"
                              >
                                <Edit3 size={12} />
                              </button>
                              <button
                                onClick={() => deletarItem(menu.id!, item.id!)}
                                className="p-1 text-slate-400 hover:text-red-600 rounded"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}

                    {/* Adicionar novo item */}
                    <div className="flex items-center gap-2 pl-6 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex-1">
                        <Select
                          value={editForm[`novo-item-${menu.id}`] || ""}
                          onValueChange={(v: string | null) => {
                            if (v) setEditForm(prev => ({ ...prev, [`novo-item-${menu.id}`]: v }))
                          }}
                        >
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Selecionar tela..." />
                          </SelectTrigger>
                          <SelectContent>
                            {telas.map(t => (
                              <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => criarItem(menu.id!)} className="h-8 gap-1">
                        <Plus size={12} />
                        Adicionar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
