import type { InfoContent } from "./types"

export const dashboardContent: Record<string, InfoContent> = {
  "/dashboard": {
    title: "Dashboard Solicitações",
    description: "Painel principal com métricas e indicadores das solicitações comerciais. Acompanhe o volume de solicitações criadas no mês, status atuais, distribuição por tipo e tendência mensal.",
    rules: [
      "Os dados exibidos refletem o estado atual do banco de dados em tempo real.",
      "O gráfico de tendência mensal mostra os últimos 6 meses.",
      "A distribuição de status considera todas as solicitações cadastradas.",
      "Apenas usuários autenticados têm acesso ao painel.",
    ],
  },
  "/dashboard/amostras": {
    title: "Dashboard Amostras",
    description: "Painel de métricas das amostras de tecido cru e acabamento. Acompanhe o total de amostras, aprovações, reprovações e tendência mensal de criação.",
    rules: [
      "Amostras são vinculadas a um produto cru ou a um acabamento.",
      "O status 'APROVADO' indica que a amostra foi validada pelo cliente ou equipe técnica.",
      "A curva de aprovação mostra a relação entre amostras aprovadas e o total.",
    ],
  },
  "/dashboard/relatorios": {
    title: "Relatórios",
    description: "Central de relatórios gerenciais com métricas e indicadores de desempenho do sistema.",
    rules: [
      "Cada relatório possui filtros próprios para refinar a consulta.",
      "Os dados são extraídos em tempo real do banco de dados.",
      "Relatórios estão disponíveis para usuários ADMIN e SUDO.",
    ],
  },
  "/dashboard/relatorios/atividade-usuario": {
    title: "Atividade por Usuário",
    description: "Relatório de auditoria com o registro de todas as ações realizadas por cada usuário no sistema.",
    rules: [
      "Os logs são gerados automaticamente para ações como deleção, erros, logins e cadastros.",
      "O relatório pode ser filtrado por período, usuário e tipo de ação.",
      "Dados históricos são mantidos conforme política de retenção do sistema.",
    ],
  },
  "/dashboard/relatorios/solicitacoes-criadas": {
    title: "Solicitações de Desenvolvimento Criadas / Deletadas",
    description: "Relatório comparativo entre solicitações de desenvolvimento criadas, deletadas e concluídas, com taxa de sucesso.",
    rules: [
      "A taxa de sucesso é calculada como (concluídas / total criadas) × 100.",
      "Solicitações deletadas são contabilizadas a partir dos logs do sistema.",
      "O gráfico mensal permite visualizar a evolução ao longo do tempo.",
    ],
  },
  "/dashboard/relatorios/tempo-status": {
    title: "Tempo em cada Status (Solic. de Desenvolvimento)",
    description: "Relatório detalhado do tempo que cada solicitação de desenvolvimento permaneceu em cada status do fluxo.",
    rules: [
      "O cálculo do tempo é baseado no histórico de comunicação da solicitação.",
      "O status atual conta o tempo até o momento presente (se não concluído).",
      "A barra proporcional facilita a visualização de gargalos.",
    ],
  },
  "/dashboard/relatorios/tempo-status-amostras": {
    title: "Tempo em cada Status (Amostras de Desenvolvimento)",
    description: "Relatório de tempo por status específico para amostras de desenvolvimento (tecido cru e acabamento).",
    rules: [
      "O histórico é extraído da coluna historico (JSONB) de cada amostra.",
      "Amostras sem histórico registrado não aparecem no relatório.",
      "As abas separam amostras de tecido cru e acabamento.",
    ],
  },
}
