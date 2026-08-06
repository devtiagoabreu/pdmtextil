import { Link as LinkIcon } from "lucide-react"

export function Anexos({ anexos }: { anexos: any[] }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <LinkIcon size={20} className="text-blue-500" />
        Links e Referências
      </h2>
      <ul className="space-y-3">
        {anexos.map((anexo: any) => (
          <li key={anexo.id} className="text-sm border-b border-slate-100 dark:border-slate-800 pb-2 last:border-0 last:pb-0">
            <a
              href={anexo.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-600 hover:underline flex items-center gap-2"
            >
              {anexo.titulo || anexo.url}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
