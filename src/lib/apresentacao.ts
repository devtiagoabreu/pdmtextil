import {
  BarChart3,
  Bot,
  Calendar,
  ClipboardCheck,
  Factory,
  FlaskConical,
  GitBranch,
  Headphones,
  Inbox,
  LayoutDashboard,
  Layers,
  Plug,
  Puzzle,
  ShieldCheck,
  ShoppingCart,
  Truck,
  Wrench,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export interface ModuloApresentacao {
  icone: LucideIcon
  titulo: string
  resumo: string
}

export const CRIADORES = [
  {
    nome: "Tiago de Abreu",
    papel: "Idealizador e desenvolvedor",
  },
  {
    nome: "Sérgio Costa",
    papel: "Cofundador e analista de requisitos",
  },
]

export const MODULOS_APRESENTACAO: ModuloApresentacao[] = [
  {
    icone: Layers,
    titulo: "Desenvolvimento de produtos",
    resumo:
      "O coração do PDM. Gerencia solicitações, fichas técnicas, composição, receitas e versões — antes do pedido.",
  },
  {
    icone: Plug,
    titulo: "Convergência de sistemas",
    resumo:
      "Liga o legado (ERP, planilhas) ao que há de mais novo, por APIs e integrações — sem descartar o que já funciona.",
  },
  {
    icone: LayoutDashboard,
    titulo: "Visualização com Kanban e painéis",
    resumo: "Kanban, listas e painéis: cada equipe enxerga o trabalho do jeito que preferir.",
  },
  {
    icone: Puzzle,
    titulo: "Módulos satélites",
    resumo: "Cobrem o que o seu ERP não tem — sem trocar o que já está em uso.",
  },
  {
    icone: ShoppingCart,
    titulo: "Comercial e CRM",
    resumo:
      "Vendas, leads, propostas e visitas no CRM — junto com o ERP comercial, sem substituí-lo.",
  },
  {
    icone: Inbox,
    titulo: "Solicitações para o desenvolvimento",
    resumo: "Centraliza o que o comercial pede ao desenvolvimento e acompanha até a aprovação.",
  },
  {
    icone: FlaskConical,
    titulo: "Amostras",
    resumo: "Peça, acompanhe e aprove amostras sem perder o histórico.",
  },
  {
    icone: Factory,
    titulo: "Produção do produto em desenvolvimento",
    resumo:
      "Cru, beneficiamento e pilotagem. A produção geral segue no ERP, visível por integração.",
  },
  {
    icone: ClipboardCheck,
    titulo: "Máquinas e vistorias",
    resumo: "Equipamentos, manutenção e vistorias de segurança sempre em dia.",
  },
  {
    icone: Headphones,
    titulo: "Atendimento de chamados",
    resumo: "Chamados de TI e manutenção com prazo e acompanhamento até a solução.",
  },
  {
    icone: GitBranch,
    titulo: "Processos",
    resumo: "Documente o jeito de trabalhar de cada área, com fluxogramas claros.",
  },
  {
    icone: Calendar,
    titulo: "Reuniões",
    resumo: "Pauta, ata e o que ficou combinado — com responsável e prazo.",
  },
  {
    icone: Truck,
    titulo: "Documentos e logística",
    resumo: "Romaneios, conferência de tecido cru e frete das notas, apoiados pelo ERP.",
  },
  {
    icone: BarChart3,
    titulo: "Relatórios e indicadores",
    resumo: "Números, curvas e previsões a partir das suas próprias planilhas.",
  },
  {
    icone: Bot,
    titulo: "WhatsApp com inteligência artificial",
    resumo: "Atendimento automático no WhatsApp e apoio de IA no dia a dia.",
  },
  {
    icone: Wrench,
    titulo: "Ferramentas do dia a dia",
    resumo: "Regra de três, numeração de fios e consulta de CNPJ.",
  },
  {
    icone: ShieldCheck,
    titulo: "Segurança e administração",
    resumo: "Usuários, permissões, integrações e histórico de tudo o que é feito.",
  },
]

export const POSICIONAMENTO =
  "O PDM não tenta ter tudo. É uma ferramenta de integração: faz as ferramentas legadas (ERP, planilhas) convergirem com a tecnologia atual, por APIs. Não substitui o ERP comercial — o foco é o desenvolvimento de produtos e os módulos satélites que faltam no seu ERP."

export const BENEFICIOS = [
  {
    titulo: "Convergência, não substituição",
    resumo: "Liga o legado ao novo, sem descartar o que já funciona.",
  },
  {
    titulo: "Foco no desenvolvimento",
    resumo: "Cuida de tudo o que acontece antes do pedido.",
  },
  {
    titulo: "Vendas no CRM, sem trocar o ERP",
    resumo: "Relacionamento e propostas no CRM; o ERP comercial continua sendo o seu.",
  },
  {
    titulo: "Menos retrabalho",
    resumo: "Um dado preenchido uma vez, reaproveitado por todos.",
  },
  {
    titulo: "Acesso de qualquer lugar",
    resumo: "No computador e no celular, do escritório à fábrica.",
  },
  {
    titulo: "Seus dados protegidos",
    resumo: "Acesso por perfil e histórico de cada ação.",
  },
]

export const PASSOS = [
  {
    titulo: "Entre no sistema",
    resumo: "Cada um acessa com o próprio usuário e vê só o que pode.",
  },
  {
    titulo: "Receba as demandas",
    resumo: "Solicitações do comercial e do desenvolvimento ficam registradas e integradas.",
  },
  {
    titulo: "Desenvolva e acompanhe",
    resumo: "Fichas, amostras e a produção do produto em painéis simples de ler.",
  },
]

export const NO_PDM = [
  "Solicitações do comercial para o desenvolvimento",
  "Demanda interna do desenvolvimento",
  "Fichas técnicas, composição e receitas versionadas",
  "Amostras e pilotagem",
  "Produção do produto em desenvolvimento",
  "CRM: relacionamento, propostas e visitas",
]

export const NO_ERP = [
  "ERP comercial: pedidos e faturamento",
  "Produção geral da fábrica",
  "Estoque, expedição e romaneios",
  "Financeiro e fiscal",
]
