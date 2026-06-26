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
  { id: "dashboard-solicitacoes", label: "Dashboard Solicitações", keywords: ["dashboard", "inicio", "home", "painel", "solicitacoes", "metricas"], href: "/dashboard", description: "Painel principal com métricas de solicitações", module: "Dashboard" },
  { id: "dashboard-amostras", label: "Dashboard Amostras", keywords: ["dashboard", "amostras", "painel", "metricas", "amostra"], href: "/dashboard/amostras", description: "Painel de métricas de amostras", module: "Dashboard" },
  { id: "dashboard-corte", label: "Dashboard Corte", keywords: ["dashboard", "corte", "requisicao", "painel", "metricas", "requisições"], href: "/dashboard/requisicoes-corte", description: "Painel de métricas de requisições de corte", module: "Dashboard" },
  { id: "dashboard-relatorios", label: "Relatórios (Dashboard)", keywords: ["dashboard", "relatorio", "painel", "metricas", "relatorios"], href: "/dashboard/relatorios", description: "Central de relatórios do sistema", module: "Dashboard" },

  // Comercial - Solicitações
  { id: "solicitacoes", label: "Solicitações", keywords: ["solicitacao", "pedido", "comercial", "lista", "solicitacoes"], href: "/comercial/solicitacoes", description: "Lista de solicitações comerciais", module: "Comercial" },
  { id: "solicitacoes-nova", label: "Nova Solicitação", keywords: ["solicitacao", "nova", "criar", "pedido", "cadastro"], href: "/comercial/solicitacoes/nova", description: "Criar nova solicitação", module: "Comercial" },
  { id: "solicitacoes-detalhe", label: "Solicitação (Detalhe)", keywords: ["solicitacao", "detalhe", "editar", "ficha"], href: "/comercial/solicitacoes/[id]", description: "Ficha completa da solicitação", module: "Comercial" },
  { id: "solicitacoes-editar", label: "Solicitação (Editar)", keywords: ["solicitacao", "editar", "alterar"], href: "/comercial/solicitacoes/[id]/editar", description: "Editar solicitação existente", module: "Comercial" },
  { id: "solicitacoes-kanban", label: "Kanban — Solicitações", keywords: ["solicitacao", "kanban", "quadro", "status", "arrastar"], href: "/comercial/solicitacoes/kanban", description: "Kanban de solicitações com drag-and-drop", module: "Comercial" },

  // Comercial - Requisições de Corte
  { id: "requisicoes-corte", label: "Requisições de Corte", keywords: ["requisicao", "corte", "comercial", "lista", "requisicoes"], href: "/comercial/requisicoes-corte", description: "Lista de requisições de corte", module: "Comercial" },
  { id: "requisicoes-corte-nova", label: "Nova Requisição de Corte", keywords: ["requisicao", "corte", "nova", "criar", "cadastro"], href: "/comercial/requisicoes-corte/nova", description: "Criar nova requisição de corte", module: "Comercial" },
  { id: "requisicoes-corte-detalhe", label: "Requisição de Corte (Detalhe)", keywords: ["requisicao", "corte", "detalhe", "editar"], href: "/comercial/requisicoes-corte/[id]", description: "Ficha da requisição de corte", module: "Comercial" },

  // Comercial - Clientes
  { id: "clientes", label: "Clientes", keywords: ["cliente", "comercial", "lista", "empresa"], href: "/comercial/clientes", description: "Lista de clientes", module: "Comercial" },
  { id: "clientes-novo", label: "Novo Cliente", keywords: ["cliente", "novo", "criar", "cadastro", "empresa"], href: "/comercial/clientes/novo", description: "Cadastrar novo cliente", module: "Comercial" },
  { id: "clientes-detalhe", label: "Cliente (Detalhe)", keywords: ["cliente", "detalhe", "editar", "ficha"], href: "/comercial/clientes/[id]", description: "Ficha completa do cliente", module: "Comercial" },

  // Cadastros
  { id: "cadastros", label: "Cadastros", keywords: ["cadastro", "dados", "tabelas", "config"], href: "/cadastros", description: "Módulo de cadastros do sistema", module: "Cadastros" },
  { id: "cadastros-clientes", label: "Clientes (Cadastros)", keywords: ["cliente", "cadastro", "lista", "empresa"], href: "/cadastros/clientes", description: "Lista de clientes no módulo de cadastros", module: "Cadastros" },

  // Cadastros - Produto Cru
  { id: "produto-cru", label: "Produtos Cru", keywords: ["produto", "cru", "tecido", "malha", "listagem"], href: "/cadastros/produto-cru", description: "Lista de produtos cru (tecidos/malhas)", module: "Cadastros" },
  { id: "produto-cru-detalhe", label: "Produto Cru (Detalhe)", keywords: ["produto", "cru", "tecido", "malha", "detalhe", "editar", "ficha"], href: "/cadastros/produto-cru/[id]", description: "Ficha completa do produto cru", module: "Cadastros" },

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
  { id: "receitas", label: "Receitas", keywords: ["receita", "receitas", "formula", "beneficiamento", "quimica"], href: "/cadastros/receitas", description: "Receitas de beneficiamento", module: "Cadastros" },

  // Amostras
  { id: "amostras", label: "Amostras", keywords: ["amostra", "amostras", "lista"], href: "/amostras", description: "Lista de amostras", module: "Amostras" },
  { id: "amostras-kanban", label: "Kanban — Amostras", keywords: ["amostra", "kanban", "quadro", "status", "arrastar"], href: "/amostras/kanban", description: "Kanban de amostras com drag-and-drop", module: "Amostras" },

  // Relatórios
  { id: "relatorio-atividade-usuario", label: "Relatório: Atividade por Usuário", keywords: ["relatorio", "atividade", "usuario", "log", "auditoria"], href: "/dashboard/relatorios/atividade-usuario", description: "Registro de ações por usuário", module: "Relatórios" },
  { id: "relatorio-criadas-deletadas", label: "Relatório: Criadas / Deletadas", keywords: ["relatorio", "criadas", "deletadas", "solicitacoes", "sucesso"], href: "/dashboard/relatorios/solicitacoes-criadas", description: "Volume de solicitações criadas vs deletadas", module: "Relatórios" },
  { id: "relatorio-tempo-status", label: "Relatório: Tempo em cada Status", keywords: ["relatorio", "tempo", "status", "solicitacao", "duracao"], href: "/dashboard/relatorios/tempo-status", description: "Tempo que cada solicitação permaneceu em cada status", module: "Relatórios" },
  { id: "relatorio-tempo-status-amostras", label: "Relatório: Tempo em cada Status (Amostras)", keywords: ["relatorio", "tempo", "status", "amostra", "duracao"], href: "/dashboard/relatorios/tempo-status-amostras", description: "Tempo que cada amostra permaneceu em cada status", module: "Relatórios" },
  { id: "relatorio-concluidas-desenvolvimento", label: "Relatório: Concluídas Desenvolvimento", keywords: ["relatorio", "concluidas", "desenvolvimento", "solicitacoes", "finalizadas"], href: "/dashboard/relatorios/solicitacoes-concluidas", description: "Solicitações com status Concluído Desenvolvimento", module: "Relatórios" },
  { id: "relatorio-solicitacoes-por-status", label: "Relatório: Solicitações por Status", keywords: ["relatorio", "solicitacoes", "status", "filtro", "dinamico"], href: "/dashboard/relatorios/solicitacoes-por-status", description: "Filtre solicitações por qualquer status do cadastro", module: "Relatórios" },
  { id: "relatorio-amostras-por-status", label: "Relatório: Amostras por Status", keywords: ["relatorio", "amostras", "status", "filtro", "amostra"], href: "/dashboard/relatorios/amostras-por-status", description: "Filtre amostras por qualquer status do cadastro", module: "Relatórios" },
  { id: "relatorio-historico-solicitacao", label: "Relatório: Histórico de Solicitação", keywords: ["relatorio", "historico", "solicitacao", "timeline", "amostras", "produtos", "log"], href: "/dashboard/relatorios/historico-solicitacao", description: "Histórico completo de uma solicitação: dados, produtos, amostras e timeline", module: "Relatórios" },
  { id: "relatorio-historico-amostra", label: "Relatório: Histórico de Amostra", keywords: ["relatorio", "historico", "amostra", "timeline", "produto", "solicitacao", "log"], href: "/dashboard/relatorios/historico-amostra", description: "Histórico completo de uma amostra: dados, produto, solicitação e timeline", module: "Relatórios" },

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
