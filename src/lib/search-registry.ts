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

  // Comercial - Solicitações
  { id: "solicitacoes", label: "Solicitações", keywords: ["solicitacao", "pedido", "comercial", "lista", "solicitacoes"], href: "/comercial/solicitacoes", description: "Lista de solicitações comerciais", module: "Comercial" },
  { id: "solicitacoes-nova", label: "Nova Solicitação", keywords: ["solicitacao", "nova", "criar", "pedido", "cadastro"], href: "/comercial/solicitacoes/nova", description: "Criar nova solicitação", module: "Comercial" },

  // Comercial - Requisições de Corte
  { id: "requisicoes-corte", label: "Requisições de Corte", keywords: ["requisicao", "corte", "comercial", "lista", "requisicoes"], href: "/comercial/requisicoes-corte", description: "Lista de requisições de corte", module: "Comercial" },
  { id: "requisicoes-corte-nova", label: "Nova Requisição de Corte", keywords: ["requisicao", "corte", "nova", "criar", "cadastro"], href: "/comercial/requisicoes-corte/nova", description: "Criar nova requisição de corte", module: "Comercial" },
  { id: "requisicoes-corte-detalhe", label: "Requisição de Corte (Detalhe)", keywords: ["requisicao", "corte", "detalhe", "editar"], href: "/comercial/requisicoes-corte/[id]", description: "Ficha da requisição de corte", module: "Comercial" },

  // Comercial - Clientes
  { id: "clientes", label: "Clientes", keywords: ["cliente", "comercial", "lista", "empresa"], href: "/comercial/clientes", description: "Lista de clientes", module: "Comercial" },
  { id: "clientes-novo", label: "Novo Cliente", keywords: ["cliente", "novo", "criar", "cadastro", "empresa"], href: "/comercial/clientes/novo", description: "Cadastrar novo cliente", module: "Comercial" },

  // Cadastros
  { id: "cadastros", label: "Cadastros", keywords: ["cadastro", "dados", "tabelas", "config"], href: "/cadastros", description: "Módulo de cadastros do sistema", module: "Cadastros" },

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

  // Relatórios
  { id: "relatorio-atividade-usuario", label: "Relatório: Atividade por Usuário", keywords: ["relatorio", "atividade", "usuario", "log", "auditoria"], href: "/dashboard/relatorios/atividade-usuario", description: "Registro de ações por usuário", module: "Relatórios" },
  { id: "relatorio-criadas-deletadas", label: "Relatório: Criadas / Deletadas", keywords: ["relatorio", "criadas", "deletadas", "solicitacoes", "sucesso"], href: "/dashboard/relatorios/solicitacoes-criadas", description: "Volume de solicitações criadas vs deletadas", module: "Relatórios" },
  { id: "relatorio-tempo-status", label: "Relatório: Tempo em cada Status", keywords: ["relatorio", "tempo", "status", "solicitacao", "duracao"], href: "/dashboard/relatorios/tempo-status", description: "Tempo que cada solicitação permaneceu em cada status", module: "Relatórios" },
  { id: "relatorio-tempo-status-amostras", label: "Relatório: Tempo em cada Status (Amostras)", keywords: ["relatorio", "tempo", "status", "amostra", "duracao"], href: "/dashboard/relatorios/tempo-status-amostras", description: "Tempo que cada amostra permaneceu em cada status", module: "Relatórios" },

  // Admin
  { id: "admin-usuarios", label: "Usuários", keywords: ["usuario", "admin", "lista", "pessoa", "colaborador"], href: "/admin/usuarios", description: "Gerenciamento de usuários do sistema", module: "Administrativo" },
  { id: "admin-usuarios-detalhe", label: "Usuário (Detalhe)", keywords: ["usuario", "detalhe", "editar", "admin"], href: "/admin/usuarios/[id]", description: "Ficha do usuário", module: "Administrativo" },
  { id: "admin-roles", label: "Perfis (Roles)", keywords: ["role", "perfil", "acesso", "permissao", "admin"], href: "/admin/roles", description: "Gerenciamento de perfis de acesso", module: "Administrativo" },
  { id: "admin-email-massa", label: "Email em Massa", keywords: ["email", "massa", "disparo", "notificacao", "admin"], href: "/admin/email-massa", description: "Envio de emails em massa", module: "Administrativo" },
  { id: "admin-configuracoes", label: "Configurações", keywords: ["configuracao", "admin", "sistema", "ajustes"], href: "/admin/configuracoes", description: "Configurações gerais do sistema", module: "Administrativo" },
  { id: "admin-permissoes", label: "Permissões", keywords: ["permissao", "acesso", "admin", "seguranca", "role"], href: "/admin/configuracoes/permissoes", description: "Configuração de permissões por perfil", module: "Administrativo" },

  // Perfil
  { id: "perfil", label: "Meu Perfil", keywords: ["perfil", "usuario", "conta", "senha", "dados"], href: "/perfil", description: "Meus dados de usuário", module: "Conta" },
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
