-- Viagens CRM + investimentos (despesas) + vínculo com visitas
CREATE TABLE IF NOT EXISTS crm_viagens (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(300) NOT NULL,
  descricao TEXT,
  destino_cidade VARCHAR(150),
  destino_uf VARCHAR(2),
  data_inicio DATE,
  data_fim DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'PLANEJADA',
  criado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS crm_viagens_investimentos (
  id SERIAL PRIMARY KEY,
  viagem_id INTEGER NOT NULL REFERENCES crm_viagens(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL,
  valor NUMERIC(12,2),
  observacao TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS viagem_id INTEGER REFERENCES crm_viagens(id);
