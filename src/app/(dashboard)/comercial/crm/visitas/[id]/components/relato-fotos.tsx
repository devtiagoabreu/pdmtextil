import { ExternalLink } from "lucide-react"
import Image from "next/image"
import PhotoUpload from "@/components/crm/photo-upload"
import { RelatoTemplateSelector } from "@/components/crm/relato-templates"
import { RichTextEditor } from "@/components/crm/rich-text-editor"
import { sanitizeHtml } from "@/lib/sanitize"

interface RelatoFotosProps {
  editing: boolean
  visita: any
  form: any
  setField: (field: string, value: any) => void
  fotos: string[]
  onFotosChange: (fotos: string[]) => void
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

  return (
    <>
      {visita.relato && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-2">Relato / Ata</h2>
          <div className="text-sm text-slate-700 dark:text-slate-300 prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: sanitizeHtml(visita.relato) }} />
        </div>
      )}

      {visita.fotos && visita.fotos.length > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-4">Fotos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {visita.fotos.map((url: string, i: number) => (
              <a
                key={url}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="relative group aspect-video rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center"
              >
                <Image
                  src={url}
                  alt={`Foto ${i + 1}`}
                  width={400}
                  height={225}
                  className="object-cover w-full h-full"
                  unoptimized
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none"
                    const parent = (e.target as HTMLImageElement).parentElement
                    if (parent) {
                      parent.innerHTML = `<span class="text-xs text-slate-400">URL invalida</span>`
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 group-active:bg-black/40 transition-colors flex items-center justify-center">
                  <ExternalLink size={16} className="text-white opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity" />
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </>
  )
}
