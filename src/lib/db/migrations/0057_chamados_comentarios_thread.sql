-- Chamados — comentários em thread: resposta_a_id em ticket_mensagens (autorreferência)
--> statement-breakpoint
ALTER TABLE ticket_mensagens ADD COLUMN IF NOT EXISTS resposta_a_id INTEGER REFERENCES ticket_mensagens(id) ON DELETE SET NULL;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS idx_ticket_mensagens_resposta_a_id ON ticket_mensagens (resposta_a_id);