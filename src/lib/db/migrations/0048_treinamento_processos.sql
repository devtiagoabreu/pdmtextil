-- Process Studio: Treinamento do módulo de Engenharia de Processos
-- Segue o mesmo padrão do treinamento do CRM (crm_treino_modulos / crm_treino_licoes).
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS proc_treino_modulos (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT,
  icone VARCHAR(50) DEFAULT 'GraduationCap',
  cor VARCHAR(7) DEFAULT '#0ea5e9',
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS proc_treino_licoes (
  id SERIAL PRIMARY KEY,
  modulo_id INTEGER NOT NULL REFERENCES proc_treino_modulos(id) ON DELETE CASCADE,
  titulo VARCHAR(200) NOT NULL,
  conteudo_md TEXT NOT NULL DEFAULT '',
  pre_requisitos TEXT,
  links_pop JSONB DEFAULT '[]',
  links_video JSONB DEFAULT '[]',
  pathname_relacionado VARCHAR(255),
  ordem INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);