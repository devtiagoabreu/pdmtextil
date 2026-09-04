import type { InfoContent } from "./types"

export const documentosContent: Record<string, InfoContent> = {
  "/documentos": {
    title: "Documentos",
    description:
      "Módulo de documentos operacionais, fiscais e logísticos. Acesse romaneios, pré-DANFE, pedidos e relatórios integrados com sistemas externos.",
    rules: [
      "Os dados são obtidos em tempo real das integrações configuradas em Configurações > Integrações.",
      "Para exibir dados, é necessário ter uma integração ativa com a tela correspondente cadastrada.",
      "As funcionalidades disponíveis dependem das integrações configuradas no sistema.",
    ],
  },
  "/documentos/romaneios": {
    title: "Romaneios",
    description:
      "Consulta e impressão de romaneios de carga. Os dados são obtidos das integrações configuradas que possuem a tela 'romaneios'.",
    rules: [
      "Selecione uma integração para visualizar os romaneios disponíveis.",
      "Use a busca para filtrar itens na lista.",
      "Selecione um ou mais romaneios para impressão em lote.",
      "Clique no ícone de detalhes para ver todas as informações de um romaneio.",
      "Configure a integração em Configurações > Integrações com a tela 'romaneios'.",
    ],
  },
  "/documentos/conferencia-op-tecido-cru": {
    title: "Conferência de OP de Tecelagem",
    description:
      "Consulta e conferência dos rolos gerados por ordem de produção (OP) na tecelagem. Os dados são obtidos da integração com a tela 'conferencia-op-tecido-cru'.",
    rules: [
      "Clique em 'Carregar Todas' para listar os rolos disponíveis (últimos 6 meses, nível 2 / cru).",
      "Digite o número da OP, o número do rolo ou leia o código de barras pela câmera para filtrar os rolos.",
      "Os rolos são agrupados por OP para facilitar a conferência.",
      "O produto (nível, grupo, sub e item) aparece concatenado no cabeçalho de cada OP, pois é o mesmo para todos os rolos.",
      "Na listagem de rolos você vê situação, depósito, endereço, lote e lote do produto.",
      "Use o seletor de ordenação para listar as OPs em ordem crescente ou decrescente (padrão: decrescente).",
      "Funciona no desktop e no celular — a leitura de código de barras usa a câmera do aparelho.",
      "Configure a integração em Configurações > Integrações com a tela 'conferencia-op-tecido-cru'.",
    ],
  },
}
