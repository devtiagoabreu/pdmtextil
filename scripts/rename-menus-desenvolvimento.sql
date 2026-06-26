-- Renomeia menus e itens para nomes explícitos (Solicitação de Desenvolvimento / Amostra de Desenvolvimento)
-- Executar após: scripts/seed-perfil-menus.sql

UPDATE user_menu_itens
SET titulo = 'Solicitações de Desenvolvimento'
WHERE url = '/comercial/solicitacoes' AND titulo = 'Solicitações';

UPDATE user_menu_itens
SET titulo = 'Nova Solicitação de Desenvolvimento'
WHERE url = '/comercial/solicitacoes/nova' AND titulo = 'Nova Solicitação';

UPDATE user_menu_itens
SET titulo = 'Amostras de Desenvolvimento'
WHERE url = '/amostras' AND titulo = 'Amostras';

UPDATE user_menus
SET titulo = 'Solicitações de Desenvolvimento'
WHERE titulo = 'Solicitações';

UPDATE user_menus
SET titulo = 'Amostras de Desenvolvimento'
WHERE titulo = 'Amostras';

UPDATE user_menu_itens
SET titulo = 'Dashboard Solicitações de Desenvolvimento'
WHERE url = '/dashboard' AND titulo = 'Dashboard Solicitações';

UPDATE user_menu_itens
SET titulo = 'Dashboard Amostras de Desenvolvimento'
WHERE url = '/dashboard/amostras' AND titulo = 'Dashboard Amostras';

UPDATE user_menu_itens
SET titulo = 'Kanban — Solicitações de Desenvolvimento'
WHERE url = '/comercial/solicitacoes/kanban' AND titulo = 'Kanban — Solicitações';

UPDATE user_menu_itens
SET titulo = 'Kanban — Amostras de Desenvolvimento'
WHERE url = '/amostras/kanban' AND titulo = 'Kanban — Amostras';
