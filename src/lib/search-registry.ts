export type SearchItem = {
  id: string
  label: string
  keywords: string[]
  href: string
  description: string
  module: string
}

export const searchRegistry: SearchItem[] = [
  // Dashboard
  { id: "dashboard-solicitacoes", label: "Dashboard Solicitações de Desenvolvimento", keywords: ["dashboard", "inicio", "home", "painel", "solicitacoes", "metricas", "desenvolvimento"], href: "/dashboard", description: "Painel principal com métricas de solicitações de desenvolvimento", module: "Dashboard" },
  { id: "dashboard-amostras", label: "Dashboard Amostras de Desenvolvimento", keywords: ["dashboard", "amostras", "painel", "metricas", "amostra", "desenvolvimento"], href: "/dashboard/amostras", description: "Painel de métricas de amostras de desenvolvimento", module: "Dashboard" },
  { id: "dashboard-amostra-comercial", label: "Dashboard Amostras Comerciais", keywords: ["dashboard", "amostra", "comercial", "painel", "metricas"], href: "/dashboard/amostra-comercial", description: "Painel de métricas de amostras comerciais", module: "Dashboard" },
  { id: "dashboard-corte", label: "Dashboard Corte", keywords: ["dashboard", "corte", "requisicao", "painel", "metricas", "requisições"], href: "/dashboard/requisicoes-corte", description: "Painel de métricas de requisições de corte", module: "Dashboard" },
  { id: "dashboard-relatorios", label: "Relatórios (Dashboard)", keywords: ["dashboard", "relatorio", "painel", "metricas", "relatorios"], href: "/dashboard/relatorios", description: "Central de relatórios do sistema", module: "Dashboard" },

  // Comercial - Solicitações
  { id: "solicitacoes", label: "Solicitações de Desenvolvimento", keywords: ["solicitacao", "pedido", "comercial", "lista", "solicitacoes", "desenvolvimento"], href: "/comercial/solicitacoes", description: "Lista de solicitações de desenvolvimento", module: "Comercial" },
  { id: "solicitacoes-nova", label: "Nova Solicitação de Desenvolvimento", keywords: ["solicitacao", "nova", "criar", "pedido", "cadastro", "desenvolvimento"], href: "/comercial/solicitacoes/nova", description: "Criar nova solicitação de desenvolvimento", module: "Comercial" },
  { id: "solicitacoes-detalhe", label: "Solicitação de Desenvolvimento (Detalhe)", keywords: ["solicitacao", "detalhe", "editar", "ficha", "desenvolvimento"], href: "/comercial/solicitacoes/[id]", description: "Ficha completa da solicitação de desenvolvimento", module: "Comercial" },
  { id: "solicitacoes-editar", label: "Solicitação de Desenvolvimento (Editar)", keywords: ["solicitacao", "editar", "alterar", "desenvolvimento"], href: "/comercial/solicitacoes/[id]/editar", description: "Editar solicitação de desenvolvimento existente", module: "Comercial" },
  { id: "solicitacoes-kanban", label: "Kanban — Solicitações de Desenvolvimento", keywords: ["solicitacao", "kanban", "quadro", "status", "arrastar", "desenvolvimento"], href: "/comercial/solicitacoes/kanban", description: "Kanban de solicitações de desenvolvimento com drag-and-drop", module: "Comercial" },

  // Comercial - Requisições de Corte
  { id: "requisicoes-corte", label: "Requisições de Corte", keywords: ["requisicao", "corte", "comercial", "lista", "requisicoes"], href: "/comercial/requisicoes-corte", description: "Lista de requisições de corte", module: "Comercial" },
  { id: "requisicoes-corte-nova", label: "Nova Requisição de Corte", keywords: ["requisicao", "corte", "nova", "criar", "cadastro"], href: "/comercial/requisicoes-corte/nova", description: "Criar nova requisição de corte", module: "Comercial" },
  { id: "requisicoes-corte-detalhe", label: "Requisição de Corte (Detalhe)", keywords: ["requisicao", "corte", "detalhe", "editar"], href: "/comercial/requisicoes-corte/[id]", description: "Ficha da requisição de corte", module: "Comercial" },

  // Comercial - Requisições de Amostra Comercial
  { id: "requisicoes-amostra-comercial", label: "Requisições de Amostra Comercial", keywords: ["amostra", "comercial", "requisição", "lista", "amostras"], href: "/comercial/requisicoes-amostra-comercial", description: "Lista de requisições de amostra comercial", module: "Comercial" },
  { id: "requisicoes-amostra-comercial-nova", label: "Nova Requisição de Amostra Comercial", keywords: ["amostra", "comercial", "nova", "criar", "requisição"], href: "/comercial/requisicoes-amostra-comercial/novo", description: "Criar nova requisição de amostra comercial", module: "Comercial" },
  { id: "requisicoes-amostra-comercial-detalhe", label: "Requisição de Amostra Comercial (Detalhe)", keywords: ["amostra", "comercial", "detalhe", "ficha"], href: "/comercial/requisicoes-amostra-comercial/[id]", description: "Ficha completa da requisição de amostra comercial", module: "Comercial" },
  { id: "requisicoes-amostra-comercial-kanban", label: "Kanban — Amostras Comerciais", keywords: ["amostra", "comercial", "kanban", "quadro", "status", "arrastar"], href: "/comercial/requisicoes-amostra-comercial/kanban", description: "Kanban de amostras comerciais com drag-and-drop", module: "Comercial" },

  // Comercial - Clientes
  { id: "clientes", label: "Clientes", keywords: ["cliente", "comercial", "lista", "empresa"], href: "/comercial/clientes", description: "Lista de clientes", module: "Comercial" },
  { id: "clientes-novo", label: "Novo Cliente", keywords: ["cliente", "novo", "criar", "cadastro", "empresa"], href: "/comercial/clientes/novo", description: "Cadastrar novo cliente", module: "Comercial" },
  { id: "clientes-detalhe", label: "Cliente (Detalhe)", keywords: ["cliente", "detalhe", "editar", "ficha"], href: "/comercial/clientes/[id]", description: "Ficha completa do cliente", module: "Comercial" },

  // Cadastros
  { id: "cadastros", label: "Cadastros", keywords: ["cadastro", "dados", "tabelas", "config"], href: "/cadastros", description: "Módulo de cadastros do sistema", module: "Cadastros" },
  { id: "cadastros-clientes", label: "Clientes (Cadastros)", keywords: ["cliente", "cadastro", "lista", "empresa"], href: "/cadastros/clientes", description: "Lista de clientes no módulo de cadastros", module: "Cadastros" },

  // Cadastros - Produtos
  { id: "produto-cru", label: "Produtos (Tecidos/Malhas)", keywords: ["produto", "tecido", "malha", "listagem", "cru"], href: "/cadastros/produto-cru", description: "Lista de produtos (tecidos/malhas)", module: "Cadastros" },
  { id: "produto-cru-detalhe", label: "Produto (Tecido/Malha) (Detalhe)", keywords: ["produto", "tecido", "malha", "detalhe", "editar", "ficha", "cru"], href: "/cadastros/produto-cru/[id]", description: "Ficha completa do produto (tecido/malha)", module: "Cadastros" },

  // Cadastros - Fios
  { id: "fios", label: "Fios", keywords: ["fio", "fios", "listagem", "cadastro"], href: "/cadastros/fios", description: "Lista de fios", module: "Cadastros" },
  { id: "fios-detalhe", label: "Fios (Detalhe)", keywords: ["fio", "detalhe", "editar"], href: "/cadastros/fios/[id]", description: "Ficha do fio", module: "Cadastros" },

  // Cadastros - Fornecedores
  { id: "fornecedores", label: "Fornecedores", keywords: ["fornecedor", "fornecedores", "lista", "parceiro"], href: "/cadastros/fornecedores", description: "Lista de fornecedores", module: "Cadastros" },
  { id: "fornecedores-detalhe", label: "Fornecedores (Detalhe)", keywords: ["fornecedor", "detalhe", "editar"], href: "/cadastros/fornecedores/[id]", description: "Ficha do fornecedor", module: "Cadastros" },

  // Cadastros - Bases Urdume
  { id: "bases-urdume", label: "Bases Urdume", keywords: ["base", "urdume", "listagem", "tecelagem"], href: "/cadastros/bases-urdume", description: "Lista de bases de urdume", module: "Cadastros" },
  { id: "bases-urdume-detalhe", label: "Bases Urdume (Detalhe)", keywords: ["base", "urdume", "detalhe", "editar"], href: "/cadastros/bases-urdume/[id]", description: "Ficha da base de urdume", module: "Cadastros" },

  // Cadastros - Cores
  { id: "cores", label: "Cores", keywords: ["cor", "cores", "lista", "paleta", "tinta"], href: "/cadastros/cores", description: "Lista de cores", module: "Cadastros" },
  { id: "cores-detalhe", label: "Cores (Detalhe)", keywords: ["cor", "detalhe", "editar"], href: "/cadastros/cores/[id]", description: "Ficha da cor", module: "Cadastros" },

  // Cadastros - Estampas
  { id: "estampas", label: "Estampas", keywords: ["estampa", "estampas", "lista", "design", "padrao"], href: "/cadastros/estampas", description: "Lista de estampas", module: "Cadastros" },
  { id: "estampas-detalhe", label: "Estampas (Detalhe)", keywords: ["estampa", "detalhe", "editar"], href: "/cadastros/estampas/[id]", description: "Ficha da estampa", module: "Cadastros" },

  // Cadastros - Produtos Químicos
  { id: "produtos-quimicos", label: "Produtos Químicos", keywords: ["quimico", "produto", "quimica", "insumo", "lista"], href: "/cadastros/produtos-quimicos", description: "Lista de produtos químicos", module: "Cadastros" },
  { id: "produtos-quimicos-detalhe", label: "Produtos Químicos (Detalhe)", keywords: ["quimico", "detalhe", "editar"], href: "/cadastros/produtos-quimicos/[id]", description: "Ficha do produto químico", module: "Cadastros" },

  // Receitas
  { id: "receitas", label: "Receitas de Beneficiamento", keywords: ["receita", "receitas", "formula", "beneficiamento", "quimica"], href: "/cadastros/receitas", description: "Receitas de beneficiamento", module: "Cadastros" },

  // Amostras
  { id: "amostras", label: "Amostras de Desenvolvimento", keywords: ["amostra", "amostras", "lista", "desenvolvimento"], href: "/amostras", description: "Lista de amostras de desenvolvimento", module: "Amostras" },
  { id: "amostras-kanban", label: "Kanban — Amostras de Desenvolvimento", keywords: ["amostra", "kanban", "quadro", "status", "arrastar", "desenvolvimento"], href: "/amostras/kanban", description: "Kanban de amostras de desenvolvimento com drag-and-drop", module: "Amostras" },

  // Relatórios
  { id: "relatorio-atividade-usuario", label: "Relatório: Atividade por Usuário", keywords: ["relatorio", "atividade", "usuario", "log", "auditoria"], href: "/dashboard/relatorios/atividade-usuario", description: "Registro de ações por usuário", module: "Relatórios" },
  { id: "relatorio-criadas-deletadas", label: "Relatório: Criadas / Deletadas (Desenvolvimento)", keywords: ["relatorio", "criadas", "deletadas", "solicitacoes", "sucesso", "desenvolvimento"], href: "/dashboard/relatorios/solicitacoes-criadas", description: "Volume de solicitações de desenvolvimento criadas vs deletadas", module: "Relatórios" },
  { id: "relatorio-tempo-status", label: "Relatório: Tempo em cada Status (Solic. de Desenv.)", keywords: ["relatorio", "tempo", "status", "solicitacao", "duracao", "desenvolvimento"], href: "/dashboard/relatorios/tempo-status", description: "Tempo que cada solicitação de desenvolvimento permaneceu em cada status", module: "Relatórios" },
  { id: "relatorio-tempo-status-amostras", label: "Relatório: Tempo em cada Status (Amostras de Desenv.)", keywords: ["relatorio", "tempo", "status", "amostra", "duracao", "desenvolvimento"], href: "/dashboard/relatorios/tempo-status-amostras", description: "Tempo que cada amostra de desenvolvimento permaneceu em cada status", module: "Relatórios" },
  { id: "relatorio-concluidas-desenvolvimento", label: "Relatório: Concluídas Desenvolvimento", keywords: ["relatorio", "concluidas", "desenvolvimento", "solicitacoes", "finalizadas"], href: "/dashboard/relatorios/solicitacoes-concluidas", description: "Solicitações com status Concluído Desenvolvimento", module: "Relatórios" },
  { id: "relatorio-solicitacoes-por-status", label: "Relatório: Solicitações de Desenvolvimento por Status", keywords: ["relatorio", "solicitacoes", "status", "filtro", "dinamico", "desenvolvimento"], href: "/dashboard/relatorios/solicitacoes-por-status", description: "Filtre solicitações de desenvolvimento por qualquer status do cadastro", module: "Relatórios" },
  { id: "relatorio-amostras-por-status", label: "Relatório: Amostras de Desenvolvimento por Status", keywords: ["relatorio", "amostras", "status", "filtro", "amostra", "desenvolvimento"], href: "/dashboard/relatorios/amostras-por-status", description: "Filtre amostras de desenvolvimento por qualquer status do cadastro", module: "Relatórios" },
  { id: "relatorio-amostra-comercial-por-status", label: "Relatório: Amostras Comerciais por Status", keywords: ["relatorio", "amostra", "comercial", "status", "filtro"], href: "/dashboard/relatorios/amostra-comercial-por-status", description: "Filtre amostras comerciais por qualquer status do cadastro", module: "Relatórios" },
  { id: "relatorio-historico-solicitacao", label: "Relatório: Histórico de Solicitação de Desenvolvimento", keywords: ["relatorio", "historico", "solicitacao", "timeline", "amostras", "produtos", "log", "desenvolvimento"], href: "/dashboard/relatorios/historico-solicitacao", description: "Histórico completo de uma solicitação de desenvolvimento: dados, produtos, amostras e timeline", module: "Relatórios" },
  { id: "relatorio-historico-amostra", label: "Relatório: Histórico de Amostra de Desenvolvimento", keywords: ["relatorio", "historico", "amostra", "timeline", "produto", "solicitacao", "log", "desenvolvimento"], href: "/dashboard/relatorios/historico-amostra", description: "Histórico completo de uma amostra de desenvolvimento: dados, produto, solicitação e timeline", module: "Relatórios" },

  // Admin
  { id: "admin-usuarios", label: "Usuários", keywords: ["usuario", "admin", "lista", "pessoa", "colaborador"], href: "/admin/usuarios", description: "Gerenciamento de usuários do sistema", module: "Administrativo" },
  { id: "admin-usuarios-detalhe", label: "Usuário (Detalhe)", keywords: ["usuario", "detalhe", "editar", "admin"], href: "/admin/usuarios/[id]", description: "Ficha do usuário", module: "Administrativo" },
  { id: "admin-roles", label: "Perfis (Roles)", keywords: ["role", "perfil", "acesso", "permissao", "admin"], href: "/admin/roles", description: "Gerenciamento de perfis de acesso", module: "Administrativo" },
  { id: "admin-email-massa", label: "Email em Massa", keywords: ["email", "massa", "disparo", "notificacao", "admin"], href: "/admin/email-massa", description: "Envio de emails em massa", module: "Administrativo" },
  { id: "admin-notificacoes", label: "Notificações", keywords: ["notificacao", "admin", "alerta", "aviso"], href: "/admin/notificacoes", description: "Gerenciamento de notificações do sistema", module: "Administrativo" },
  { id: "admin-configuracoes", label: "Configurações", keywords: ["configuracao", "admin", "sistema", "ajustes"], href: "/admin/configuracoes", description: "Configurações gerais do sistema", module: "Administrativo" },
  { id: "admin-banco-dados", label: "Banco de Dados", keywords: ["banco", "dados", "backup", "admin", "configuracao"], href: "/admin/configuracoes/banco-dados", description: "Configuração de banco de dados", module: "Administrativo" },
  { id: "admin-empresa", label: "Empresa", keywords: ["empresa", "dados", "admin", "configuracao"], href: "/admin/configuracoes/empresa", description: "Dados da empresa", module: "Administrativo" },
  { id: "admin-integracoes", label: "Integrações", keywords: ["integracao", "api", "admin", "configuracao"], href: "/admin/configuracoes/integracoes", description: "Configuração de integrações", module: "Administrativo" },
  { id: "admin-permissoes", label: "Permissões", keywords: ["permissao", "acesso", "admin", "seguranca", "role"], href: "/admin/configuracoes/permissoes", description: "Configuração de permissões por perfil", module: "Administrativo" },
  { id: "admin-smtp", label: "SMTP", keywords: ["smtp", "email", "admin", "configuracao", "servidor"], href: "/admin/configuracoes/smtp", description: "Configuração de servidor SMTP", module: "Administrativo" },
  { id: "admin-status", label: "Status", keywords: ["status", "admin", "configuracao", "tipo"], href: "/admin/configuracoes/status", description: "Configuração de status por módulo", module: "Administrativo" },
  { id: "admin-telas", label: "Telas (Menus)", keywords: ["tela", "menu", "admin", "configuracao", "perfil"], href: "/admin/configuracoes/telas", description: "Configuração de menus por perfil de acesso", module: "Administrativo" },

  // Perfil
  { id: "perfil", label: "Meu Perfil", keywords: ["perfil", "usuario", "conta", "senha", "dados"], href: "/perfil", description: "Meus dados de usuário", module: "Conta" },
  { id: "perfil-menus", label: "Meus Menus", keywords: ["perfil", "menu", "personalizar", "navegacao"], href: "/perfil/menus", description: "Personalizar meus menus de navegação", module: "Conta" },

  // Ferramentas
  { id: "ferramentas", label: "Ferramentas", keywords: ["ferramenta", "util", "calculadora", "conversor"], href: "/ferramentas", description: "Ferramentas utilitárias", module: "Ferramentas" },
  { id: "ferramentas-conversores", label: "Conversores", keywords: ["conversor", "unidade", "medida", "ferramenta"], href: "/ferramentas/conversores", description: "Conversores de unidades", module: "Ferramentas" },
  { id: "ferramentas-regra-tres", label: "Regra de Três", keywords: ["regra", "tres", "calculadora", "proporcao", "ferramenta"], href: "/ferramentas/regra-de-tres", description: "Calculadora de regra de três", module: "Ferramentas" },

  // Documentos
  { id: "documentos", label: "Documentos", keywords: ["documento", "romaneio", "danfe", "pedido", "relatorio"], href: "/documentos", description: "Central de documentos", module: "Documentos" },
  { id: "documentos-romaneios", label: "Romaneios", keywords: ["romaneio", "documento", "expedicao"], href: "/documentos/romaneios", description: "Gerenciamento de romaneios", module: "Documentos" },

  // Chat
  { id: "chat", label: "Chat", keywords: ["chat", "mensagem", "conversa", "comunicacao"], href: "/chat", description: "Chat interno do sistema", module: "Comunicação" },

  // CRM
  { id: "crm-dashboard", label: "CRM — Dashboard", keywords: ["crm", "dashboard", "comercial", "painel", "leads", "empresas", "clientes"], href: "/comercial/crm", description: "Dashboard do CRM com métricas de leads e empresas", module: "CRM" },
  { id: "crm-empresas", label: "CRM — Empresas", keywords: ["crm", "empresa", "empresas", "lista", "prospecto", "comercial"], href: "/comercial/crm/empresas", description: "Lista de empresas do CRM", module: "CRM" },
  { id: "crm-empresas-nova", label: "CRM — Nova Empresa", keywords: ["crm", "empresa", "nova", "criar", "cadastro", "prospecto"], href: "/comercial/crm/empresas/novo", description: "Cadastrar nova empresa no CRM", module: "CRM" },
  { id: "crm-empresas-detalhe", label: "CRM — Empresa (Detalhe)", keywords: ["crm", "empresa", "detalhe", "ficha", "contatos"], href: "/comercial/crm/empresas/[id]", description: "Ficha completa da empresa com contatos", module: "CRM" },
  { id: "crm-leads", label: "CRM — Leads", keywords: ["crm", "lead", "leads", "lista", "prospeccao", "comercial"], href: "/comercial/crm/leads", description: "Lista de leads do CRM", module: "CRM" },
  { id: "crm-leads-novo", label: "CRM — Novo Lead", keywords: ["crm", "lead", "novo", "criar", "cadastro", "prospeccao"], href: "/comercial/crm/leads/novo", description: "Cadastrar novo lead no CRM", module: "CRM" },

  // CRM — Oportunidades
  { id: "crm-oportunidades", label: "CRM — Oportunidades", keywords: ["crm", "oportunidade", "oportunidades", "lista", "pipeline", "funil", "venda", "comercial"], href: "/comercial/crm/oportunidades", description: "Lista de oportunidades de venda do CRM", module: "CRM" },
  { id: "crm-oportunidades-nova", label: "CRM — Nova Oportunidade", keywords: ["crm", "oportunidade", "nova", "criar", "pipeline", "venda"], href: "/comercial/crm/oportunidades/novo", description: "Criar nova oportunidade de venda no CRM", module: "CRM" },
  { id: "crm-oportunidades-detalhe", label: "CRM — Oportunidade (Detalhe)", keywords: ["crm", "oportunidade", "detalhe", "ficha", "pipeline"], href: "/comercial/crm/oportunidades/[id]", description: "Ficha completa da oportunidade de venda", module: "CRM" },
  { id: "crm-oportunidades-kanban", label: "Kanban — Oportunidades CRM", keywords: ["crm", "oportunidade", "kanban", "quadro", "status", "arrastar", "pipeline", "funil", "venda"], href: "/comercial/crm/oportunidades/kanban", description: "Kanban de oportunidades com drag-and-drop para o pipeline de vendas", module: "CRM" },

  // CRM — Visitas
  { id: "crm-visitas", label: "CRM — Visitas", keywords: ["crm", "visita", "visitas", "agenda", "ata", "comercial"], href: "/comercial/crm/visitas", description: "Agenda de visitas comerciais", module: "CRM" },
  { id: "crm-visitas-nova", label: "CRM — Nova Visita", keywords: ["crm", "visita", "nova", "agendar", "ata"], href: "/comercial/crm/visitas/novo", description: "Agendar nova visita comercial", module: "CRM" },
  { id: "crm-visitas-detalhe", label: "CRM — Visita (Detalhe)", keywords: ["crm", "visita", "detalhe", "ata", "fotos"], href: "/comercial/crm/visitas/[id]", description: "Detalhe da visita com ata e fotos", module: "CRM" },

  // CRM — Tarefas
  { id: "crm-tarefas", label: "CRM — Minhas Tarefas", keywords: ["crm", "tarefa", "tarefas", "agenda", "produtividade", "comercial"], href: "/comercial/crm/tarefas", description: "Minhas tarefas e agenda CRM", module: "CRM" },

  // CRM — Propostas
  { id: "crm-propostas", label: "CRM — Propostas", keywords: ["crm", "proposta", "propostas", "lista", "comercial", "pdf", "venda"], href: "/comercial/crm/propostas", description: "Lista de propostas comerciais", module: "CRM" },
  { id: "crm-propostas-nova", label: "CRM — Nova Proposta", keywords: ["crm", "proposta", "nova", "criar", "comercial", "pdf"], href: "/comercial/crm/propostas/novo", description: "Criar nova proposta comercial", module: "CRM" },
  { id: "crm-propostas-detalhe", label: "CRM — Proposta (Detalhe)", keywords: ["crm", "proposta", "detalhe", "ficha", "pdf"], href: "/comercial/crm/propostas/[id]", description: "Detalhe da proposta comercial com status e PDF", module: "CRM" },

  // CRM — Regiões
  { id: "crm-regioes", label: "CRM — Regiões", keywords: ["crm", "regiao", "regioes", "gerente", "hierarquia", "comercial"], href: "/comercial/crm/regioes", description: "Cadastro de regiões comerciais", module: "CRM" },

  // CRM — Equipes
  { id: "crm-equipes", label: "CRM — Equipes", keywords: ["crm", "equipe", "equipes", "representante", "hierarquia", "comercial"], href: "/comercial/crm/equipes", description: "Cadastro de equipes comerciais", module: "CRM" },

  // CRM — Estados (Config)
  { id: "crm-config-estados", label: "CRM — Estados (UF)", keywords: ["crm", "estado", "uf", "regiao", "configuracao", "ibge"], href: "/comercial/crm/configuracoes/estados", description: "Consulta e edição dos estados e suas regiões geográficas", module: "CRM" },

  // CRM — Cidades (Config)
  { id: "crm-config-cidades", label: "CRM — Cidades", keywords: ["crm", "cidade", "cidades", "municipio", "ibge", "configuracao"], href: "/comercial/crm/configuracoes/cidades", description: "Consulta de todas as cidades por estado", module: "CRM" },

  // CRM — Campanhas
  { id: "crm-campanhas", label: "CRM — Campanhas", keywords: ["crm", "campanha", "campanhas", "marketing", "whatsapp", "email", "comercial"], href: "/comercial/crm/campanhas", description: "Campanhas de marketing e comunicação", module: "CRM" },
  { id: "crm-campanhas-nova", label: "CRM — Nova Campanha", keywords: ["crm", "campanha", "nova", "criar", "marketing"], href: "/comercial/crm/campanhas/nova", description: "Criar nova campanha de marketing", module: "CRM" },
  { id: "crm-campanhas-detalhe", label: "CRM — Campanha (Detalhe)", keywords: ["crm", "campanha", "detalhe", "ficha", "marketing"], href: "/comercial/crm/campanhas/[id]", description: "Detalhe da campanha de marketing", module: "CRM" },

  // CRM — Representantes
  { id: "crm-representantes", label: "CRM — Representantes", keywords: ["crm", "representante", "representantes", "comercial", "gerente", "vendedor"], href: "/comercial/representantes", description: "Cadastro de representantes comerciais", module: "CRM" },
  { id: "crm-representantes-novo", label: "CRM — Novo Representante", keywords: ["crm", "representante", "novo", "criar", "cadastrar"], href: "/comercial/representantes/novo", description: "Cadastrar novo representante comercial", module: "CRM" },

  // CRM — Relatórios
  { id: "crm-relatorios", label: "CRM — Relatórios", keywords: ["crm", "relatorio", "relatorios", "grafico", "dashboard", "analise", "metricas", "conversao", "pipeline"], href: "/comercial/crm/relatorios", description: "Relatórios e análises do CRM", module: "CRM" },

  // CRM — Treinamento
  { id: "crm-treinamento", label: "CRM — Treinamento", keywords: ["crm", "treinamento", "treino", "documentacao", "manual", "ajuda", "guia", "tutorial", "aprender"], href: "/comercial/crm/treinamento", description: "Documentação e treinamento do CRM com explicações campo a campo", module: "CRM" },
  { id: "crm-treinamento-admin", label: "CRM — Gerenciar Treinamento", keywords: ["crm", "treinamento", "admin", "gerenciar", "conteudo", "licoes", "modulos"], href: "/comercial/crm/treinamento/admin", description: "Gerenciar conteúdo do treinamento CRM", module: "CRM" },
]

export function searchItems(query: string): SearchItem[] {
  if (!query || query.length < 2) return []
  const q = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  return searchRegistry.filter((item) => {
    const label = item.label.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    if (label.includes(q)) return true
    return item.keywords.some((k) =>
      k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(q)
    )
  }).slice(0, 12)
}
