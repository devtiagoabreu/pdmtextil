-- Migration: Create romaneios and romaneio_pecas tables
CREATE TABLE IF NOT EXISTS romaneios (
  id SERIAL PRIMARY KEY,
  romaneio INTEGER NOT NULL UNIQUE,
  pedido INTEGER,
  cnpj VARCHAR(18),
  nome_cliente VARCHAR(200),
  fantasia VARCHAR(200),
  cidade VARCHAR(100),
  uf VARCHAR(2),
  nome_representante VARCHAR(200),
  nome_regiao VARCHAR(100),
  situacao VARCHAR(30),
  emissao TIMESTAMP,
  entrega TIMESTAMP,
  chegada TIMESTAMP,
  linha VARCHAR(100),
  grupo VARCHAR(100),
  sub VARCHAR(100),
  total_pecas INTEGER DEFAULT 0,
  total_metragem NUMERIC(12,2),
  total_peso_bruto NUMERIC(12,4),
  total_peso_liquido NUMERIC(12,4),
  id_integracao VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS romaneio_pecas (
  id SERIAL PRIMARY KEY,
  romaneio_id INTEGER NOT NULL REFERENCES romaneios(id) ON DELETE CASCADE,
  codigo_rolo INTEGER NOT NULL,
  produto VARCHAR(100),
  narrativa TEXT,
  lote INTEGER,
  lote_produto VARCHAR(50),
  quantidade NUMERIC(12,2),
  peso_bruto NUMERIC(12,4),
  peso_liquido NUMERIC(12,4),
  data_entrada TIMESTAMP,
  op INTEGER,
  nome_operador VARCHAR(100),
  largura NUMERIC(8,2),
  gramatura NUMERIC(8,2),
  endereco_rolo VARCHAR(50),
  cor VARCHAR(100),
  vendido NUMERIC(12,2),
  saldo NUMERIC(12,2),
  unitario NUMERIC(12,4),
  valor_vendido NUMERIC(12,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_romaneio_pecas_romaneio_id ON romaneio_pecas(romaneio_id);
