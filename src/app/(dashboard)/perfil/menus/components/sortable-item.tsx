import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { GripVertical, Save, Edit3, Trash2 } from "lucide-react"
import { useSortable } from "@dnd-kit/sortable"
import type { MenuItem } from "./types"

interface SortableItemProps {
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
}

export function SortableItem({
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
}: SortableItemProps) {
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
