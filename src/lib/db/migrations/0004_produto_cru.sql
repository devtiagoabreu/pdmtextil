-- Migration: Create produto-cru tables
-- Execute no Neon SQL Editor

-- Table: produtos_cru
CREATE TABLE IF NOT EXISTS produtos_cru (
  id SERIAL PRIMARY KEY,
  codigo_pdm VARCHAR(30) NOT NULL UNIQUE,
  descricao VARCHAR(500) NOT NULL,
  solicitacao_desenvolvimento_id INTEGER REFERENCES solicitacoes(id),
  status VARCHAR(30) NOT NULL DEFAULT 'DESENVOLVIMENTO',
  ficha_tecnica JSONB,
  ativo BOOLEAN DEFAULT true,
  id_integracao_erp_cru VARCHAR(100),
  id_integracao VARCHAR(100),
  criado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: produto_cru_composicao
CREATE TABLE IF NOT EXISTS produto_cru_composicao (
  id SERIAL PRIMARY KEY,
  produto_cru_id INTEGER NOT NULL REFERENCES produtos_cru(id) ON DELETE CASCADE,
  material VARCHAR(200) NOT NULL,
  percentual NUMERIC(5,2) NOT NULL
);

-- Table: produto_cru_estrutura
CREATE TABLE IF NOT EXISTS produto_cru_estrutura (
  id SERIAL PRIMARY KEY,
  produto_cru_id INTEGER NOT NULL REFERENCES produtos_cru(id) ON DELETE CASCADE,
  tipo VARCHAR(20) NOT NULL,
  fio_id INTEGER REFERENCES fios(id),
  base_urdume_id INTEGER REFERENCES bases_urdume(id),
  ordem INTEGER
);

-- Table: produto_cru_amostra
CREATE TABLE IF NOT EXISTS produto_cru_amostra (
  id SERIAL PRIMARY KEY,
  produto_cru_id INTEGER NOT NULL REFERENCES produtos_cru(id) ON DELETE CASCADE,
  descricao VARCHAR(500),
  status VARCHAR(30) DEFAULT 'PENDENTE',
  observacoes TEXT,
  data TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: produto_cru_acabamento
CREATE TABLE IF NOT EXISTS produto_cru_acabamento (
  id SERIAL PRIMARY KEY,
  produto_cru_id INTEGER NOT NULL REFERENCES produtos_cru(id) ON DELETE CASCADE,
  tipo_acabamento VARCHAR(50) NOT NULL,
  descricao VARCHAR(500),
  id_integracao_erp_acabado VARCHAR(100),
  possui_receita BOOLEAN DEFAULT false
);

-- Table: produto_cru_acabamento_amostra
CREATE TABLE IF NOT EXISTS produto_cru_acabamento_amostra (
  id SERIAL PRIMARY KEY,
  acabamento_id INTEGER NOT NULL REFERENCES produto_cru_acabamento(id) ON DELETE CASCADE,
  descricao VARCHAR(500),
  status VARCHAR(30) DEFAULT 'PENDENTE',
  observacoes TEXT,
  data TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Table: produto_cru_acabamento_receita
CREATE TABLE IF NOT EXISTS produto_cru_acabamento_receita (
  id SERIAL PRIMARY KEY,
  acabamento_id INTEGER NOT NULL REFERENCES produto_cru_acabamento(id) ON DELETE CASCADE,
  tipo_receita VARCHAR(50) NOT NULL,
  parametros JSONB DEFAULT '{}'::jsonb
);
