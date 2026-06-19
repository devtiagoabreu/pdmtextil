-- Migration: Create status table and populate with existing values
CREATE TABLE IF NOT EXISTS status (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  rotulo VARCHAR(100),
  tipo VARCHAR(50) NOT NULL,
  cor VARCHAR(7),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
