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
}
