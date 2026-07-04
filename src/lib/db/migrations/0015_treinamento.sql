-- Training Module
CREATE TABLE IF NOT EXISTS crm_treino_modulos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  icone VARCHAR(50) DEFAULT 'BookOpen',
  cor VARCHAR(7) DEFAULT '#6366f1',
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training Lessons
CREATE TABLE IF NOT EXISTS crm_treino_licoes (
  id SERIAL PRIMARY KEY,
  modulo_id INTEGER NOT NULL REFERENCES crm_treino_modulos(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  conteudo_md TEXT NOT NULL DEFAULT '',
  pre_requisitos TEXT,
  links_pop JSONB DEFAULT '[]',
  links_video JSONB DEFAULT '[]',
  pathname_relacionado VARCHAR(255),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
