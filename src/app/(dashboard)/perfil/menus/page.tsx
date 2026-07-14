"use client"

import { useState, useEffect, useCallback } from "react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, Plus, Trash2, Edit3, ChevronDown, ChevronRight, Save, GripVertical, Copy } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DndContext, PointerSensor, useSensor, useSensors, closestCenter } from "@dnd-kit/core"
import { SortableContext, useSortable, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable"

interface Tela {
  id: string
  label: string
  href: string
  module: string
}

interface MenuItem {
  id: number
  titulo: string
  url: string
  ordem: number
}

interface Menu {
  id: number
  titulo: string
  icone?: string | null
  ordem: number
  itens: MenuItem[]
}

function SortableMenu({
  menu,
  isExpanded,
  isEditing,
  editValue,
  onToggle,
  onStartEdit,
  onDelete,
  onChangeEdit,
  onSave,
  onCancelEdit,
  children,
}: {
  menu: Menu
  isExpanded: boolean
  isEditing: boolean
  editValue: string
  onToggle: () => void
  onStartEdit: () => void
  onDelete: () => void
  onChangeEdit: (v: string) => void
  onSave: () => void
  onCancelEdit: () => void
  children: React.ReactNode
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: menu.id })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: transition || undefined,
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden ${isDragging ? "shadow-lg" : ""}`}
      {...attributes}
    >
      {/* Cabeçalho do Menu */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 touch-none"
            {...listeners}
          >
            <GripVertical size={16} />
          </button>
          <button
            onClick={onToggle}
            className="text-slate-400 hover:text-slate-600"
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editValue}
                onChange={e => onChangeEdit(e.target.value)}
                className="h-8 text-sm max-w-xs"
                placeholder="Título do menu"
                autoFocus
              />
              <Button size="sm" variant="ghost" onClick={onSave} className="h-8">
                <Save size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-8">
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
        {!isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={onStartEdit}
              className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-slate-400 hover:text-red-600 rounded"
            >
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>

      {children}
    </div>
  )
}

function SortableItem({
  item,
  menuId,
  isEditing,
  editTitulo,
  editUrl,
  onChangeTitulo,
  onChangeUrl,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: {
  item: MenuItem
  menuId: number
  isEditing: boolean
  editTitulo: string
  editUrl: string
  onChangeTitulo: (v: string) => void
  onChangeUrl: (v: string) => void
  onStartEdit: () => void
  onSaveEdit: () => void
  onCancelEdit: () => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: transition || undefined,
    opacity: isDragging ? 0.4 : 1,
    position: "relative" as const,
    zIndex: isDragging ? 10 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between gap-3 py-1.5 ${isDragging ? "shadow-lg" : ""}`}
      {...attributes}
    >
      <button
        className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-600 touch-none"
        {...listeners}
      >
        <GripVertical size={14} />
      </button>
      {isEditing ? (
        <div className="flex items-center gap-2 flex-1">
          <Input
            value={editTitulo}
            onChange={e => onChangeTitulo(e.target.value)}
            className="h-8 text-sm max-w-[200px]"
            placeholder="Título"
          />
          <Input
            value={editUrl}
            onChange={e => onChangeUrl(e.target.value)}
            className="h-8 text-sm flex-1 font-mono"
            placeholder="/url"
          />
          <Button size="sm" variant="ghost" onClick={onSaveEdit} className="h-8">
            <Save size={14} />
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-8">
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
              onClick={onStartEdit}
              className="p-1 text-slate-400 hover:text-blue-600 rounded"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={onDelete}
              className="p-1 text-slate-400 hover:text-red-600 rounded"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </>
      )}
    </div>
  )
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
  const [reordering, setReordering] = useState(false)
  const [showCopyDialog, setShowCopyDialog] = useState(false)
  const [usuarios, setUsuarios] = useState<{ id: number; name: string }[]>([])
  const [selectedUsuarioId, setSelectedUsuarioId] = useState<number | null>(null)
  const [copying, setCopying] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

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

  async function abrirCopyDialog() {
    setCopying(false)
    setSelectedUsuarioId(null)
    const res = await fetch("/api/user/menus/usuarios")
    if (res.ok) {
      const data = await res.json()
      setUsuarios(Array.isArray(data) ? data : [])
    }
    setShowCopyDialog(true)
  }

  async function copiarMenus() {
    if (!selectedUsuarioId) return
    setCopying(true)
    try {
      const res = await fetch("/api/user/menus/copiar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ origemUsuarioId: selectedUsuarioId }),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error || "Erro ao copiar menus")
        return
      }
      const data = await res.json()
      if (Array.isArray(data)) setMenus(data)
      setShowCopyDialog(false)
      toast.success("Menus copiados com sucesso")
    } catch {
      toast.error("Erro ao copiar menus")
    }
    setCopying(false)
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
      const data = await fetch("/api/user/menus").then(r => r.json())
      if (Array.isArray(data)) setMenus(data)
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
      const data = await fetch("/api/user/menus").then(r => r.json())
      if (Array.isArray(data)) setMenus(data)
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

  async function handleMenuDragEnd(event: { active: any; over: any }) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = menus.findIndex(m => m.id === active.id)
    const newIndex = menus.findIndex(m => m.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    setReordering(true)

    const reordered = arrayMove(menus, oldIndex, newIndex)
    setMenus(reordered)

    try {
      const res = await fetch("/api/user/menus/reorder", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map(m => m.id) }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (Array.isArray(data)) setMenus(data)
    } catch {
      toast.error("Erro ao reordenar menus")
      setMenus(arrayMove(reordered, newIndex, oldIndex))
    }

    setReordering(false)
  }

  async function handleItemDragEnd(event: { active: any; over: any }, menuId: number) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const menu = menus.find(m => m.id === menuId)
    if (!menu) return

    const oldIndex = menu.itens.findIndex(i => i.id === active.id)
    const newIndex = menu.itens.findIndex(i => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(menu.itens, oldIndex, newIndex)
    setMenus(prev => prev.map(m => m.id === menuId ? { ...m, itens: reordered } : m))

    try {
      const res = await fetch(`/api/user/menus/${menuId}/itens/reorder`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: reordered.map(i => i.id) }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      if (Array.isArray(data)) {
        setMenus(prev => prev.map(m => m.id === menuId ? { ...m, itens: data } : m))
      }
    } catch {
      toast.error("Erro ao reordenar itens")
      setMenus(prev => prev.map(m => m.id === menuId ? { ...m, itens: arrayMove(reordered, newIndex, oldIndex) } : m))
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
          Personalize os menus e a página inicial do seu nav. Arraste os itens para reordenar.
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
          <div className="flex items-center gap-2">
            <Button onClick={abrirCopyDialog} size="sm" variant="outline" className="gap-1" disabled={reordering}>
              <Copy size={14} />
              Copiar menus
            </Button>
            <Button onClick={criarMenu} size="sm" className="gap-1" disabled={reordering}>
              <Plus size={14} />
              Novo Menu
            </Button>
          </div>
        </div>

        {menus.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-8">
            Nenhum menu criado. Clique em &ldquo;Novo Menu&rdquo; para começar.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleMenuDragEnd}
          >
            <SortableContext items={menus.map(m => m.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {menus.map(menu => (
                  <SortableMenu
                    key={menu.id}
                    menu={menu}
                    isExpanded={expandedMenu === menu.id}
                    isEditing={editingMenuId === menu.id}
                    editValue={editForm[`menu-${menu.id}`]?.titulo || ""}
                    onToggle={() => setExpandedMenu(expandedMenu === menu.id ? null : menu.id)}
                    onStartEdit={() => {
                      setEditingMenuId(menu.id)
                      setEditForm(prev => ({ ...prev, [`menu-${menu.id}`]: { titulo: menu.titulo, icone: menu.icone, ordem: menu.ordem } }))
                    }}
                    onDelete={() => deletarMenu(menu.id)}
                    onChangeEdit={v => setEditForm(prev => ({ ...prev, [`menu-${menu.id}`]: { ...prev[`menu-${menu.id}`], titulo: v } }))}
                    onSave={() => salvarMenu(menu.id)}
                    onCancelEdit={() => setEditingMenuId(null)}
                  >
                    {/* Itens */}
                    {expandedMenu === menu.id && (
                      <div className="px-4 py-3 space-y-2">
                        <DndContext
                          sensors={sensors}
                          collisionDetection={closestCenter}
                          onDragEnd={(event) => handleItemDragEnd(event, menu.id)}
                        >
                          <SortableContext items={menu.itens.map(i => i.id)} strategy={verticalListSortingStrategy}>
                            {menu.itens.map(item => (
                              <SortableItem
                                key={item.id}
                                item={item}
                                menuId={menu.id}
                                isEditing={editingItemId === `item-${item.id}`}
                                editTitulo={editForm[`item-${item.id}`]?.titulo || ""}
                                editUrl={editForm[`item-${item.id}`]?.url || ""}
                                onChangeTitulo={v => setEditForm(prev => ({ ...prev, [`item-${item.id}`]: { ...prev[`item-${item.id}`], titulo: v } }))}
                                onChangeUrl={v => setEditForm(prev => ({ ...prev, [`item-${item.id}`]: { ...prev[`item-${item.id}`], url: v } }))}
                                onStartEdit={() => {
                                  setEditingItemId(`item-${item.id}`)
                                  setEditForm(prev => ({ ...prev, [`item-${item.id}`]: { titulo: item.titulo, url: item.url, ordem: item.ordem } }))
                                }}
                                onSaveEdit={() => salvarItem(menu.id, item.id)}
                                onCancelEdit={() => setEditingItemId(null)}
                                onDelete={() => deletarItem(menu.id, item.id)}
                              />
                            ))}
                          </SortableContext>
                        </DndContext>

                        {/* Adicionar novo item */}
                        <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
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
                          <Button size="sm" variant="outline" onClick={() => criarItem(menu.id)} className="h-8 gap-1">
                            <Plus size={12} />
                            Adicionar
                          </Button>
                        </div>
                      </div>
                    )}
                  </SortableMenu>
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* Dialog Copiar Menus */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Copiar menus de outro usuário</DialogTitle>
            <DialogDescription>
              Selecione um usuário para copiar todos os menus e itens. Os menus atuais serão substituídos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <Label>Usuário de origem</Label>
            <Select
              value={selectedUsuarioId?.toString() || ""}
              onValueChange={(v) => setSelectedUsuarioId(v ? parseInt(v) : null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um usuário..." />
              </SelectTrigger>
              <SelectContent>
                {usuarios.map(u => (
                  <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" disabled={copying} onClick={() => setShowCopyDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={copiarMenus} disabled={!selectedUsuarioId || copying} className="gap-2">
              {copying ? <Loader2 size={14} className="animate-spin" /> : <Copy size={14} />}
              Copiar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
