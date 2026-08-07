import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { GripVertical, Plus, Minus, Save, Edit3, Trash2 } from "lucide-react"
import { ICONE_OPCOES, MenuIcone } from "@/lib/menu-icones"
import { useSortable } from "@dnd-kit/sortable"
import type { Menu } from "./types"

interface SortableMenuProps {
  menu: Menu
  isExpanded: boolean
  isEditing: boolean
  editValue: string
  editIcone: string
  onChangeEdit: (v: string) => void
  onChangeIcone: (v: string) => void
  onToggle: () => void
  onStartEdit: () => void
  onDelete: () => void
  onSave: () => void
  onCancelEdit: () => void
  children: React.ReactNode
}

export function SortableMenu({
  menu,
  isExpanded,
  isEditing,
  editValue,
  editIcone,
  onChangeEdit,
  onChangeIcone,
  onToggle,
  onStartEdit,
  onDelete,
  onSave,
  onCancelEdit,
  children,
}: SortableMenuProps) {
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
            aria-label={isExpanded ? `Recolher ${menu.titulo}` : `Expandir ${menu.titulo}`}
            className="text-slate-400 hover:text-slate-600"
          >
            {isExpanded ? <Minus size={16} /> : <Plus size={16} />}
          </button>
          <MenuIcone icone={menu.icone} titulo={menu.titulo} url={menu.itens?.[0]?.url} size={16} className="text-slate-500" />
          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <Input
                value={editValue}
                onChange={e => onChangeEdit(e.target.value)}
                className="h-8 text-sm max-w-[180px]"
                placeholder="Título do menu"
                autoFocus
              />
              <Select
                value={editIcone || ""}
                onValueChange={(v: string | null) => {
                  if (v) onChangeIcone(v)
                }}
              >
                <SelectTrigger className="h-8 text-sm w-[200px]">
                  <SelectValue placeholder="Ícone do menu" />
                </SelectTrigger>
                <SelectContent>
                  {ICONE_OPCOES.map(op => (
                    <SelectItem key={op.valor} value={op.valor}>
                      <span className="inline-flex items-center gap-2">
                        <op.Icone size={14} />
                        {op.nome}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              aria-label={`Editar menu ${menu.titulo}`}
              className="p-1.5 text-slate-400 hover:text-blue-600 rounded"
            >
              <Edit3 size={14} />
            </button>
            <button
              onClick={onDelete}
              aria-label={`Excluir menu ${menu.titulo}`}
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
