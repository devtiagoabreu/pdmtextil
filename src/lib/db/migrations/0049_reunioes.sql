-- Módulo de Reuniões — repositório/histórico de reuniões (pauta, ata, participantes, encaminhamentos, links)
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS reunioes (
  id SERIAL PRIMARY KEY,
  titulo TEXT NOT NULL,
  projeto VARCHAR(20) NOT NULL DEFAULT 'INTERNA',
  data TIMESTAMP NOT NULL,
  local TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'AGENDADA',
  resumo_curto TEXT,
  resumo_detalhado TEXT,
  resumo_itens_acao TEXT,
  transcricao TEXT,
  video_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_reunioes_data ON reunioes (data);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_reunioes_projeto ON reunioes (projeto);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS reuniao_atas (
  id SERIAL PRIMARY KEY,
  reuniao_id INTEGER NOT NULL UNIQUE REFERENCES reunioes(id) ON DELETE CASCADE,
  conteudo TEXT NOT NULL,
  criado_por TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS reuniao_pautas (
  id SERIAL PRIMARY KEY,
  reuniao_id INTEGER NOT NULL REFERENCES reunioes(id) ON DELETE CASCADE,
  ordem INTEGER NOT NULL DEFAULT 0,
  descricao TEXT NOT NULL
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_reuniao_pautas_reuniao_id ON reuniao_pautas (reuniao_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS reuniao_participantes (
  id SERIAL PRIMARY KEY,
  reuniao_id INTEGER NOT NULL REFERENCES reunioes(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  empresa TEXT,
  papel TEXT
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_reuniao_participantes_reuniao_id ON reuniao_participantes (reuniao_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS reuniao_encaminhamentos (
  id SERIAL PRIMARY KEY,
  reuniao_id INTEGER NOT NULL REFERENCES reunioes(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  responsavel TEXT,
  prazo TIMESTAMP,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE'
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_reuniao_encaminhamentos_reuniao_id ON reuniao_encaminhamentos (reuniao_id);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS reuniao_links (
  id SERIAL PRIMARY KEY,
  reuniao_id INTEGER NOT NULL REFERENCES reunioes(id) ON DELETE CASCADE,
  rotulo TEXT NOT NULL,
  url TEXT NOT NULL,
  descricao TEXT,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_reuniao_links_reuniao_id ON reuniao_links (reuniao_id);