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
    icone: ShoppingCart,
    titulo: "Vendas e clientes",
    resumo:
      "Cadastre clientes, acompanhe propostas e pedidos e organize a equipe de vendas em um único painel.",
  },
  {
    icone: Layers,
    titulo: "Desenvolvimento do produto",
    resumo:
      "Ficha técnica, composição, receitas e versões de cada tecido — do pedido do cliente até a produção.",
  },
  {
    icone: FlaskConical,
    titulo: "Amostras",
    resumo:
      "Peça, acompanhe e aprove amostras sem perder o histórico do que foi testado e aprovado.",
  },
  {
    icone: Factory,
    titulo: "Produção",
    resumo:
      "Veja o que está planejado, o que está em produção e o que já foi concluído, em tempo real.",
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
    resumo:
      "Documente como cada área trabalha, com fluxogramas claros e de fácil entendimento.",
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
      "Romaneios de carga, conferência de tecido cru e o relatório de frete das notas fiscais.",
  },
  {
    icone: BarChart3,
    titulo: "Relatórios e indicadores",
    resumo:
      "Painéis com números, curvas e previsões a partir das suas próprias planilhas.",
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
    resumo:
      "Calculadora de regra de três, conversão de numeração de fios e consulta de CNPJ.",
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
    titulo: "Tudo em um só lugar",
    resumo: "Vendas, desenvolvimento, produção e qualidade no mesmo sistema, sem papéis soltos.",
  },
  {
    titulo: "Menos retrabalho",
    resumo: "Cada informação é preenchida uma vez e reaproveitada por todas as áreas.",
  },
  {
    titulo: "Decisões com dados",
    resumo: "Painéis e relatórios mostram a situação real do negócio em segundos.",
  },
  {
    titulo: "Acesso de qualquer lugar",
    resumo: "Funciona no computador e no celular, do escritório ou de dentro da fábrica.",
  },
  {
    titulo: "Fala com os seus sistemas",
    resumo: "Integra com os ERPs Systêxtil e Bling, além de Google Drive e WhatsApp.",
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
    titulo: "Cadastre a sua operação",
    resumo: "Clientes, produtos, equipe e máquinas — o PDM organiza tudo em poucos cliques.",
  },
  {
    titulo: "Acompanhe o dia a dia",
    resumo: "Tarefas, chamados, amostras e indicadores sempre à mão, em painéis simples de ler.",
  },
]
