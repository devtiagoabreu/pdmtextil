import {
  BarChart3,
  Bot,
  Calendar,
  ClipboardCheck,
  Factory,
  FlaskConical,
  GitBranch,
  Headphones,
  Layers,
  Plug,
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
    papel: "Cofundador",
  },
]

export const MODULOS_APRESENTACAO: ModuloApresentacao[] = [
  {
    icone: Layers,
    titulo: "Desenvolvimento de produtos",
    resumo:
      "O coração do PDM. Gerencia a demanda do setor de desenvolvimento — solicitações, fichas técnicas, composição, receitas e versões — tudo antes de o pedido ser lançado.",
  },
  {
    icone: ShoppingCart,
    titulo: "Solicitações do comercial",
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
    icone: Plug,
    titulo: "Conversa com o seu ERP",
    resumo:
      "Integra com o ERP fabril (Systêxtil, Bling e outros) por APIs e integrações, trazendo pedidos, romaneios e a produção da fábrica para dentro do PDM.",
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

export const BENEFICIOS = [
  {
    titulo: "Feito para o desenvolvimento",
    resumo:
      "Tudo o que acontece antes do pedido: solicitações do comercial e a demanda do próprio setor.",
  },
  {
    titulo: "Auxilia o seu ERP, não substitui",
    resumo:
      "O PDM complementa o ERP fabril por APIs — cada sistema cuida do que faz de melhor.",
  },
  {
    titulo: "Menos retrabalho",
    resumo: "Cada informação é preenchida uma vez e reaproveitada por todas as áreas.",
  },
  {
    titulo: "Decisões com dados",
    resumo: "Painéis e relatórios mostram a situação real do desenvolvimento em segundos.",
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
      "As solicitações do comercial e a demanda do desenvolvimento ficam registradas e acompanhadas em um só lugar.",
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
  "Relacionamento, visitas e chamados",
]

export const NO_ERP = [
  "Pedidos de venda e faturamento",
  "Produção geral da fábrica",
  "Estoque, expedição e romaneios",
  "Financeiro e fiscal",
]
