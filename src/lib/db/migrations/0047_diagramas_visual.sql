-- Process Studio (Process Engineering Workspace): Diagramas visuais
-- Um conhecimento, múltiplas representações: modelo semântico + BPMN + Canvas (Excalidraw) + Mermaid + Markdown.
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS proc_diagramas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  tipo VARCHAR(30) NOT NULL DEFAULT 'FLUXOGRAMA',
  descricao TEXT,
  modelo JSONB,
  bpmn_xml TEXT,
  canvas JSONB,
  mermaid TEXT,
  markdown TEXT,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);