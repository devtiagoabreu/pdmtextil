-- ===================================================
-- Migration 0009: Logs do sistema + Role SUDO
-- ===================================================

-- 1. Tabela de logs do sistema
CREATE TABLE IF NOT EXISTS logs (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  acao VARCHAR(100) NOT NULL,
  descricao TEXT,
  entidade VARCHAR(100),
  entidade_id INTEGER,
  dados JSONB,
  erro TEXT,
  usuario_id INTEGER REFERENCES usuarios(id),
  usuario_nome VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

-- 2. Role SUDO (caso ainda não exista)
INSERT INTO roles (name, label, description, permissions, ativo)
SELECT 'SUDO', 'Super Usuário', 'Acesso total ao sistema + notificações de erro do sistema e deleções', '{}', true
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'SUDO');

-- 3. Permissões completas para SUDO
UPDATE roles SET permissions = jsonb_build_object(
  'SOLICITACOES', jsonb_build_object('VIEW', true, 'INSERT', true, 'UPDATE', true, 'DELETE', true),
  'PRODUTO_CRU', jsonb_build_object('VIEW', true, 'INSERT', true, 'UPDATE', true, 'DELETE', true),
  'CADASTROS', jsonb_build_object('VIEW', true, 'INSERT', true, 'UPDATE', true, 'DELETE', true),
  'AMOSTRAS', jsonb_build_object('VIEW', true, 'INSERT', true, 'UPDATE', true, 'DELETE', true),
  'USUARIOS', jsonb_build_object('VIEW', true, 'INSERT', true, 'UPDATE', true, 'DELETE', true),
  'CONFIGURACOES', jsonb_build_object('VIEW', true, 'INSERT', true, 'UPDATE', true, 'DELETE', true)
) WHERE name = 'SUDO';

-- 4. Atualizar permissões do ADMIN para incluir DELETE em USUARIOS e CONFIGURACOES
UPDATE roles SET permissions = jsonb_build_object(
  'SOLICITACOES', jsonb_build_object('VIEW', true, 'INSERT', true, 'UPDATE', true, 'DELETE', true),
  'PRODUTO_CRU', jsonb_build_object('VIEW', true, 'INSERT', true, 'UPDATE', true, 'DELETE', true),
  'CADASTROS', jsonb_build_object('VIEW', true, 'INSERT', true, 'UPDATE', true, 'DELETE', true),
  'AMOSTRAS', jsonb_build_object('VIEW', true, 'INSERT', true, 'UPDATE', true, 'DELETE', true),
  'USUARIOS', jsonb_build_object('VIEW', true, 'INSERT', true, 'UPDATE', true, 'DELETE', true),
  'CONFIGURACOES', jsonb_build_object('VIEW', true, 'INSERT', true, 'UPDATE', true, 'DELETE', true)
) WHERE name = 'ADMIN';
