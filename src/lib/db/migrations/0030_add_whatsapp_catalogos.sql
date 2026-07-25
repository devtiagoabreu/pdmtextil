CREATE TABLE IF NOT EXISTS crm_whatsapp_catalogos (
  id SERIAL PRIMARY KEY,
  linha_numero INTEGER NOT NULL,
  linha_nome VARCHAR(100) NOT NULL,
  titulo VARCHAR(255) NOT NULL,
  link_url TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_catalogos_linha ON crm_whatsapp_catalogos(linha_numero);
CREATE INDEX IF NOT EXISTS idx_catalogos_ativo ON crm_whatsapp_catalogos(ativo);
