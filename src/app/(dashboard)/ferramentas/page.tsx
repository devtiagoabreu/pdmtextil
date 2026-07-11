"use client"

import Link from "next/link"
import { Send, Calculator, Wrench, Repeat, Search } from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

const ferramentas = [
  { href: "/ferramentas/consulta-cnpj", label: "Consulta CNPJ", desc: "Consultar dados de CNPJ na Receita Federal, comparar com registros locais e sincronizar", icon: Search },
  { href: "/ferramentas/regra-de-tres", label: "Calculadora de Regra de Três", desc: "Resolve regra de três simples (direta/inversa) e composta", icon: Calculator },
  { href: "/ferramentas/conversores", label: "Numeração de Fio", desc: "Conversão entre Ne, Nm, Tex, Dtex e Denier", icon: Repeat },
  { href: "/admin/email-massa", label: "Email em Massa", desc: "Enviar email para múltiplos destinatários", icon: Send },
]

export default function FerramentasHubPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <Wrench className="text-blue-600" size={24} />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Ferramentas{info && <InfoButton content={info} />}</h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">Ferramentas auxiliares do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ferramentas.map(f => {
          const Icon = f.icon
          return (
            <Link
              key={f.href}
              href={f.href}
              className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all"
            >
              <div className="inline-flex p-3 rounded-lg text-blue-600 bg-blue-50 dark:bg-blue-950/50 mb-3">
                <Icon size={22} />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">{f.label}</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
