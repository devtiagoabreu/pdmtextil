-- Migration 0026: Configuração SMTP por usuário
CREATE TABLE IF NOT EXISTS user_email_config (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL UNIQUE REFERENCES usuarios(id),
  email VARCHAR(255) NOT NULL,
  senha_app VARCHAR(255) NOT NULL,
  host VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',
  port INTEGER NOT NULL DEFAULT 587,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
