"use client"

import { useState, useRef } from "react"
import { Camera, Upload, X, Link as LinkIcon, Loader2 } from "lucide-react"

interface PhotoUploadProps {
  photos: string[]
  onPhotosChange: (photos: string[]) => void
  maxPhotos?: number
  label?: string
}

export default function PhotoUpload({ photos, onPhotosChange, maxPhotos = 20, label = "Fotos" }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [urlValue, setUrlValue] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || ""
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || ""

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const remaining = maxPhotos - photos.length
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
        onPhotosChange([...photos, ...uploadedUrls])
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
    if (trimmed && !photos.includes(trimmed)) {
      onPhotosChange([...photos, trimmed])
      setUrlValue("")
      setShowUrlInput(false)
    }
  }

  function removePhoto(index: number) {
    onPhotosChange(photos.filter((_, i) => i !== index))
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
          {photos.length < maxPhotos && (
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

      {photos.length > 0 ? (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {photos.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800">
              <img
                src={url}
                alt={`Foto ${i + 1}`}
                className="object-cover w-full h-full"
                onError={e => {
                  const img = e.target as HTMLImageElement
                  img.style.display = "none"
                  const parent = img.parentElement
                  if (parent && !parent.querySelector(".error-fallback")) {
                    const span = document.createElement("span")
                    span.className = "error-fallback absolute inset-0 flex items-center justify-center text-xs text-slate-400"
                    span.textContent = "Invalida"
                    parent.appendChild(span)
                  }
                }}
              />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity hover:bg-red-600 min-h-[28px] min-w-[28px] flex items-center justify-center"
              >
                <X size={12} />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1">
                <span className="text-[10px] text-white/80">{i + 1}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl p-6 text-center">
          <Camera size={24} className="mx-auto text-slate-300 dark:text-slate-600 mb-2" />
          <p className="text-xs text-slate-400">
            Nenhuma foto adicionada
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

      {photos.length > 0 && (
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
          {photos.length}/{maxPhotos} fotos
        </p>
      )}
    </div>
  )
}
