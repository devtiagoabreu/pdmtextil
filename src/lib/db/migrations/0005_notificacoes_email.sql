-- Migration 0005: Tabelas de notificações e configuração de email
-- Execute no Neon SQL Editor

CREATE TABLE IF NOT EXISTS email_config (
  id SERIAL PRIMARY KEY,
  host VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',
  port INTEGER NOT NULL DEFAULT 587,
  "user" VARCHAR(255) NOT NULL,
  "pass" VARCHAR(255) NOT NULL,
  from_name VARCHAR(255) DEFAULT 'PDM Têxtil',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notificacoes (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(50) NOT NULL,
  mensagem TEXT NOT NULL,
  usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  usuario_nome VARCHAR(255),
  link VARCHAR(500),
  lida BOOLEAN DEFAULT false,
  lida_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

ALTER TABLE produto_cru_amostra ADD COLUMN IF NOT EXISTS motivo_aprovacao TEXT;
ALTER TABLE produto_cru_acabamento_amostra ADD COLUMN IF NOT EXISTS motivo_aprovacao TEXT;
