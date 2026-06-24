-- Tornar usuario_id opcional (pode ser NULL para menus por role)
ALTER TABLE user_menus ALTER COLUMN usuario_id DROP NOT NULL;

-- Adicionar coluna role para menus baseados em perfil
ALTER TABLE user_menus ADD COLUMN IF NOT EXISTS role VARCHAR(50);

-- Adicionar pagina_inicial na tabela roles
ALTER TABLE roles ADD COLUMN IF NOT EXISTS pagina_inicial VARCHAR(255);

-- Inserir role DEFAULT se não existir
INSERT INTO roles (name, label, description, pagina_inicial, ativo)
SELECT 'DEFAULT', 'Padrão', 'Configuração padrão para novos usuários', '/comercial/solicitacoes', TRUE
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'DEFAULT');
