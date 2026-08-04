import {
  type LucideIcon,
  LayoutDashboard,
  Target,
  Database,
  BarChart3,
  MessageSquare,
  MessageCircle,
  FileText,
  Wrench,
  Settings,
  Folder,
  Users,
  UserPlus,
  UserCheck,
  User,
  Calendar,
  Scissors,
  Megaphone,
  GraduationCap,
  MapPin,
  TrendingUp,
  ClipboardList,
  Package,
  Search,
  Building2,
  Layers,
  CheckSquare,
  Columns,
  Camera,
  Palette,
  FlaskConical,
  Beaker,
  Globe,
  Bell,
  ShoppingCart,
  Tag,
  Mail,
  Calculator,
  Shield,
  Truck,
  Handshake,
  DollarSign,
  GitBranch,
} from "lucide-react"

// [título (pt-BR), nome do ícone (lucide), componente]
const ENTRADAS: [string, string, LucideIcon][] = [
  ["Dashboard", "LayoutDashboard", LayoutDashboard],
  ["Comercial", "Handshake", Handshake],
  ["CRM", "Target", Target],
  ["Amostras", "Package", Package],
  ["Cadastros", "Database", Database],
  ["BI", "BarChart3", BarChart3],
  ["Relatórios", "BarChart3", BarChart3],
  ["Chat", "MessageSquare", MessageSquare],
  ["WhatsApp", "MessageCircle", MessageCircle],
  ["Documentos", "FileText", FileText],
  ["Ferramentas", "Wrench", Wrench],
  ["Administração", "Settings", Settings],
  ["Padrão", "Folder", Folder],
  ["Solicitações", "ClipboardList", ClipboardList],
  ["Corte", "Scissors", Scissors],
  ["Amostra Comercial", "Package", Package],
  ["Clientes", "Building2", Building2],
  ["Representantes", "UserCheck", UserCheck],
  ["Leads", "UserPlus", UserPlus],
  ["Pessoas", "Users", Users],
  ["Contatos", "Users", Users],
  ["Oportunidades", "TrendingUp", TrendingUp],
  ["Propostas", "FileText", FileText],
  ["Visitas", "Calendar", Calendar],
  ["Tarefas", "CheckSquare", CheckSquare],
  ["Campanhas", "Megaphone", Megaphone],
  ["Equipes", "Users", Users],
  ["Regiões", "MapPin", MapPin],
  ["Treinamento", "GraduationCap", GraduationCap],
  ["Produtos", "Layers", Layers],
  ["Fios", "GitBranch", GitBranch],
  ["Fornecedores", "Truck", Truck],
  ["Bases Urdume", "Columns", Columns],
  ["Cores", "Palette", Palette],
  ["Estampas", "Camera", Camera],
  ["Químicos", "FlaskConical", FlaskConical],
  ["Receitas", "Beaker", Beaker],
  ["Romaneios", "Truck", Truck],
  ["Pré-DANFE", "FileText", FileText],
  ["Notificações", "Bell", Bell],
  ["Banco de Dados", "Database", Database],
  ["Email", "Mail", Mail],
  ["Consulta CNPJ", "Search", Search],
  ["Regra de Três", "Calculator", Calculator],
  ["Conversores", "Calculator", Calculator],
  ["Perfil", "User", User],
  ["Usuários", "Users", Users],
  ["Perfis", "Shield", Shield],
  ["Permissões", "Shield", Shield],
  ["Integrações", "Globe", Globe],
  ["Estoque", "Package", Package],
  ["Vendas", "ShoppingCart", ShoppingCart],
  ["Financeiro", "DollarSign", DollarSign],
  ["Status", "Tag", Tag],
]

export interface OpcaoIcone {
  valor: string
  nome: string
  Icone: LucideIcon
}

export const ICONE_OPCOES: OpcaoIcone[] = ENTRADAS.map(([nome, valor, Icone]) => ({ valor, nome, Icone }))

function normalizar(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "")
}

