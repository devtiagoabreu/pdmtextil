import Link from "next/link"
import { Mail, Database, Shield, Bell, Lock, Users, Settings, Zap, Building2, CheckCircle2, Layout } from "lucide-react"
import { PageInfoButton } from "@/components/ui/page-info-button"

const modulos = [
  { href: "/admin/configuracoes/smtp", label: "SMTP", desc: "ConfiguraÃ§Ã£o do servidor de email e teste de envio", icon: Mail, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/50" },
  { href: "/comercial/crm/configuracoes/email", label: "Email CRM", desc: "ConfiguraÃ§Ã£o de email para pesquisas e notificaÃ§Ãµes do CRM", icon: Mail, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50" },
  { href: "/admin/configuracoes/banco-dados", label: "Banco de Dados", desc: "Gerenciar conexÃµes com banco de dados", icon: Database, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50" },
  { href: "/admin/roles", label: "Perfis (Roles)", desc: "Gerenciar perfis de acesso do sistema", icon: Shield, color: "text-purple-600 bg-purple-50 dark:bg-purple-950/50" },
  { href: "/admin/notificacoes", label: "NotificaÃ§Ãµes", desc: "Configurar quem recebe cada tipo de notificaÃ§Ã£o", icon: Bell, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/50" },
  { href: "/admin/configuracoes/permissoes", label: "PermissÃµes", desc: "Configurar permissÃµes CRUD por perfil", icon: Lock, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/50" },
  { href: "/admin/usuarios", label: "UsuÃ¡rios", desc: "Gerenciar usuÃ¡rios do sistema", icon: Users, color: "text-cyan-600 bg-cyan-50 dark:bg-cyan-950/50" },
  { href: "/admin/configuracoes/integracoes", label: "IntegraÃ§Ãµes", desc: "Configurar conexÃµes com sistemas externos (ERP, API, WMS)", icon: Zap, color: "text-orange-600 bg-orange-50 dark:bg-orange-950/50" },
  { href: "/admin/configuracoes/empresa", label: "Empresas", desc: "Configurar dados da empresa para relatÃ³rios e exportaÃ§Ãµes (logo, CNPJ, endereÃ§o)", icon: Building2, color: "text-sky-600 bg-sky-50 dark:bg-sky-950/50" },
  { href: "/admin/configuracoes/telas", label: "Telas", desc: "Configurar menus e pÃ¡gina inicial por perfil de usuÃ¡rio", icon: Layout, color: "text-violet-600 bg-violet-50 dark:bg-violet-950/50" },
  { href: "/admin/configuracoes/status", label: "Status", desc: "Gerenciar os status disponÃ­veis para cada mÃ³dulo do sistema", icon: CheckCircle2, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/50" },
]

export default function ConfiguracoesHubPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <div className="flex items-center gap-2">
          <Settings className="text-blue-600" size={24} />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">ConfiguraÃ§Ãµes<PageInfoButton /></h1>
        </div>
        <p className="text-sm text-slate-500 mt-1">Gerencie todas as configuraÃ§Ãµes do sistema</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {modulos.map((mod: any) => {
          const Icon = mod.icon
          return (
            <Link prefetch={false}
              key={mod.href}
              href={mod.href}
              className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 hover:shadow-md hover:border-blue-200 dark:hover:border-blue-800 transition-all"
            >
              <div className={`inline-flex p-3 rounded-lg ${mod.color} mb-3`}>
                <Icon size={22} />
              </div>
              <h3 className="font-semibold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
                {mod.label}
              </h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">{mod.desc}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
