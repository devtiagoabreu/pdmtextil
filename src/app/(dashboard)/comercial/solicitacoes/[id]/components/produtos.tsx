import Link from "next/link"
import { FileText, Pencil } from "lucide-react"

export function Produtos({ produtos }: { produtos: any[] }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <FileText size={20} />
        Produtos Desenvolvidos
      </h2>
      {produtos.length > 0 ? (
        <div className="space-y-3">
          {produtos.map((p: any) => (
            <Link
              key={p.id}
              href={`/cadastros/produto-cru/${p.id}`}
              className="block p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{p.codigoPdm} — {p.descricao}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Status:{" "}
                    <span className={`font-medium ${
                      p.status === "APROVADO" ? "text-green-600" :
                      p.status === "EM_PRODUCAO" ? "text-blue-600" :
                      "text-slate-600"
                    }`}>{p.status}</span>
                  </p>
                </div>
                <Pencil size={14} className="text-slate-400" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500">Nenhum produto cadastrado para esta solicitação.</p>
      )}
    </div>
  )
}
