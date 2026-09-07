-- Faturamentos CRM (retorno real da oportunidade) + itens
CREATE TABLE IF NOT EXISTS crm_faturamentos (
  id SERIAL PRIMARY KEY,
  oportunidade_id INTEGER NOT NULL REFERENCES crm_oportunidades(id) ON DELETE CASCADE,
  numero VARCHAR(100),
  data_emissao DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'EMITIDO',
  observacao TEXT,
  origem VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
  referencia_externa VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS crm_faturamento_itens (
  id SERIAL PRIMARY KEY,
  faturamento_id INTEGER NOT NULL REFERENCES crm_faturamentos(id) ON DELETE CASCADE,
  produto VARCHAR(300) NOT NULL,
  codigo VARCHAR(100),
  unidade VARCHAR(20) NOT NULL DEFAULT 'METROS',
  unidade_outra VARCHAR(50),
  quantidade NUMERIC(14,3),
  valor_unitario NUMERIC(12,2),
  valor_total NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
-- Pedidos de Venda CRM (vendas geradas na visita) + itens
CREATE TABLE IF NOT EXISTS crm_pedidos_venda (
  id SERIAL PRIMARY KEY,
  oportunidade_id INTEGER NOT NULL REFERENCES crm_oportunidades(id) ON DELETE CASCADE,
  numero VARCHAR(100),
  data_emissao DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'ABERTO',
  observacao TEXT,
  origem VARCHAR(20) NOT NULL DEFAULT 'MANUAL',
  referencia_externa VARCHAR(200),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS crm_pedido_venda_itens (
  id SERIAL PRIMARY KEY,
  pedido_venda_id INTEGER NOT NULL REFERENCES crm_pedidos_venda(id) ON DELETE CASCADE,
  produto VARCHAR(300) NOT NULL,
  codigo VARCHAR(100),
  unidade VARCHAR(20) NOT NULL DEFAULT 'METROS',
  unidade_outra VARCHAR(50),
  quantidade NUMERIC(14,3),
  valor_unitario NUMERIC(12,2),
  valor_total NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);