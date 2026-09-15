-- Módulo Ativos e Vistorias — ativos_categorias, ativos, ativos_tipos_vistoria, ativos_planos_vistoria, ativos_vistorias
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS ativos_categorias (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  setor VARCHAR(30) NOT NULL,
  descricao TEXT,
  cor VARCHAR(20),
  icone VARCHAR(50),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS ativos (
  id SERIAL PRIMARY KEY,
  codigo VARCHAR(40) NOT NULL,
  nome VARCHAR(200) NOT NULL,
  categoria_id INTEGER NOT NULL REFERENCES ativos_categorias(id) ON DELETE CASCADE,
  localizacao VARCHAR(200),
  fabricante VARCHAR(150),
  modelo VARCHAR(150),
  num_serie VARCHAR(100),
  ano_fabricacao INTEGER,
  data_aquisicao DATE,
  valor_aquisicao NUMERIC(12, 2),
  valor_residual NUMERIC(12, 2),
  vida_util_anos INTEGER,
  status VARCHAR(30) NOT NULL DEFAULT 'ATIVO',
  maquina_id INTEGER REFERENCES maquinas(id) ON DELETE SET NULL,
  responsavel_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  observacoes TEXT,
  anexos JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE ativos ADD CONSTRAINT ativos_codigo_unique UNIQUE(codigo);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ativos_categoria_id ON ativos (categoria_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ativos_status ON ativos (status);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS ativos_tipos_vistoria (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  categoria_id INTEGER REFERENCES ativos_categorias(id) ON DELETE SET NULL,
  setor VARCHAR(30) NOT NULL,
  procedimento TEXT,
  checklist JSONB DEFAULT '[]'::jsonb,
  periodicidade VARCHAR(20) NOT NULL,
  dias_intervalo INTEGER,
  base_legal VARCHAR(200),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ativos_tipos_vistoria_categoria_id ON ativos_tipos_vistoria (categoria_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ativos_tipos_vistoria_periodicidade ON ativos_tipos_vistoria (periodicidade);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS ativos_planos_vistoria (
  id SERIAL PRIMARY KEY,
  ativo_id INTEGER NOT NULL REFERENCES ativos(id) ON DELETE CASCADE,
  tipo_vistoria_id INTEGER NOT NULL REFERENCES ativos_tipos_vistoria(id) ON DELETE CASCADE,
  responsavel_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  dias_intervalo INTEGER,
  proxima_data DATE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS ativos_planos_ativo_tipo_unique ON ativos_planos_vistoria (ativo_id, tipo_vistoria_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ativos_planos_vistoria_proxima_data ON ativos_planos_vistoria (proxima_data);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS ativos_vistorias (
  id SERIAL PRIMARY KEY,
  plano_id INTEGER REFERENCES ativos_planos_vistoria(id) ON DELETE SET NULL,
  ativo_id INTEGER NOT NULL REFERENCES ativos(id) ON DELETE CASCADE,
  tipo_vistoria_id INTEGER NOT NULL REFERENCES ativos_tipos_vistoria(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
  data_programada DATE NOT NULL,
  data_realizada DATE,
  executado_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  resultado VARCHAR(20),
  checklist_resposta JSONB DEFAULT '[]'::jsonb,
  observacoes TEXT,
  custo NUMERIC(12, 2),
  anexos JSONB DEFAULT '[]'::jsonb,
  created_by_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ativos_vistorias_status ON ativos_vistorias (status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ativos_vistorias_data_programada ON ativos_vistorias (data_programada);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ativos_vistorias_ativo_id ON ativos_vistorias (ativo_id);