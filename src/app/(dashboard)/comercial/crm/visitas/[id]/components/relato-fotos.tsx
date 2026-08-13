import { ExternalLink } from "lucide-react"
import Image from "next/image"
import PhotoUpload from "@/components/crm/photo-upload"
import { RelatoTemplateSelector } from "@/components/crm/relato-templates"
import { RichTextEditor } from "@/components/crm/rich-text-editor"
import { sanitizeHtml } from "@/lib/sanitize"
import type { VisitaFoto } from "@/lib/crm/visita-fotos"
import { normalizeVisitaFotos } from "@/lib/crm/visita-fotos"

const FOTOS_LABEL = "Fotos, comprovantes, documentos e outros"

interface RelatoFotosProps {
  editing: boolean
  visita: any
  form: any
  setField: (field: string, value: any) => void
  fotos: VisitaFoto[]
  onFotosChange: (fotos: VisitaFoto[]) => void
}

export function RelatoFotos({ editing, visita, form, setField, fotos, onFotosChange }: RelatoFotosProps) {
  if (editing) {
    return (
      <>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Relato / Ata</h2>
          <RelatoTemplateSelector onSelect={html => setField("relato", html)} />
          <RichTextEditor
            value={form.relato || ""}
            onChange={v => setField("relato", v)}
            placeholder="Descreva o relato da visita..."
            minHeight="250px"
          />
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <PhotoUpload photos={fotos} onPhotosChange={onFotosChange} />
        </div>
      </>
    )
  }

  const fotosList = normalizeVisitaFotos(visita.fotos)

  return (
    <>
      {visita.relato && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Relato / Ata</h2>
          <div className="text-sm text-slate-700 dark:text-slate-300 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(visita.relato) }} />
        </div>
      )}

      {fotosList.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">{FOTOS_LABEL}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {fotosList.map((foto, i) => (
              <a
                key={`${foto.url}-${i}`}
                href={foto.url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group aspect-video rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex flex-col"
              >
                <div className="relative flex-1 min-h-0">
                  <Image
                    src={foto.url}
                    alt={foto.descricao || `Item ${i + 1}`}
                    width={400}
                    height={225}
                    className="object-cover w-full h-full"
                    unoptimized
                    onError={(e) => {
                      const img = e.target as HTMLImageElement
                      img.style.display = "none"
                      const parent = img.parentElement
                      if (parent && !parent.querySelector(".foto-fallback")) {
                        const span = document.createElement("span")
                        span.className = "foto-fallback absolute inset-0 flex items-center justify-center text-xs text-slate-400 px-2 text-center"
                        span.textContent = foto.descricao || "Abrir anexo"
                        parent.appendChild(span)
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 group-active:bg-black/40 transition-colors flex items-center justify-center">
                    <ExternalLink size={16} className="text-white opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />
                  </div>
                </div>
                {foto.descricao ? (
                  <div className="px-2 py-1.5 text-xs text-slate-700 dark:text-slate-300 truncate bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                    {foto.descricao}
                  </div>
                ) : (
                  <div className="px-2 py-1.5 text-[11px] text-slate-400 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700">
                    Item {i + 1}
                  </div>
                )}
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
