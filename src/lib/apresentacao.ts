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
      "O coração do PDM. Gerencia a demanda do setor de desenvolvimento — solicitações, fichas técnicas, composição, receitas e versões — tudo isso antes de o pedido ser lançado.",
  },
  {
    icone: Plug,
    titulo: "Convergência de sistemas",
    resumo:
      "O PDM é uma ferramenta de integração: conecta ferramentas legadas (ERP, planilhas e sistemas legados) às tecnologias atuais por APIs e integrações — sem jogar fora o que já funciona.",
  },
  {
    icone: LayoutDashboard,
    titulo: "Visualização com Kanban e painéis",
    resumo:
      "Acompanhe demandas, amostras e a produção em quadros Kanban, listas e painéis visuais — cada equipe enxerga o trabalho do jeito que preferir.",
  },
  {
    icone: Puzzle,
    titulo: "Módulos satélites",
    resumo:
      "Reúne módulos que complementam o ERP e cobrem necessidades que muitas vezes não existem nele — sem precisar trocar o que já está em uso.",
  },
  {
    icone: ShoppingCart,
    titulo: "Comercial e CRM",
    resumo:
      "A parte de vendas do PDM é o CRM: leads, propostas, visitas e relacionamento. Ele trabalha junto com o ERP comercial — não substitui.",
  },
  {
    icone: Inbox,
    titulo: "Solicitações para o desenvolvimento",
    resumo:
      "Centraliza as solicitações que o setor comercial envia para o desenvolvimento e acompanha cada uma até a aprovação.",
  },
  {
    icone: FlaskConical,
    titulo: "Amostras",
    resumo:
      "Peça, acompanhe e aprove amostras sem perder o histórico do que foi testado e aprovado.",
  },
  {
    icone: Factory,
    titulo: "Produção do produto em desenvolvimento",
    resumo:
      "Acompanha a produção dos produtos em desenvolvimento — tecido cru, beneficiamento e pilotagem. A produção geral da fábrica continua no ERP, visível por integração.",
  },
  {
    icone: ClipboardCheck,
    titulo: "Máquinas e vistorias",
    resumo:
      "Controle equipamentos, mantenha a manutenção e as vistorias de segurança sempre em dia.",
  },
  {
    icone: Headphones,
    titulo: "Atendimento de chamados",
    resumo:
      "Abra chamados de TI e manutenção, defina prazos e acompanhe cada pedido até a solução.",
  },
  {
    icone: GitBranch,
    titulo: "Processos",
    resumo: "Documente como cada área trabalha, com fluxogramas claros e de fácil entendimento.",
  },
  {
    icone: Calendar,
    titulo: "Reuniões",
    resumo:
      "Registre a pauta, a ata e o que ficou combinado, com responsável e prazo para cada tarefa.",
  },
  {
    icone: Truck,
    titulo: "Documentos e logística",
    resumo:
      "Romaneios de carga, conferência de tecido cru e o relatório de frete das notas fiscais, apoiados nas integrações com o ERP.",
  },
  {
    icone: BarChart3,
    titulo: "Relatórios e indicadores",
    resumo: "Painéis com números, curvas e previsões a partir das suas próprias planilhas.",
  },
  {
    icone: Bot,
    titulo: "WhatsApp com inteligência artificial",
    resumo:
      "Atendimento automático no WhatsApp e apoio de inteligência artificial nas tarefas do dia a dia.",
  },
  {
    icone: Wrench,
    titulo: "Ferramentas do dia a dia",
    resumo: "Calculadora de regra de três, conversão de numeração de fios e consulta de CNPJ.",
  },
  {
    icone: ShieldCheck,
    titulo: "Segurança e administração",
    resumo:
      "Usuários, permissões, integrações com outros sistemas e histórico de tudo que é feito.",
  },
]

export const POSICIONAMENTO =
  "O PDM não tenta ter tudo em um só lugar. Ele é uma ferramenta de integração: faz as ferramentas legadas convergirem com as tecnologias mais atuais, por APIs e integrações, e não substitui o ERP comercial. O foco é o desenvolvimento de produtos — que precisa ser gerenciado — e, com ele, módulos satélites que muitas vezes não existem no seu ERP."

export const BENEFICIOS = [
  {
    titulo: "Convergência, não substituição",
    resumo:
      "Conecta ferramentas legadas às tecnologias atuais, sem jogar fora o que já funciona na empresa.",
  },
  {
    titulo: "Foco no desenvolvimento",
    resumo:
      "Cuida do que acontece antes do pedido: solicitações do comercial e a demanda do próprio setor.",
  },
  {
    titulo: "Vendas no CRM, sem trocar o ERP",
    resumo:
      "O relacionamento e as propostas ficam no CRM do PDM — o ERP comercial continua sendo o seu.",
  },
  {
    titulo: "Menos retrabalho",
    resumo: "Cada informação é preenchida uma vez e reaproveitada por todas as áreas.",
  },
  {
    titulo: "Acesso de qualquer lugar",
    resumo: "Funciona no computador e no celular, do escritório ou de dentro da fábrica.",
  },
  {
    titulo: "Seus dados protegidos",
    resumo: "Acesso por perfil, histórico de ações e informações guardadas com segurança.",
  },
]

export const PASSOS = [
  {
    titulo: "Entre no sistema",
    resumo: "Cada pessoa acessa com o seu próprio usuário e enxerga apenas o que tem permissão.",
  },
  {
    titulo: "Receba e organize as demandas",
    resumo:
      "As solicitações do comercial e a demanda do desenvolvimento ficam registradas e acompanhadas, integradas ao que a empresa já usa.",
  },
  {
    titulo: "Desenvolva e acompanhe",
    resumo:
      "Fichas técnicas, amostras e a produção do produto em desenvolvimento, sempre à mão em painéis simples de ler.",
  },
]

export const NO_PDM = [
  "Solicitações de desenvolvimento (comercial → desenvolvimento)",
  "Demanda interna do setor de desenvolvimento",
  "Fichas técnicas, composição e receitas versionadas",
  "Amostras e pilotagem do produto",
  "Produção do produto em desenvolvimento",
  "CRM: relacionamento, propostas e visitas",
]

export const NO_ERP = [
  "ERP comercial: pedidos de venda e faturamento",
  "Produção geral da fábrica",
  "Estoque, expedição e romaneios",
  "Financeiro e fiscal",
]
