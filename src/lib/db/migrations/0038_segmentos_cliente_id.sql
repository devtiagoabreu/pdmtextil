-- Segmentos CRM (tabela própria) + cliente_id em propostas/oportunidades + segmento em clientes
CREATE TABLE IF NOT EXISTS crm_segmentos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS segmento VARCHAR(100);
--> statement-breakpoint
ALTER TABLE crm_propostas ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes(id);
--> statement-breakpoint
ALTER TABLE crm_propostas ALTER COLUMN empresa_id DROP NOT NULL;
--> statement-breakpoint
ALTER TABLE crm_oportunidades ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes(id);