const ICONES_POR_TITULO: Record<string, LucideIcon> = {}
const ICONES_POR_NOME: Record<string, LucideIcon> = {}
for (const [titulo, nome, Icone] of ENTRADAS) {
  ICONES_POR_TITULO[normalizar(titulo)] = Icone
  ICONES_POR_NOME[normalizar(nome)] = Icone
}

// Prefixos de URL (mais específicos primeiro) usados para derivar o ícone de submenus e menus sem ícone
const URL_ICONES: [string, LucideIcon][] = [
  ["/comercial/crm/treinamento", GraduationCap],
  ["/comercial/crm/relatorios", BarChart3],
  ["/comercial/crm/configuracoes", Settings],
  ["/comercial/crm/notificacoes", Bell],
  ["/comercial/crm/visitas", Calendar],
  ["/comercial/crm/tarefas", CheckSquare],
  ["/comercial/crm/campanhas", Megaphone],
  ["/comercial/crm/oportunidades", TrendingUp],
  ["/comercial/crm/propostas", FileText],
  ["/comercial/crm/leads", UserPlus],
  ["/comercial/crm/pessoas", Users],
  ["/comercial/crm/contatos", Users],
  ["/comercial/crm/conversas", MessageCircle],
  ["/comercial/crm/regioes", MapPin],
  ["/comercial/crm/equipes", Users],
  ["/comercial/crm", Target],
  ["/comercial/representantes", UserCheck],
  ["/comercial/requisicoes-amostra-comercial", Package],
  ["/comercial/requisicoes-corte", Scissors],
  ["/comercial/solicitacoes", ClipboardList],
  ["/comercial/clientes", Building2],
  ["/amostras", Package],
  ["/cadastros/produto-cru", Layers],
  ["/cadastros/produtos-quimicos", FlaskConical],
  ["/cadastros/receitas", Beaker],
  ["/cadastros/bases-urdume", Columns],
  ["/cadastros/fornecedores", Truck],
  ["/cadastros/cores", Palette],
  ["/cadastros/estampas", Camera],
  ["/cadastros/fios", GitBranch],
  ["/cadastros", Database],
  ["/dashboard/relatorios", BarChart3],
  ["/dashboard", LayoutDashboard],
  ["/bi", BarChart3],
  ["/documentos/romaneios", Truck],
  ["/documentos", FileText],
  ["/ferramentas/consulta-cnpj", Search],
  ["/ferramentas/regra-de-tres", Calculator],
  ["/ferramentas/conversores", Calculator],
  ["/ferramentas", Wrench],
  ["/chat", MessageSquare],
  ["/admin/whatsapp", MessageCircle],
  ["/admin/email-massa", Mail],
  ["/admin/notificacoes", Bell],
  ["/admin/usuarios", Users],
  ["/admin/roles", Shield],
  ["/admin/configuracoes", Settings],
  ["/admin", Settings],
  ["/perfil", User],
]

export function iconForUrl(url: string): LucideIcon {
  const u = url.split("?")[0]
  for (const [prefix, Icone] of URL_ICONES) {
    if (u === prefix || u.startsWith(prefix + "/")) return Icone
  }
  return Folder
}

export function resolveMenuIcon(icone?: string | null, titulo?: string, url?: string): LucideIcon {
  if (icone) {
    const porNome = ICONES_POR_NOME[normalizar(icone)]
    if (porNome) return porNome
    const porTitulo = ICONES_POR_TITULO[normalizar(icone)]
    if (porTitulo) return porTitulo
  }
  if (titulo) {
    const porTitulo = ICONES_POR_TITULO[normalizar(titulo)]
    if (porTitulo) return porTitulo
  }
  if (url) return iconForUrl(url)
  return Folder
}

export function MenuIcone({
  icone,
  titulo,
  url,
  size = 18,
  className,
}: {
  icone?: string | null
  titulo?: string
  url?: string
  size?: number
  className?: string
}) {
  const Icon = resolveMenuIcon(icone, titulo, url)
  return <Icon size={size} className={className} />
}
