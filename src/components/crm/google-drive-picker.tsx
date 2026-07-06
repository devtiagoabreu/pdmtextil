"use client"

import { useState, useEffect, useCallback } from "react"
import { Folder, File, ChevronRight, Home, ArrowLeft, Search, Loader2, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface DriveItem {
  id: string
  name: string
  mimeType: string
  webViewLink?: string
  webContentLink?: string
  size?: string
  iconLink?: string
  thumbnailLink?: string
  _type?: "folder" | "file"
}

interface DriveFile extends DriveItem {
  id: string
  name: string
  webViewLink: string
  mimeType: string
}

interface Breadcrumb {
  id: string
  name: string
}

interface GoogleDrivePickerProps {
  open: boolean
  onClose: () => void
  onSelect: (file: DriveFile) => void
}

export function GoogleDrivePicker({ open, onClose, onSelect }: GoogleDrivePickerProps) {
  const [items, setItems] = useState<DriveItem[]>([])
  const [loading, setLoading] = useState(false)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<Breadcrumb[]>([{ id: "", name: "Meu Drive" }])
  const [searchQuery, setSearchQuery] = useState("")
  const [searching, setSearching] = useState(false)

  const loadFolder = useCallback(async (folderId: string | null, isRoot = false) => {
    setLoading(true)
    try {
      let url = "/api/google-drive/list"
      if (isRoot || !folderId) {
        url += "?action=root"
      } else {
        url += `?action=files&folderId=${folderId}`
      }
      const res = await fetch(url)
      if (!res.ok) throw new Error("Erro ao carregar")
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) loadFolder(null, true)
  }, [open, loadFolder])

  async function openFolder(item: DriveItem) {
    setCurrentFolder(item.id)
    setBreadcrumb(prev => [...prev, { id: item.id, name: item.name }])
    if (item.mimeType === "application/vnd.google-apps.folder") {
      loadFolder(item.id, false)
    }
  }

  async function navigateToBreadcrumb(index: number) {
    const target = breadcrumb[index]
    setBreadcrumb(prev => prev.slice(0, index + 1))
    setCurrentFolder(target.id || null)
    if (!target.id) {
      loadFolder(null, true)
    } else {
      loadFolder(target.id, false)
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) return
    setSearching(true)
    try {
      const res = await fetch(`/api/google-drive/list?action=search&q=${encodeURIComponent(searchQuery)}`)
      if (!res.ok) throw new Error("Erro na busca")
      const data = await res.json()
      setItems(Array.isArray(data) ? data : [])
    } catch {
      setItems([])
    } finally {
      setSearching(false)
    }
  }

  function isFolder(item: DriveItem) {
    return item.mimeType === "application/vnd.google-apps.folder" || item._type === "folder"
  }

  function formatSize(bytes?: string) {
    if (!bytes) return ""
    const num = parseInt(bytes)
    if (num < 1024) return `${num} B`
    if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`
    return `${(num / (1024 * 1024)).toFixed(1)} MB`
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Selecionar do Google Drive</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X size={18} className="text-slate-400" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 flex gap-2 items-center">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Buscar arquivos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
            <Button variant="secondary" size="sm" onClick={handleSearch} disabled={searching}>
              {searching ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
            </Button>
          </div>
        </div>

        <div className="px-5 py-2 flex items-center gap-1 text-sm text-slate-500 border-b border-slate-100 dark:border-slate-800">
          <button onClick={() => navigateToBreadcrumb(0)} className="hover:text-slate-700 dark:hover:text-slate-300">
            <Home size={14} />
          </button>
          {breadcrumb.map((crumb, i) => (
            <span key={crumb.id || "root"} className="flex items-center gap-1">
              <ChevronRight size={12} />
              {i === breadcrumb.length - 1 ? (
                <span className="text-slate-900 dark:text-slate-200 font-medium truncate max-w-[200px]">{crumb.name}</span>
              ) : (
                <button onClick={() => navigateToBreadcrumb(i)} className="hover:text-slate-700 dark:hover:text-slate-300 truncate max-w-[150px]">
                  {crumb.name}
                </button>
              )}
            </span>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {loading || searching ? (
            <div className="flex justify-center py-16">
              <Loader2 size={24} className="animate-spin text-slate-400" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <Folder size={40} className="mx-auto mb-2 opacity-50" />
              <p>Nenhum arquivo ou pasta encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => isFolder(item) ? openFolder(item) : onSelect(item as DriveFile)}
                  className={`flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors ${isFolder(item) ? "" : "cursor-pointer"}`}
                >
                  {isFolder(item) ? (
                    <Folder size={20} className="text-amber-500 shrink-0" />
                  ) : (
                    <File size={20} className="text-blue-500 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate text-slate-900 dark:text-slate-200">{item.name}</p>
                    <p className="text-xs text-slate-400 truncate">
                      {isFolder(item) ? "Pasta" : formatSize(item.size)}
                    </p>
                  </div>
                  {!isFolder(item) && (
                    <ExternalLink size={14} className="text-slate-300 shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export type { DriveFile }
