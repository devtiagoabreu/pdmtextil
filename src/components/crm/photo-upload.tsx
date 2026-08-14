"use client"

import { useState, useRef } from "react"
import { Camera, Trash2, Link as LinkIcon, Loader2, Check } from "lucide-react"
import type { VisitaFoto } from "@/lib/crm/visita-fotos"
import { normalizeVisitaFotos } from "@/lib/crm/visita-fotos"

interface PhotoUploadProps {
  photos: VisitaFoto[]
  onPhotosChange: (photos: VisitaFoto[]) => void
  maxPhotos?: number
  label?: string
}

export default function PhotoUpload({ photos, onPhotosChange, maxPhotos = 20, label = "Fotos, comprovantes, documentos e outros" }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlValue, setUrlValue] = useState("")
  const [savedIndex, setSavedIndex] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const normalized = normalizeVisitaFotos(photos)
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ""
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remaining = maxPhotos - normalized.length
    const filesToUpload = Array.from(files).slice(0, remaining)

    if (filesToUpload.length < files.length) {
      alert(`Maximo de ${maxPhotos} fotos. Apenas ${filesToUpload.length} serao enviadas.`)
    }

    setUploading(true)

    try {
      const uploadedUrls: string[] = []

      for (const file of filesToUpload) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("upload_preset", uploadPreset)
        formData.append("folder", "visitas")

        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        })

        if (!res.ok) {
          const err = await res.json()
          console.error("Cloudinary upload error:", err)
          continue
        }

        const data = await res.json()
        uploadedUrls.push(data.secure_url)
      }

      if (uploadedUrls.length > 0) {
        onPhotosChange([...normalized, ...uploadedUrls.map((url) => ({ url, descricao: "" }))])
      }
    } catch (err) {
      console.error("Upload failed:", err)
      alert("Erro ao enviar fotos. Tente novamente.")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  function addUrl() {
    const trimmed = urlValue.trim()
    if (trimmed && !normalized.some((f) => f.url === trimmed)) {
      onPhotosChange([...normalized, { url: trimmed, descricao: "" }])
      setUrlValue("")
      setShowUrlInput(false)
    }
  }

  function removePhoto(index: number) {
    onPhotosChange(normalized.filter((_: VisitaFoto, i: number) => i !== index))
  }

  function updateDescricao(index: number, descricao: string) {
    onPhotosChange(normalized.map((foto, i) => (i === index ? { ...foto, descricao } : foto)))
  }

  function commitDescricao(index: number) {
    setSavedIndex(index)
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current)
    savedTimerRef.current = setTimeout(() => setSavedIndex(null), 1600)
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</label>
        <div className="flex items-center gap-2">
          {normalized.length < maxPhotos && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-900/50 text-xs font-medium min-h-[36px] transition-colors disabled:opacity-50"
              >
                {uploading ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
                {uploading ? "Enviando..." : "Foto"}
              </button>
              <button
                type="button"
                onClick={() => setShowUrlInput(!showUrlInput)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs min-h-[36px] transition-colors"
              >
                <LinkIcon size={14} />
                URL
              </button>
            </>
          )}
        </div>
      </div>

      {showUrlInput && (
        <div className="flex items-center gap-2 mb-2">
          <input
            type="url"
            value={urlValue}
            onChange={e => setUrlValue(e.target.value)}
            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addUrl())}
            placeholder="https://..."
            className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addUrl}
            disabled={!urlValue.trim()}
            className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium min-h-[36px] disabled:opacity-50"
          >
            Adicionar
          </button>
        </div>
      )}

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-2 py-3">
          <Loader2 size={16} className="animate-spin" />
          Enviando fotos...
        </div>
      )}

      {normalized.length > 0 ? (
        <ul className="space-y-2">
          {normalized.map((foto, i) => (
            <li key={`${foto.url}-${i}`} className="flex items-center gap-3">
              <div className="relative shrink-0 w-28 aspect-video rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={foto.url}
                  alt={foto.descricao || `Item ${i + 1}`}
                  className="object-cover w-full h-full"
                  onError={e => {
                    const img = e.target as HTMLImageElement
                    img.style.display = "none"
                    const parent = img.parentElement
                    if (parent && !parent.querySelector(".foto-fallback")) {
                      const span = document.createElement("span")
                      span.className = "foto-fallback absolute inset-0 flex items-center justify-center text-xs text-slate-400 px-2 text-center"
                      span.textContent = "Anexo / link"
                      parent.appendChild(span)
                    }
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  value={foto.descricao}
                  onChange={e => updateDescricao(i, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      commitDescricao(i)
                      ;(e.target as HTMLInputElement).blur()
                    }
                  }}
                  placeholder="Descreva o que é este item (ex: comprovante de entrega)"
                  aria-label={`Descrição do item ${i + 1}`}
                  className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="h-5 mt-1">
                  {savedIndex === i && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <Check size={12} />
                      Descrição salva
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removePhoto(i)}
                aria-label={`Remover item ${i + 1}`}
                title="Remover item"
                className="self-start p-1.5 rounded-full bg-black/60 text-white hover:bg-red-600 min-h-[28px] min-w-[28px] flex items-center justify-center transition-colors"
              >
                <Trash2 size={13} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
          <Camera size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-xs text-slate-400">
            Nenhum anexo adicionado
          </p>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="mt-2 text-xs text-blue-600 hover:underline"
          >
            Enviar primeira foto
          </button>
        </div>
      )}

      {normalized.length > 0 && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
          {normalized.length}/{maxPhotos} itens
        </p>
      )}
    </div>
  )
}
