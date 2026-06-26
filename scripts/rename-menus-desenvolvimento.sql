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
WHERE titulo = 'Solicitações' AND usuario_id IS NULL;

UPDATE user_menus
SET titulo = 'Amostras de Desenvolvimento'
WHERE titulo = 'Amostras' AND usuario_id IS NULL;
