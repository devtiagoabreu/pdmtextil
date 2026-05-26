-- Migration: Create requisicoes_corte table
CREATE TABLE IF NOT EXISTS requisicoes_corte (
  id SERIAL PRIMARY KEY,
  requisitante_id INTEGER NOT NULL REFERENCES usuarios(id),
  codigo_produto VARCHAR(100),
  ordem VARCHAR(100),
  artigo VARCHAR(200),
  cor VARCHAR(100),
  desenho VARCHAR(100),
  quantidade VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'SOLICITADO',
  observacoes TEXT,
  entregue_por VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
