import type { InfoContent } from "./types"

export const crmContent: Record<string, InfoContent> = {
  // ==================== DASHBOARD ====================
  "/comercial/crm": {
    title: "Dashboard CRM",
    description: "Visão geral do CRM com métricas de leads, empresas, pipeline comercial, atividades recentes e previsão de receita. Central de comando para o time comercial.",
    rules: [
      "Os cards de resumo (Leads, Empresas, Oportunidades) são clicáveis — levam direto para a lista correspondente.",
      "O funil mostra a quantidade de oportunidades em cada etapa do pipeline.",
      "A previsão de receita é calculada com base no valor estimado das oportunidades em aberto.",
      "O gráfico de previsão mensal é atualizado automaticamente com dados da IA Comercial.",
      "Use as Ações Rápidas para criar novos registros sem sair do dashboard.",
    ],
    fields: [
      { name: "Pipeline (Funil)", desc: "Quantidade de oportunidades por estágio (Novo → Qualificação → Proposta → Negociação → Fechado)" },
      { name: "Previsão de Receita", desc: "Soma dos valores estimados das oportunidades abertas" },
      { name: "Top Empresas", desc: "5 empresas com maior valor total em pipeline" },
      { name: "Atividades Recentes", desc: "Últimas 10 movimentações registradas na timeline" },
    ],
  },

  // ==================== LEADS ====================
  "/comercial/crm/leads": {
    title: "Leads",
    description: "Lista de leads captados por diferentes origens: site, WhatsApp, indicação, prospecção ativa ou eventos. Aqui você gerencia o primeiro contato com potenciais clientes.",
    rules: [
      "Leads NOVOS devem ser contatados em até 24h para maior taxa de conversão.",
      "O score IA (0-100) é preenchido automaticamente pela inteligência artificial, indicando a probabilidade de conversão.",
      "Lead QUALIFICADO pode ser convertido em Empresa — isso cria um registro de empresa no CRM.",
      "Lead PERDIDO pode ser reativado automaticamente após 90 dias pela IA Comercial.",
      "A coluna Score IA mostra: verde (≥70), amarelo (40-69), vermelho (<40).",
    ],
    fields: [
      { name: "Nome", desc: "Nome completo do contato" },
      { name: "Contato", desc: "E-mail e telefone do lead" },
      { name: "Empresa", desc: "Empresa onde o lead trabalha (se informado)" },
      { name: "Score IA", desc: "Pontuação de 0-100 calculada pela IA Comercial — quanto maior, maior a chance de conversão" },
      { name: "Origem", desc: "Como o lead foi captado: Site, WhatsApp, Indicação, Prospecção, Evento, Ligação, E-mail" },
      { name: "Status", desc: "Etapa atual: Novo → Contatado → Qualificado → Convertido → Perdido" },
    ],
  },
  "/comercial/crm/leads/novo": {
    title: "Novo Lead",
    description: "Cadastre manualmente um lead captado por qualquer canal. Quanto mais informações preencher, melhor a IA poderá classificar o lead automaticamente.",
    rules: [
      "Apenas o nome é obrigatório — os demais campos podem ser preenchidos depois.",
      "Se o lead já tiver um CNPJ, é melhor cadastrá-lo direto como Empresa.",
      "Todo lead inicia com status NOVO.",
      "O responsável padrão é o usuário logado, mas pode ser alterado.",
    ],
    fields: [
      { name: "Nome", desc: "Nome completo do contato (obrigatório)" },
      { name: "E-mail / Telefone", desc: "Canais de contato principais" },
      { name: "Origem", desc: "Selecione como o lead foi captado" },
      { name: "Responsável", desc: "Quem vai fazer o primeiro contato" },
    ],
  },

  // ==================== EMPRESAS ====================
  "/comercial/crm/empresas": {
    title: "Empresas",
    description: "Cadastro de empresas no CRM. Cada empresa pode ter múltiplos contatos, oportunidades, propostas, visitas e um histórico completo na timeline.",
    rules: [
      "O CNPJ é único — não é possível cadastrar duas empresas com o mesmo CNPJ.",
      "Empresas podem ser criadas manualmente ou convertidas de leads qualificados.",
      "Uma empresa CONVERTIDO_CLIENTE é automaticamente sincronizada com o cadastro de Clientes do PDM.",
      "Ao clicar no nome da empresa, você abre o detalhe completo com timeline, WhatsApp e resumo IA.",
    ],
    fields: [
      { name: "Razão Social", desc: "Nome jurídico da empresa (obrigatório)" },
      { name: "CNPJ", desc: "Formato XX.XXX.XXX/XXXX-XX — valida duplicidade" },
      { name: "Segmento", desc: "Ramo de atuação da empresa" },
      { name: "Status", desc: "Novo, Qualificado, Convertido Cliente, Perdido, Inativo" },
    ],
  },
  "/comercial/crm/empresas/novo": {
    title: "Nova Empresa",
    description: "Cadastre uma nova empresa no CRM. O cadastro pode ser feito manualmente ou através da conversão de um lead qualificado.",
    rules: [
      "A razão social é obrigatória; o CNPJ é recomendado para evitar duplicidade.",
      "Empresas sem CNPJ podem ser cadastradas, mas a validação de unicidade não será aplicada.",
      "Após criar, você pode adicionar contatos, oportunidades e visitas.",
    ],
    fields: [
      { name: "Razão Social", desc: "Nome jurídico da empresa (obrigatório)" },
      { name: "CNPJ", desc: "Cadastro Nacional de Pessoa Jurídica" },
      { name: "Segmento", desc: "Ramo de atuação (ex: Confecção, Estamparia, Têxtil)" },
      { name: "Responsável", desc: "Representante comercial responsável pela conta" },
    ],
  },
  "/comercial/crm/empresas/[id]": {
    title: "Detalhe da Empresa",
    description: "Visão completa de uma empresa no CRM: dados cadastrais, contatos, timeline, WhatsApp e resumo gerado por IA. Tudo que você precisa saber sobre a conta.",
    rules: [
      "A Timeline mostra todo o histórico de interações: leads, oportunidades, visitas, tarefas, propostas e mensagens WhatsApp.",
      "O WhatsApp permite enviar e receber mensagens diretamente pelo sistema (integrado com Evolution API + n8n).",
      "O Resumo IA é gerado automaticamente, consolidando as informações mais relevantes da empresa.",
      "Para editar os dados, clique em Editar no topo da página.",
    ],
    fields: [
      { name: "Timeline", desc: "Histórico completo de eventos da empresa em ordem cronológica" },
      { name: "WhatsApp", desc: "Painel de conversas WhatsApp vinculadas à empresa" },
      { name: "Resumo IA", desc: "Resumo inteligente com sugestões geradas pela IA Comercial" },
      { name: "Contatos", desc: "Pessoas de contato da empresa com cargo, e-mail e telefone" },
    ],
  },

  // ==================== OPORTUNIDADES ====================
  "/comercial/crm/oportunidades": {
    title: "Oportunidades",
    description: "Lista de oportunidades comerciais em andamento. Cada oportunidade representa uma negociação em potencial com uma empresa, com valor estimado e estágio no pipeline.",
    rules: [
      "O pipeline segue o fluxo: Novo → Qualificação → Proposta → Negociação → Fechado Ganho/Perdido.",
      "Use o Kanban para arrastar oportunidades entre estágios do pipeline.",
      "Oportunidades FECHADO_PERDIDO podem ser reativadas pela IA após 90 dias.",
      "Ao fechar como GANHO, a empresa é automaticamente sincronizada como Cliente no PDM.",
    ],
    fields: [
      { name: "Título", desc: "Nome da oportunidade (ex: Venda de 500m de malha)" },
      { name: "Empresa", desc: "Empresa vinculada à oportunidade" },
      { name: "Valor Estimado", desc: "Valor potencial da negociação" },
      { name: "Status", desc: "Estágio no pipeline: Novo → Qualificação → Proposta → Negociação → Fechado" },
    ],
  },
  "/comercial/crm/oportunidades/novo": {
    title: "Nova Oportunidade",
    description: "Registre uma nova oportunidade de negócio. Toda oportunidade deve estar vinculada a uma empresa existente no CRM.",
    rules: [
      "A empresa deve estar cadastrada no CRM antes de criar a oportunidade.",
      "O valor estimado é opcional, mas recomendado para cálculo de forecast.",
      "A oportunidade inicia como NOVO e segue o pipeline até o fechamento.",
      "É possível vincular a oportunidade a um lead de origem.",
    ],
    fields: [
      { name: "Título", desc: "Descrição resumida da oportunidade (obrigatório)" },
      { name: "Empresa", desc: "Empresa vinculada (autocomplete)" },
      { name: "Valor Estimado", desc: "Valor potencial da negociação" },
      { name: "Probabilidade", desc: "Chance estimada de fechamento (0-100%)" },
    ],
  },
  "/comercial/crm/oportunidades/[id]": {
    title: "Detalhe da Oportunidade",
    description: "Acompanhe o andamento de uma oportunidade: dados da negociação, timeline, propostas vinculadas e ações disponíveis.",
    rules: [
      "A timeline da oportunidade mostra todas as interações relacionadas.",
      "Alterar o status registra automaticamente na timeline.",
      "Ao fechar como PERDIDO, informe o motivo para análise futura.",
    ],
    fields: [
      { name: "Valor Estimado", desc: "Valor potencial registrado para a oportunidade" },
      { name: "Status", desc: "Estágio atual no pipeline comercial" },
      { name: "Motivo da Perda", desc: "Preenchido quando a oportunidade é perdida — usado pela IA para análise" },
    ],
  },
  "/comercial/crm/oportunidades/kanban": {
    title: "Kanban de Oportunidades",
    description: "Quadro visual com drag-and-drop para gerenciar o pipeline comercial. Arraste oportunidades entre colunas para atualizar o status automaticamente.",
    rules: [
      "Arraste um card para outra coluna para mudar o estágio da oportunidade.",
      "Ao arrastar para FECHADO_PERDIDO, um modal solicitará o motivo da perda.",
      "Apenas usuários com permissão podem mover cards entre estágios.",
      "Cada card mostra o título, empresa, valor e probabilidade da oportunidade.",
      "Clique no card para ver detalhes completos.",
    ],
    fields: [
      { name: "Colunas", desc: "Pipeline: Novo → Qualificação → Proposta → Negociação → Ganho/Perdido" },
      { name: "Card", desc: "Cada card = uma oportunidade com valor e probabilidade" },
      { name: "Drag & Drop", desc: "Arraste para mover entre estágios — a timeline registra automaticamente" },
    ],
  },

  // ==================== VISITAS ====================
  "/comercial/crm/visitas": {
    title: "Visitas",
    description: "Agenda de visitas comerciais. Registre e acompanhe visitas presenciais, videochamadas e contatos telefônicos com empresas.",
    rules: [
      "Visitas podem ser presenciais, por vídeo ou telefone.",
      "Visitas FUTURAS aparecem destacadas — são compromissos agendados.",
      "O status da visita muda automaticamente com base na data.",
      "É possível registrar fotos da visita no detalhe.",
    ],
    fields: [
      { name: "Empresa", desc: "Empresa visitada" },
      { name: "Data", desc: "Data e horário da visita" },
      { name: "Tipo", desc: "Presencial, Vídeo ou Telefone" },
      { name: "Status", desc: "Agendada, Realizada, Cancelada" },
    ],
  },
  "/comercial/crm/visitas/novo": {
    title: "Nova Visita",
    description: "Agende uma visita a uma empresa. Informe o tipo, data, contato e observações sobre o objetivo da visita.",
    rules: [
      "Selecione a empresa (autocomplete com empresas cadastradas).",
      "Escolha o tipo: Presencial (vai até o cliente), Vídeo (chamada online) ou Telefone.",
      "A data e horário definem quando a visita será realizada.",
      "O contato é opcional — você pode selecionar um contato cadastrado da empresa.",
    ],
    fields: [
      { name: "Empresa", desc: "Empresa a ser visitada (obrigatório)" },
      { name: "Tipo", desc: "Presencial, Vídeo ou Telefone" },
      { name: "Data/Hora", desc: "Quando a visita será realizada" },
      { name: "Observações", desc: "Objetivo e pauta da visita" },
    ],
  },
  "/comercial/crm/visitas/[id]": {
    title: "Detalhe da Visita",
    description: "Acompanhe os detalhes de uma visita: dados do encontro, fotos, relato do representante e próximo passo.",
    rules: [
      "Visitas realizadas podem ter fotos anexadas.",
      "O relato da visita ajuda a IA a gerar resumo da empresa.",
      "É possível alterar o status da visita (Realizada, Cancelada).",
    ],
    fields: [
      { name: "Fotos", desc: "Imagens registradas durante a visita" },
      { name: "Relato", desc: "Descrição do que foi tratado na visita" },
      { name: "Próximo Passo", desc: "Ação de follow-up acordada com o cliente" },
    ],
  },

  // ==================== TAREFAS ====================
  "/comercial/crm/tarefas": {
    title: "Tarefas",
    description: "Lista de tarefas comerciais: ligações, reuniões, propostas a enviar e follow-ups. Gerencie seu dia a dia comercial com prazos e prioridades.",
    rules: [
      "Tarefas podem ser dos tipos: Ligação, Reunião, Proposta ou Tarefa genérica.",
      "Tarefas PENDENTES com data vencida aparecem em vermelho no topo.",
      "A IA Comercial pode criar tarefas de reativação automaticamente.",
      "Marque como CONCLUÍDA quando finalizar — a timeline registra automaticamente.",
    ],
    fields: [
      { name: "Título", desc: "Descrição resumida da tarefa" },
      { name: "Tipo", desc: "Ligação, Reunião, Proposta ou Tarefa" },
      { name: "Prioridade", desc: "Baixa, Média ou Alta" },
      { name: "Data Prevista", desc: "Prazo para conclusão da tarefa" },
      { name: "Status", desc: "Pendente, Em Andamento ou Concluída" },
    ],
  },

  // ==================== PROPOSTAS ====================
  "/comercial/crm/propostas": {
    title: "Propostas",
    description: "Lista de propostas comerciais enviadas. Acompanhe o status de cada proposta: enviada, aceita, recusada ou em revisão.",
    rules: [
      "Cada proposta está vinculada a uma empresa e opcionalmente a uma oportunidade.",
      "Ao ACEITAR uma proposta, a oportunidade vinculada avança no pipeline.",
      "Propostas podem ser impressas em PDF diretamente do sistema.",
      "O valor total e as condições são registrados para controle histórico.",
    ],
    fields: [
      { name: "Empresa", desc: "Empresa destinatária da proposta" },
      { name: "Valor Total", desc: "Valor total da proposta" },
      { name: "Status", desc: "Enviada, Aceita, Recusada ou Em Revisão" },
      { name: "Validade", desc: "Prazo de validade da proposta" },
    ],
  },
  "/comercial/crm/propostas/novo": {
    title: "Nova Proposta",
    description: "Crie uma proposta comercial para uma empresa. Preencha os dados, valores, condições e itens da proposta.",
    rules: [
      "A empresa é obrigatória — a oportunidade é opcional.",
      "O prazo de validade define até quando a proposta pode ser aceita.",
      "Após criar, você pode imprimir em PDF.",
      "Propostas podem ser revisadas e reenviadas.",
    ],
    fields: [
      { name: "Empresa", desc: "Empresa destinatária (obrigatório)" },
      { name: "Oportunidade", desc: "Oportunidade vinculada (opcional)" },
      { name: "Valor Total", desc: "Valor comercial da proposta" },
      { name: "Validade", desc: "Prazo para aceitação da proposta" },
    ],
  },
  "/comercial/crm/propostas/[id]": {
    title: "Detalhe da Proposta",
    description: "Visualize os detalhes de uma proposta: dados comerciais, condições, timeline e ações de PDF.",
    rules: [
      "Clique em Imprimir para gerar o PDF da proposta.",
      "Altere o status conforme o retorno do cliente.",
      "Propostas ACEITAS podem gerar automaticamente um pedido.",
    ],
    fields: [
      { name: "Status", desc: "Enviada, Aceita, Recusada ou Em Revisão" },
      { name: "Valor Total", desc: "Valor registrado na proposta" },
      { name: "Condições", desc: "Forma de pagamento e condições comerciais" },
    ],
  },

  // ==================== REGIÕES ====================
  "/comercial/crm/regioes": {
    title: "Regiões",
    description: "Cadastro de regiões comerciais. Organize o território de vendas por regiões geográficas com gerentes responsáveis.",
    rules: [
      "Cada região pode ter um gerente responsável.",
      "Regiões são usadas para organizar equipes comerciais.",
      "Apenas ADMIN/SUDO podem excluir regiões.",
      "Regiões ativas aparecem nos filtros de relatórios.",
    ],
    fields: [
      { name: "Nome", desc: "Nome da região (ex: São Paulo, Nordeste)" },
      { name: "UF", desc: "Unidade Federativa (opcional)" },
      { name: "Gerente", desc: "Usuário responsável pela região" },
    ],
  },

  // ==================== EQUIPES ====================
  "/comercial/crm/equipes": {
    title: "Equipes",
    description: "Cadastro de equipes comerciais. Cada equipe pertence a uma região e tem um responsável. Organize a hierarquia comercial da empresa.",
    rules: [
      "Cada equipe está vinculada a uma região.",
      "O responsável pela equipe é o líder/coordenador.",
      "Apenas ADMIN/SUDO podem excluir equipes.",
      "Equipes ativas aparecem na distribuição de leads e relatórios.",
    ],
    fields: [
      { name: "Nome", desc: "Nome da equipe comercial" },
      { name: "Região", desc: "Região geográfica da equipe" },
      { name: "Responsável", desc: "Líder/coordenador da equipe" },
    ],
  },

  // ==================== CAMPANHAS ====================
  "/comercial/crm/campanhas": {
    title: "Campanhas",
    description: "Lista de campanhas de marketing e comunicação. Gerencie campanhas de e-mail, WhatsApp, redes sociais e eventos.",
    rules: [
      "Tipos de campanha: E-mail, WhatsApp, Redes Sociais ou Evento.",
      "O status define se a campanha está ativa, pausada ou concluída.",
      "Leads gerados por campanhas são contabilizados automaticamente.",
      "O ROI pode ser calculado a partir do custo de aquisição vs leads gerados.",
    ],
    fields: [
      { name: "Nome", desc: "Identificação da campanha" },
      { name: "Tipo", desc: "E-mail, WhatsApp, Redes Sociais ou Evento" },
      { name: "Período", desc: "Data de início e fim da campanha" },
      { name: "Orçamento", desc: "Valor investido na campanha" },
      { name: "Leads Gerados", desc: "Quantidade de leads captados pela campanha" },
    ],
  },
  "/comercial/crm/campanhas/nova": {
    title: "Nova Campanha",
    description: "Crie uma nova campanha de marketing. Defina o tipo, período, orçamento e público-alvo.",
    rules: [
      "O nome é obrigatório; os demais campos são opcionais.",
      "Campanhas ativas aparecem no dashboard.",
      "O custo de aquisição é calculado automaticamente ao informar leads gerados.",
    ],
    fields: [
      { name: "Nome", desc: "Nome da campanha (obrigatório)" },
      { name: "Tipo", desc: "E-mail, WhatsApp, Redes Sociais ou Evento" },
      { name: "Orçamento", desc: "Valor investido" },
      { name: "Período", desc: "Data de início e fim" },
    ],
  },
  "/comercial/crm/campanhas/[id]": {
    title: "Detalhe da Campanha",
    description: "Acompanhe o desempenho de uma campanha: métricas, leads gerados, custo e resultados.",
    rules: [
      "Edite os campos diretamente para atualizar métricas.",
      "Leads gerados podem ser vinculados manualmente.",
      "O custo de aquisição (CAC) é calculado: orçamento ÷ leads gerados.",
    ],
    fields: [
      { name: "Status", desc: "Ativa, Pausada ou Concluída" },
      { name: "Leads Gerados", desc: "Total de leads captados" },
      { name: "Custo Aquisição", desc: "Custo médio por lead (CAC)" },
    ],
  },

  // ==================== RELATÓRIOS ====================
  "/comercial/crm/relatorios": {
    title: "Relatórios CRM",
    description: "Análise consolidada dos dados do CRM com gráficos de leads por origem, pipeline, performance por representante, tarefas e taxa de conversão.",
    rules: [
      "Os dados são atualizados em tempo real com base no banco.",
      "Use os gráficos para identificar gargalos no pipeline.",
      "A taxa de conversão considera apenas oportunidades fechadas (ganhas vs perdidas).",
      "Os relatórios ajudam a IA Comercial a gerar previsões mais precisas.",
    ],
    fields: [
      { name: "Leads por Origem", desc: "Distribuição dos leads pelo canal de captação" },
      { name: "Pipeline", desc: "Quantidade de oportunidades por estágio" },
      { name: "Representantes", desc: "Oportunidades abertas por vendedor" },
      { name: "Propostas por Status", desc: "Distribuição das propostas: enviadas, aceitas, recusadas" },
      { name: "Conversão", desc: "Taxa de conversão geral do funil comercial" },
    ],
  },

  // ==================== TREINAMENTO ====================
  "/comercial/crm/treinamento": {
    title: "Treinamento CRM",
    description: "Central de documentação e treinamento do CRM. Aqui você encontra explicações detalhadas de cada tela, campo por campo, com pré-requisitos, links para POPs e vídeos tutoriais.",
    rules: [
      "Navegue pelos módulos e expanda para ver as lições disponíveis",
      "Cada lição documenta uma tela específica do CRM",
      "Use o botão Exportar PDF para gerar um documento com cabeçalho e rodapé",
      "Links de POPs e vídeos tutoriais abrem em nova aba",
    ],
    fields: [],
  },
  "/comercial/crm/treinamento/admin": {
    title: "Gerenciar Treinamento",
    description: "Gerencie os módulos e lições do treinamento. Crie, edite ou remova conteúdo de documentação do CRM.",
    rules: [
      "Módulos agrupam lições relacionadas",
      "Cada lição contém documentação em markdown",
      "É possível adicionar links de POPs e vídeos tutoriais em cada lição",
      "Marque como inativo para ocultar sem deletar",
    ],
    fields: [],
  },
  "/comercial/crm/treinamento/admin/novo": {
    title: "Nova Lição de Treinamento",
    description: "Crie uma nova lição de treinamento com conteúdo markdown, pré-requisitos e links multimídia.",
    rules: [
      "Selecione o módulo ao qual a lição pertence",
      "Preencha o conteúdo em markdown para formatação rica",
      "Adicione links de POPs (procedimentos) e vídeos tutoriais",
      "O pathname relacionado vincula a lição a uma tela específica do CRM",
    ],
    fields: [
      { name: "Módulo", desc: "Obrigatório. Módulo de treinamento ao qual esta lição pertence" },
      { name: "Título", desc: "Obrigatório. Nome da lição que aparecerá na lista" },
      { name: "Ordem", desc: "Posição da lição dentro do módulo" },
      { name: "Pathname relacionado", desc: "Caminho da tela CRM relacionada (ex: /comercial/crm/leads)" },
      { name: "Pré-requisitos", desc: "Lista de cadastros indispensáveis para usar a tela documentada" },
      { name: "Conteúdo", desc: "Documentação em markdown. Use ## para títulos, **negrito**, - listas" },
      { name: "Links POP", desc: "Links para Procedimentos Operacionais Padrão relacionados" },
      { name: "Links Vídeos", desc: "Links para vídeos tutoriais explicativos" },
    ],
  },
}
