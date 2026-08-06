import { FileText } from "lucide-react"
import { TIPO_CONFIG } from "./constants"

export function DadosComerciais({ sol }: { sol: any }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileText size={20} />
        Dados Comerciais
      </h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-slate-500 dark:text-slate-400">Tipo</p>
          <p className="font-medium">{TIPO_CONFIG[sol.tipo] || sol.tipo}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">Cliente</p>
          <p className="font-medium">{sol.cliente || "—"}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">CNPJ</p>
          <p className="font-medium">{sol.cnpj || "—"}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">Projeto</p>
          <p className="font-medium">{sol.projeto || "—"}</p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">Prazo Desejado</p>
          <p className="font-medium">
            {sol.prazoDesejado ? new Date(sol.prazoDesejado).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—"}
          </p>
        </div>
        <div>
          <p className="text-slate-500 dark:text-slate-400">Criado em</p>
          <p className="font-medium">
            {sol.createdAt ? new Date(sol.createdAt).toLocaleDateString("pt-BR") : "—"}
          </p>
        </div>
      </div>
    </div>
  )
}
