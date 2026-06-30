-- Seed menus por perfil (role)
-- Remove configurações existentes (apenas as baseadas em role, não as de usuário)
DELETE FROM user_menu_itens
WHERE user_menu_id IN (SELECT id FROM user_menus WHERE usuario_id IS NULL);

DELETE FROM user_menus WHERE usuario_id IS NULL;

-- ============================================================
-- Função auxiliar: insere menu + itens para uma role
-- ============================================================
DO $$
DECLARE
  menu_id INTEGER;
BEGIN
  -- ──────────── DEFAULT (base para novos usuários) ────────────
  INSERT INTO user_menus (role, titulo, ordem) VALUES ('DEFAULT', 'Dashboards', 0)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Dashboard Solicitações de Desenvolvimento', '/dashboard', 0),
    (menu_id, 'Dashboard Amostras', '/dashboard/amostras', 1),
    (menu_id, 'Dashboard Amostras Comerciais', '/dashboard/amostra-comercial', 2),
    (menu_id, 'Dashboard Corte', '/dashboard/requisicoes-corte', 3);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('DEFAULT', 'Solicitações de Desenvolvimento', 1)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Solicitações de Desenvolvimento', '/comercial/solicitacoes', 0),
    (menu_id, 'Nova Solicitação de Desenvolvimento', '/comercial/solicitacoes/nova', 1),
    (menu_id, 'Kanban S.D.', '/comercial/solicitacoes/kanban', 2);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('DEFAULT', 'Requisições de Corte', 2)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Requisições de Corte', '/comercial/requisicoes-corte', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('DEFAULT', 'Amostras de Desenvolvimento', 3)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Amostras de Desenvolvimento', '/amostras', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('DEFAULT', 'Amostras Comerciais', 4)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Requisições de Amostra Comercial', '/comercial/requisicoes-amostra-comercial', 0),
    (menu_id, 'Nova Requisição', '/comercial/requisicoes-amostra-comercial/novo', 1),
    (menu_id, 'Kanban A.C.', '/comercial/requisicoes-amostra-comercial/kanban', 2);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('DEFAULT', 'Cadastros', 5)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Cadastros', '/cadastros', 0),
    (menu_id, 'Produtos', '/cadastros/produto-cru', 1),
    (menu_id, 'Receitas', '/cadastros/receitas', 2);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('DEFAULT', 'Documentos', 6)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Documentos', '/documentos', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('DEFAULT', 'Relatórios', 7)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Relatórios', '/dashboard/relatorios', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('DEFAULT', 'Ferramentas', 8)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Ferramentas', '/ferramentas', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('DEFAULT', 'Conta', 9)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Meu Perfil', '/perfil', 0);

  -- ──────────── COMERCIAL (mesmo que DEFAULT) ────────────
  -- Herda DEFAULT se não configurar menus específicos

  -- ──────────── ADMIN ────────────
  INSERT INTO user_menus (role, titulo, ordem) VALUES ('ADMIN', 'Dashboards', 0)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Dashboard Solicitações de Desenvolvimento', '/dashboard', 0),
    (menu_id, 'Dashboard Amostras', '/dashboard/amostras', 1),
    (menu_id, 'Dashboard Amostras Comerciais', '/dashboard/amostra-comercial', 2),
    (menu_id, 'Dashboard Corte', '/dashboard/requisicoes-corte', 3);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('ADMIN', 'Solicitações de Desenvolvimento', 1)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Solicitações de Desenvolvimento', '/comercial/solicitacoes', 0),
    (menu_id, 'Nova Solicitação de Desenvolvimento', '/comercial/solicitacoes/nova', 1),
    (menu_id, 'Kanban S.D.', '/comercial/solicitacoes/kanban', 2);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('ADMIN', 'Requisições de Corte', 2)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Requisições de Corte', '/comercial/requisicoes-corte', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('ADMIN', 'Amostras de Desenvolvimento', 3)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Amostras de Desenvolvimento', '/amostras', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('ADMIN', 'Amostras Comerciais', 4)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Requisições de Amostra Comercial', '/comercial/requisicoes-amostra-comercial', 0),
    (menu_id, 'Nova Requisição', '/comercial/requisicoes-amostra-comercial/novo', 1),
    (menu_id, 'Kanban A.C.', '/comercial/requisicoes-amostra-comercial/kanban', 2);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('ADMIN', 'Cadastros', 5)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Cadastros', '/cadastros', 0),
    (menu_id, 'Produtos', '/cadastros/produto-cru', 1),
    (menu_id, 'Clientes', '/comercial/clientes', 2),
    (menu_id, 'Receitas', '/cadastros/receitas', 3);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('ADMIN', 'Documentos', 6)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Documentos', '/documentos', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('ADMIN', 'Relatórios', 7)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Relatórios', '/dashboard/relatorios', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('ADMIN', 'Administrativo', 8)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Configurações', '/admin/configuracoes', 0),
    (menu_id, 'Telas', '/admin/configuracoes/telas', 1),
    (menu_id, 'Usuários', '/admin/usuarios', 2),
    (menu_id, 'Perfis (Roles)', '/admin/roles', 3),
    (menu_id, 'Notificações', '/admin/notificacoes', 4),
    (menu_id, 'Email em Massa', '/admin/email-massa', 5);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('ADMIN', 'Ferramentas', 9)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Ferramentas', '/ferramentas', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('ADMIN', 'Conta', 10)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Meu Perfil', '/perfil', 0);

  -- ──────────── SUDO (cópia do ADMIN) ────────────
  INSERT INTO user_menus (role, titulo, ordem) VALUES ('SUDO', 'Dashboards', 0)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Dashboard Solicitações de Desenvolvimento', '/dashboard', 0),
    (menu_id, 'Dashboard Amostras', '/dashboard/amostras', 1),
    (menu_id, 'Dashboard Amostras Comerciais', '/dashboard/amostra-comercial', 2),
    (menu_id, 'Dashboard Corte', '/dashboard/requisicoes-corte', 3);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('SUDO', 'Solicitações de Desenvolvimento', 1)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Solicitações de Desenvolvimento', '/comercial/solicitacoes', 0),
    (menu_id, 'Nova Solicitação de Desenvolvimento', '/comercial/solicitacoes/nova', 1),
    (menu_id, 'Kanban S.D.', '/comercial/solicitacoes/kanban', 2);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('SUDO', 'Requisições de Corte', 2)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Requisições de Corte', '/comercial/requisicoes-corte', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('SUDO', 'Amostras de Desenvolvimento', 3)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Amostras de Desenvolvimento', '/amostras', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('SUDO', 'Amostras Comerciais', 4)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Requisições de Amostra Comercial', '/comercial/requisicoes-amostra-comercial', 0),
    (menu_id, 'Nova Requisição', '/comercial/requisicoes-amostra-comercial/novo', 1),
    (menu_id, 'Kanban A.C.', '/comercial/requisicoes-amostra-comercial/kanban', 2);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('SUDO', 'Cadastros', 5)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Cadastros', '/cadastros', 0),
    (menu_id, 'Produtos', '/cadastros/produto-cru', 1),
    (menu_id, 'Clientes', '/comercial/clientes', 2),
    (menu_id, 'Receitas', '/cadastros/receitas', 3);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('SUDO', 'Documentos', 6)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Documentos', '/documentos', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('SUDO', 'Relatórios', 7)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Relatórios', '/dashboard/relatorios', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('SUDO', 'Administrativo', 8)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Configurações', '/admin/configuracoes', 0),
    (menu_id, 'Telas', '/admin/configuracoes/telas', 1),
    (menu_id, 'Usuários', '/admin/usuarios', 2),
    (menu_id, 'Perfis (Roles)', '/admin/roles', 3),
    (menu_id, 'Notificações', '/admin/notificacoes', 4),
    (menu_id, 'Email em Massa', '/admin/email-massa', 5);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('SUDO', 'Ferramentas', 9)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Ferramentas', '/ferramentas', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('SUDO', 'Conta', 10)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Meu Perfil', '/perfil', 0);

  -- ──────────── TECELAGEM ────────────
  INSERT INTO user_menus (role, titulo, ordem) VALUES ('TECELAGEM', 'Dashboards', 0)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Dashboard Solicitações de Desenvolvimento', '/dashboard', 0),
    (menu_id, 'Dashboard Corte', '/dashboard/requisicoes-corte', 1);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('TECELAGEM', 'Solicitações de Desenvolvimento', 1)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Solicitações', '/comercial/solicitacoes', 0),
    (menu_id, 'Kanban S.D.', '/comercial/solicitacoes/kanban', 1);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('TECELAGEM', 'Bases Urdume', 2)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Bases Urdume', '/cadastros/bases-urdume', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('TECELAGEM', 'Conta', 3)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Meu Perfil', '/perfil', 0);

  -- ──────────── BENEFICIAMENTO ────────────
  INSERT INTO user_menus (role, titulo, ordem) VALUES ('BENEFICIAMENTO', 'Dashboards', 0)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Dashboard Solicitações de Desenvolvimento', '/dashboard', 0),
    (menu_id, 'Dashboard Amostras', '/dashboard/amostras', 1);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('BENEFICIAMENTO', 'Solicitações de Desenvolvimento', 1)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Solicitações', '/comercial/solicitacoes', 0),
    (menu_id, 'Kanban S.D.', '/comercial/solicitacoes/kanban', 1);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('BENEFICIAMENTO', 'Amostras de Desenvolvimento', 2)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Amostras de Desenvolvimento', '/amostras', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('BENEFICIAMENTO', 'Receitas', 3)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Receitas', '/cadastros/receitas', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('BENEFICIAMENTO', 'Conta', 4)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Meu Perfil', '/perfil', 0);

  -- ──────────── QUALIDADE ────────────
  INSERT INTO user_menus (role, titulo, ordem) VALUES ('QUALIDADE', 'Dashboards', 0)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Dashboard Solicitações de Desenvolvimento', '/dashboard', 0),
    (menu_id, 'Dashboard Amostras', '/dashboard/amostras', 1);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('QUALIDADE', 'Solicitações de Desenvolvimento', 1)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Solicitações', '/comercial/solicitacoes', 0),
    (menu_id, 'Kanban S.D.', '/comercial/solicitacoes/kanban', 1);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('QUALIDADE', 'Amostras de Desenvolvimento', 2)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Amostras de Desenvolvimento', '/amostras', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('QUALIDADE', 'Documentos', 3)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Documentos', '/documentos', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('QUALIDADE', 'Conta', 4)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Meu Perfil', '/perfil', 0);

  -- ──────────── PCP ────────────
  INSERT INTO user_menus (role, titulo, ordem) VALUES ('PCP', 'Dashboards', 0)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Dashboard Solicitações de Desenvolvimento', '/dashboard', 0),
    (menu_id, 'Dashboard Corte', '/dashboard/requisicoes-corte', 1);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('PCP', 'Solicitações de Desenvolvimento', 1)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Solicitações', '/comercial/solicitacoes', 0),
    (menu_id, 'Kanban S.D.', '/comercial/solicitacoes/kanban', 1);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('PCP', 'Requisições de Corte', 2)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Requisições de Corte', '/comercial/requisicoes-corte', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('PCP', 'Conta', 3)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Meu Perfil', '/perfil', 0);

  -- ──────────── DESENVOLVIMENTO ────────────
  INSERT INTO user_menus (role, titulo, ordem) VALUES ('DESENVOLVIMENTO', 'Dashboards', 0)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Dashboard Solicitações de Desenvolvimento', '/dashboard', 0),
    (menu_id, 'Dashboard Amostras', '/dashboard/amostras', 1),
    (menu_id, 'Dashboard Amostras Comerciais', '/dashboard/amostra-comercial', 2);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('DESENVOLVIMENTO', 'Solicitações de Desenvolvimento', 1)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Solicitações', '/comercial/solicitacoes', 0),
    (menu_id, 'Kanban S.D.', '/comercial/solicitacoes/kanban', 1);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('DESENVOLVIMENTO', 'Amostras de Desenvolvimento', 2)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Amostras de Desenvolvimento', '/amostras', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('DESENVOLVIMENTO', 'Amostras Comerciais', 3)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Requisições de Amostra Comercial', '/comercial/requisicoes-amostra-comercial', 0),
    (menu_id, 'Kanban A.C.', '/comercial/requisicoes-amostra-comercial/kanban', 1);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('DESENVOLVIMENTO', 'Conta', 4)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Meu Perfil', '/perfil', 0);

  -- ──────────── REVISAO ────────────
  INSERT INTO user_menus (role, titulo, ordem) VALUES ('REVISAO', 'Dashboards', 0)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Dashboard Solicitações', '/dashboard', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('REVISAO', 'Solicitações de Desenvolvimento', 1)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Solicitações', '/comercial/solicitacoes', 0),
    (menu_id, 'Kanban S.D.', '/comercial/solicitacoes/kanban', 1);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('REVISAO', 'Documentos', 2)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Documentos', '/documentos', 0);

  INSERT INTO user_menus (role, titulo, ordem) VALUES ('REVISAO', 'Conta', 3)
    RETURNING id INTO menu_id;
  INSERT INTO user_menu_itens (user_menu_id, titulo, url, ordem) VALUES
    (menu_id, 'Meu Perfil', '/perfil', 0);

END $$;
