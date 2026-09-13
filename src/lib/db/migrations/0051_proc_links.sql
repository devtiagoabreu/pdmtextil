-- Engenharia de Processos — Links (URL + descrição) em Processos, Subprocessos e Atividades
--> statement-breakpoint
ALTER TABLE proc_processos ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE proc_subprocessos ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb;
--> statement-breakpoint
ALTER TABLE proc_atividades ADD COLUMN IF NOT EXISTS links jsonb DEFAULT '[]'::jsonb;