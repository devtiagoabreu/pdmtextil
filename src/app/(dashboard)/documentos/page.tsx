import Link from "next/link"
import { FileText, Truck, FileSpreadsheet, ShoppingCart, BarChart3, ScanLine } from "lucide-react"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

const modulos = [
  {
    href: "/documentos/romaneios",
    label: "Romaneios",
    desc: "Emissão e consulta de romaneios de carga",
    icon: Truck,
  },
  {
    href: "/documentos/conferencia-op-tecelagem",
    label: "Conferência de OP de Tecelagem",
    desc: "Consulta e conferência de rolos gerados por ordem de produção (OP)",
    icon: ScanLine,
  },
  {
    href: "/documentos/pre-danfe",
    label: "Pré-DANFE",
    desc: "Geração de pré-DANFE para faturamento",
    icon: FileSpreadsheet,
    disabled: true,
  },
  {
    href: "/documentos/pedidos-venda",
    label: "Pedidos de Venda",
    desc: "Consulta e gestão de pedidos de venda",
    icon: ShoppingCart,
    disabled: true,
  },
  {
    href: "/documentos/pedidos-compra",
    label: "Pedidos de Compra",
    desc: "Consulta e gestão de pedidos de compra",
    icon: FileText,
    disabled: true,
  },
  {
    href: "/documentos/relatorios",
    label: "Relatórios",
    desc: "Relatórios e dashbacks operacionais",
    icon: BarChart3,
    disabled: true,
  },
]

export default function DocumentosPage() {
  const info = getInfoContent("/documentos")

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Documentos{info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Documentos operacionais, fiscais e logísticos
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {modulos.map((mod: any) => {
          const Icon = mod.icon
          const baseClass = `relative rounded-xl border p-5 transition-all ${
            mod.disabled
              ? "border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed"
              : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer"
          }`
          const content = (
            <>
              <div className="flex items-start gap-4">
                <div className="shrink-0 inline-flex p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <Icon size={20} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                    {mod.label}
                    {mod.disabled && (
                      <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 font-medium">
                        Em breve
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{mod.desc}</p>
                </div>
              </div>
            </>
          )
          return mod.disabled ? (
            <div key={mod.href} className={baseClass} aria-disabled="true" tabIndex={-1}>
              {content}
            </div>
          ) : (
            <Link key={mod.href} href={mod.href} className={baseClass}>
              {content}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
