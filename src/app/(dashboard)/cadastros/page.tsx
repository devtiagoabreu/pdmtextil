"use client"

import Link from "next/link"
import { Package, Building2, Users, Palette, Scissors, Droplets, Layers, FlaskConical, Beaker } from "lucide-react"
import { usePathname } from "next/navigation"
import { InfoButton } from "@/components/ui/info-button"
import { getInfoContent } from "@/lib/info-content"

const modulos = [
  {
    titulo: "Fios",
    descricao: "Cadastro de fios têxteis",
    href: "/cadastros/fios",
    icon: Package,
  },
  {
    titulo: "Fornecedores",
    descricao: "Cadastro de fornecedores",
    href: "/cadastros/fornecedores",
    icon: Building2,
  },
  {
    titulo: "Bases de Urdume",
    descricao: "Bases de urdume",
    href: "/cadastros/bases-urdume",
    icon: Scissors,
  },
  {
    titulo: "Cores Sólidas",
    descricao: "Cores sólidas",
    href: "/cadastros/cores",
    icon: Palette,
  },
  {
    titulo: "Estampas",
    descricao: "Estampas e desenhos",
    href: "/cadastros/estampas",
    icon: Droplets,
  },
  {
    titulo: "Clientes",
    descricao: "Cadastro de clientes",
    href: "/cadastros/clientes",
    icon: Users,
  },
  {
    titulo: "Produtos",
    descricao: "Produtos (tecidos) - engenharia têxtil",
    href: "/cadastros/produto-cru",
    icon: Layers,
  },
  {
    titulo: "Produtos Químicos",
    descricao: "Produtos químicos para beneficiamento",
    href: "/cadastros/produtos-quimicos",
    icon: FlaskConical,
  },
  {
    titulo: "Receitas",
    descricao: "Receitas de beneficiamento",
    href: "/cadastros/receitas",
    icon: Beaker,
  },
]

export default function CadastrosPage() {
  const pathname = usePathname()
  const info = getInfoContent(pathname)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">
          Cadastros
          {info && <InfoButton content={info} />}
        </h1>
        <p className="text-sm text-slate-500">
          Módulos de cadastro do sistema
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modulos.map((modulo) => {
          const Icon = modulo.icon
          return (
            <Link
              key={modulo.href}
              href={modulo.href}
              className="flex items-center gap-4 p-6 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all"
            >
              <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800">
                <Icon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-900 dark:text-slate-50">
                  {modulo.titulo}
                </h2>
                <p className="text-sm text-slate-500">{modulo.descricao}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}