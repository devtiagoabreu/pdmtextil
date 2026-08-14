import { Building2, User, UserCheck } from "lucide-react"

interface TipoEntidadeSelectorProps {
  onSelect: (tipo: "CLIENTE" | "PESSOA" | "AVULSA") => void
  title?: string
  description?: string
  labels?: {
    cliente?: string
    clienteDesc?: string
    pessoa?: string
    pessoaDesc?: string
    avulsa?: string
    avulsaDesc?: string
  }
}

export function TipoEntidadeSelector({ onSelect, title, description, labels }: TipoEntidadeSelectorProps) {
  const t = {
    cliente: labels?.cliente ?? "Cliente",
    clienteDesc: labels?.clienteDesc ?? "Empresa já cadastrada no sistema",
    pessoa: labels?.pessoa ?? "Pessoa",
    pessoaDesc: labels?.pessoaDesc ?? "Futuro cliente (negócio)",
    avulsa: labels?.avulsa ?? "Avulsa",
    avulsaDesc: labels?.avulsaDesc ?? "Visita sem vínculo inicial",
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 space-y-4">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 text-center">{title ?? "Quem você vai visitar?"}</h2>
      <p className="text-sm text-slate-500 text-center">{description ?? "Selecione o tipo de entidade para iniciar o agendamento."}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <button
          type="button"
          onClick={() => onSelect("CLIENTE")}
          className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer group"
        >
          <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/50 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-800/50 transition-colors">
            <Building2 size={28} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{t.cliente}</p>
            <p className="text-xs text-slate-500 mt-1">{t.clienteDesc}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onSelect("PESSOA")}
          className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-all cursor-pointer group"
        >
          <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/50 group-hover:bg-blue-200 dark:group-hover:bg-blue-800/50 transition-colors">
            <UserCheck size={28} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{t.pessoa}</p>
            <p className="text-xs text-slate-500 mt-1">{t.pessoaDesc}</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => onSelect("AVULSA")}
          className="flex flex-col items-center gap-3 p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-all cursor-pointer group"
        >
          <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/50 group-hover:bg-orange-200 dark:group-hover:bg-orange-800/50 transition-colors">
            <User size={28} className="text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-center">
            <p className="font-semibold text-slate-900 dark:text-slate-100">{t.avulsa}</p>
            <p className="text-xs text-slate-500 mt-1">{t.avulsaDesc}</p>
          </div>
        </button>
      </div>
    </div>
  )
}
