ALTER TABLE "tickets" ALTER COLUMN "categoria" TYPE varchar(40);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_chamado_categorias_ordem" ON "chamado_categorias" ("ordem");
