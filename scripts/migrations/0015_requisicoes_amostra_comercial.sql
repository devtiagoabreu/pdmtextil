-- Migration 0015: Create requisicoes_amostra_comercial table

CREATE TABLE IF NOT EXISTS requisicoes_amostra_comercial (
  id SERIAL PRIMARY KEY,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
  solicitante_id INTEGER NOT NULL REFERENCES usuarios(id),
  responsavel_id INTEGER REFERENCES usuarios(id),
  cliente VARCHAR(200),
  produto_cru_id INTEGER NOT NULL REFERENCES produtos_cru(id),
  solicitacao_desenvolvimento_id INTEGER,
  titulo VARCHAR(500),
  quantidade VARCHAR(100),
  motivo TEXT,
  observacoes TEXT,
  historico JSONB DEFAULT '[]'::jsonb,
  prazo_desejado TIMESTAMP,
  id_integracao VARCHAR(100),
  criado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
