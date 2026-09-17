-- Módulo Chamados — tickets, ticket_mensagens
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS tickets (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(200) NOT NULL,
  descricao TEXT NOT NULL,
  categoria VARCHAR(30) NOT NULL DEFAULT 'SOLICITACAO',
  status VARCHAR(30) NOT NULL DEFAULT 'ABERTO',
  prioridade VARCHAR(20) NOT NULL DEFAULT 'MEDIA',
  area_id INTEGER NOT NULL REFERENCES proc_areas(id),
  solicitante_id INTEGER NOT NULL REFERENCES usuarios(id),
  responsavel_id INTEGER REFERENCES usuarios(id),
  ativo_id INTEGER REFERENCES ativos(id) ON DELETE SET NULL,
  processo_id INTEGER REFERENCES proc_processos(id) ON DELETE SET NULL,
  sla_primeira_resposta_prazo TIMESTAMP,
  sla_resolucao_prazo TIMESTAMP,
  primeira_resposta_em TIMESTAMP,
  resolvido_em TIMESTAMP,
  fechado_em TIMESTAMP,
  anexos JSONB DEFAULT '[]'::jsonb,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tickets_prioridade ON tickets (prioridade);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tickets_area_id ON tickets (area_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tickets_solicitante_id ON tickets (solicitante_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tickets_responsavel_id ON tickets (responsavel_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets (created_at);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS ticket_mensagens (
  id SERIAL PRIMARY KEY,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  autor_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'RESPOSTA',
  mensagem TEXT NOT NULL,
  anexos JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT now()
);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ticket_mensagens_ticket_id ON ticket_mensagens (ticket_id);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ticket_mensagens_created_at ON ticket_mensagens (created_at);