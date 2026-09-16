-- 0054: ativos_reformas — reformas (capitalizáveis) do ativo imobilizado
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS ativos_reformas (
  id SERIAL PRIMARY KEY,
  ativo_id INTEGER NOT NULL REFERENCES ativos(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  valor NUMERIC(12, 2),
  extensao_vida_util_anos INTEGER,
  motivo VARCHAR(200),
  descricao TEXT,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ativos_reformas_ativo_id ON ativos_reformas (ativo_id);