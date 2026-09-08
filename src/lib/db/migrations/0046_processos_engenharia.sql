-- Engenharia de Processos (Process Engineering Workspace) — Ontologia core
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS proc_empresas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  cnpj VARCHAR(18),
  segmento VARCHAR(100),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS proc_sites (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES proc_empresas(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  cidade VARCHAR(100),
  uf VARCHAR(2),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS proc_areas (
  id SERIAL PRIMARY KEY,
  site_id INTEGER NOT NULL REFERENCES proc_sites(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS proc_processos (
  id SERIAL PRIMARY KEY,
  area_id INTEGER NOT NULL REFERENCES proc_areas(id) ON DELETE CASCADE,
  codigo VARCHAR(30),
  nome VARCHAR(200) NOT NULL,
  objetivo TEXT,
  responsavel VARCHAR(150),
  status VARCHAR(30) NOT NULL DEFAULT 'RASCUNHO',
  versao INTEGER DEFAULT 0,
  entradas JSONB DEFAULT '[]'::jsonb,
  saidas JSONB DEFAULT '[]'::jsonb,
  fornecedores JSONB DEFAULT '[]'::jsonb,
  clientes JSONB DEFAULT '[]'::jsonb,
  recursos JSONB DEFAULT '[]'::jsonb,
  sistemas JSONB DEFAULT '[]'::jsonb,
  equipamentos JSONB DEFAULT '[]'::jsonb,
  indicadores JSONB DEFAULT '[]'::jsonb,
  riscos JSONB DEFAULT '[]'::jsonb,
  controles JSONB DEFAULT '[]'::jsonb,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS proc_subprocessos (
  id SERIAL PRIMARY KEY,
  processo_id INTEGER NOT NULL REFERENCES proc_processos(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  descricao TEXT,
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS proc_atividades (
  id SERIAL PRIMARY KEY,
  subprocesso_id INTEGER NOT NULL REFERENCES proc_subprocessos(id) ON DELETE CASCADE,
  nome VARCHAR(200) NOT NULL,
  tipo VARCHAR(30) DEFAULT 'MANUAL',
  responsavel VARCHAR(150),
  ordem INTEGER DEFAULT 0,
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);