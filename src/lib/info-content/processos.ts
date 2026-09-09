import type { InfoContent } from "./types"

export const processosContent: Record<string, InfoContent> = {
  "/processos": {
    title: "Engenharia de Processos",
    description: "Módulo de documentação e mapeamento dos processos da organização. A hierarquia vai de Empresa até Atividade, com o Processo como objeto central.",
    rules: [
      "A hierarquia é: Empresa → Site → Área → Processo → Subprocesso → Atividade.",
      "O Processo é o objeto central: documenta objetivo, responsável, entradas/saídas, fornecedores e clientes.",
      "Indicadores, riscos e controles são registrados em listas simples (uma linha por item).",
      "O status indica a maturidade do processo; a versão é editada manualmente quando o documento muda.",
    ],
  },
  "/processos/empresas": {
    title: "Empresas",
    description: "Organizações que compõem o workspace de engenharia de processos. A Empresa é o nível mais alto da hierarquia.",
    rules: [
      "Uma empresa pode ter um ou mais sites (unidades físicas).",
      "Empresas inativas não aparecem na seleção de novos cadastros.",
      "Só é possível excluir uma empresa sem sites vinculados.",
    ],
    fields: [
      { name: "Nome", desc: "Nome da organização" },
      { name: "CNPJ", desc: "CNPJ da empresa (opcional)" },
      { name: "Status", desc: "Ativo ou inativo" },
    ],
  },
  "/processos/sites": {
    title: "Sites",
    description: "Unidades físicas (plantas, filiais) de uma empresa onde os processos acontecem.",
    rules: [
      "Todo site pertence a uma empresa.",
      "Cada site pode conter várias áreas.",
      "Só é possível excluir um site sem áreas vinculadas.",
    ],
    fields: [
      { name: "Nome", desc: "Nome da unidade/filial" },
      { name: "Empresa", desc: "Empresa à qual o site pertence" },
      { name: "Cidade/UF", desc: "Localização da unidade (opcional)" },
    ],
  },
  "/processos/areas": {
    title: "Áreas",
    description: "Setores ou departamentos dentro de um site onde os processos são executados.",
    rules: [
      "Toda área pertence a um site.",
      "Cada área pode conter vários processos.",
      "Excluir uma área exige que ela não tenha processos vinculados.",
    ],
    fields: [
      { name: "Nome", desc: "Nome do setor/departamento" },
      { name: "Site", desc: "Site ao qual a área pertence" },
    ],
  },
  "/processos/processos": {
    title: "Processos",
    description: "Objeto central do mapeamento. Cada processo documenta o fluxo de trabalho de uma área com objetivo, entradas, saídas e responsabilidades.",
    rules: [
      "Todo processo pertence a uma área.",
      "Entradas, saídas, fornecedores e clientes são listas de texto (uma linha por item).",
      "Indicadores, riscos e controles são registrados em JSON (uma linha por item na edição).",
      "O status reflete a situação do documento (ex: Rascunho, Em revisão, Aprovado).",
      "Alterar a versão é manual — incremente quando houver mudança relevante.",
    ],
    fields: [
      { name: "Nome", desc: "Nome do processo (ex: Beneficiamento de Malha)" },
      { name: "Código", desc: "Código de referência (opcional)" },
      { name: "Responsável", desc: "Dono do processo" },
      { name: "Status", desc: "Situação do documento do processo" },
      { name: "Versão", desc: "Versão do documento" },
    ],
  },
  "/processos/subprocessos": {
    title: "Subprocessos",
    description: "Grandes etapas em que um processo é decomposto. Cada subprocesso pertence a um processo e pode conter atividades.",
    rules: [
      "Todo subprocesso pertence a um processo.",
      "A ordem define a sequência de execução dentro do processo.",
      "Subprocessos inativos não aparecem no detalhe do processo.",
    ],
    fields: [
      { name: "Nome", desc: "Nome da etapa" },
      { name: "Processo", desc: "Processo ao qual pertence" },
      { name: "Ordem", desc: "Sequência de execução" },
    ],
  },
  "/processos/atividades": {
    title: "Atividades",
    description: "Unidades de execução do mapeamento. Cada atividade representa uma ação concreta executada dentro de um subprocesso.",
    rules: [
      "Toda atividade pertence a um subprocesso.",
      "O tipo define a natureza da atividade: Manual, Automática, Decisão ou Espera.",
      "A ordem define a sequência de execução dentro do subprocesso.",
    ],
    fields: [
      { name: "Nome", desc: "Nome da atividade" },
      { name: "Tipo", desc: "Manual, Automática, Decisão ou Espera" },
      { name: "Ordem", desc: "Sequência de execução" },
      { name: "Responsável/Duração", desc: "Informações complementares (opcional)" },
    ],
  },
  "/processos/visual": {
    title: "Diagramas",
    description: "Representação visual dos processos. Um conhecimento, múltiplas representações: o modelo semântico é a fonte única e as representações (Mermaid, BPMN, canvas) são derivadas dele.",
    rules: [
      "O modelo semântico guarda atividades, decisões e fluxos — é o que de fato é salvo.",
      "As abas Mermaid, BPMN e Canvas são representações editadas a partir do modelo.",
      "Na aba Mermaid, salvar o texto re-importa o modelo semântico (o texto vira fonte).",
      "Toda alteração no modelo deriva automaticamente Mermaid e resumo markdown.",
    ],
    fields: [
      { name: "Nome", desc: "Nome do diagrama/processo" },
      { name: "Tipo", desc: "Fluxograma, BPMN, Mapa mental ou Canvas livre" },
      { name: "Descrição", desc: "Resumo do diagrama (opcional)" },
    ],
  },
  "/processos/treinamento": {
    title: "Treinamento Engenharia de Processos",
    description: "Central de documentação e treinamento da Engenharia de Processos. Aqui você encontra explicações detalhadas de cada tela, campo por campo, com pré-requisitos, links para POPs e vídeos tutoriais.",
    rules: [
      "Os módulos ativos aparecem como acordeões; clique em um módulo para ver suas lições.",
      "Cada lição aponta para a tela relacionada do módulo de processos.",
      "O botão Exportar Treinamento Completo gera um documento PDF com todos os módulos e lições ativas.",
    ],
  },
  "/processos/treinamento/admin": {
    title: "Gerenciar Treinamento",
    description: "Gerencie os módulos e lições do treinamento da Engenharia de Processos. Crie, edite ou remova conteúdo de documentação.",
    rules: [
      "Cada módulo pode conter várias lições.",
      "Remover um módulo remove também as lições vinculadas (cascade).",
      "Use o botão Novo Módulo para criar um módulo com título e descrição.",
    ],
  },
  "/processos/treinamento/admin/novo": {
    title: "Nova Lição",
    description: "Crie uma nova lição de treinamento com conteúdo markdown, pré-requisitos e links multimídia.",
    fields: [
      { name: "Módulo", desc: "Obrigatório. Módulo de treinamento ao qual esta lição pertence" },
      { name: "Título", desc: "Obrigatório. Título da lição" },
      { name: "Ordem", desc: "Sequência da lição dentro do módulo" },
      { name: "Pathname relacionado", desc: "Tela do módulo de processos à qual a lição se refere" },
      { name: "Pré-requisitos", desc: "Cadastros indispensáveis antes de usar a tela" },
      { name: "Conteúdo (Markdown)", desc: "Corpo da lição em markdown" },
    ],
  },
  "/processos/treinamento/": {
    title: "Lição de Treinamento",
    description: "Leia o conteúdo completo da lição de treinamento. Aqui você encontra a documentação detalhada da tela, pré-requisitos, links para POPs e vídeos tutoriais.",
    rules: [
      "Use Exportar PDF para gerar a lição em PDF.",
      "Navegue entre lições anterior e próxima pelas setas no rodapé.",
    ],
  },
  "/processos/treinamento/admin/": {
    title: "Editar Lição",
    description: "Edite os dados da lição de treinamento: módulo, título, conteúdo markdown, pré-requisitos e links multimídia.",
    fields: [
      { name: "Módulo", desc: "Módulo de treinamento ao qual a lição pertence" },
      { name: "Título", desc: "Título da lição" },
      { name: "Ativo", desc: "Se desmarcado, a lição fica oculta das listas públicas" },
    ],
  },
}