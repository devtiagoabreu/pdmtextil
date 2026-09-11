CREATE TABLE IF NOT EXISTS "reunioes_projetos" (
  "id" serial PRIMARY KEY NOT NULL,
  "nome" text NOT NULL,
  "descricao" text,
  "data_inicio" date,
  "data_fim" date,
  "status" varchar(20) DEFAULT 'EM_ANDAMENTO' NOT NULL,
  "cor" varchar(7),
  "ativo" boolean DEFAULT true NOT NULL,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "reunioes_projetos" ADD CONSTRAINT "reunioes_projetos_nome_unique" UNIQUE("nome");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_reunioes_projetos_status" ON "reunioes_projetos" ("status");
--> statement-breakpoint
INSERT INTO "reunioes_projetos" ("nome", "descricao", "status", "cor")
VALUES
  ('Interna', 'Reuniões internas (equipe, planejamento e gestão)', 'EM_ANDAMENTO', '#64748b'),
  ('Systêxtil', 'Projeto de integração com o ERP Systêxtil', 'EM_ANDAMENTO', '#6366f1'),
  ('Bling', 'Projeto de integração com o ERP Bling', 'EM_ANDAMENTO', '#0ea5e9'),
  ('Outros', 'Demais assuntos e projetos', 'EM_ANDAMENTO', '#f59e0b')
ON CONFLICT ("nome") DO NOTHING;
--> statement-breakpoint
ALTER TABLE "reunioes" ADD COLUMN IF NOT EXISTS "projeto_id" integer;
--> statement-breakpoint
UPDATE "reunioes" SET "projeto_id" = p."id"
FROM "reunioes_projetos" p
WHERE upper(btrim("reunioes"."projeto")) = upper(p."nome")
  AND "reunioes"."projeto_id" IS NULL;
--> statement-breakpoint
UPDATE "reunioes"
SET "projeto_id" = (SELECT "id" FROM "reunioes_projetos" WHERE "nome" = 'Interna' LIMIT 1)
WHERE "projeto_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "reunioes" ALTER COLUMN "projeto_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "reunioes" ALTER COLUMN "projeto_id" SET DEFAULT 1;
--> statement-breakpoint
ALTER TABLE "reunioes" ADD CONSTRAINT "reunioes_projeto_id_fkey"
FOREIGN KEY ("projeto_id") REFERENCES "reunioes_projetos"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "reunioes" DROP COLUMN IF EXISTS "projeto";
--> statement-breakpoint
DROP INDEX IF EXISTS "idx_reunioes_projeto";