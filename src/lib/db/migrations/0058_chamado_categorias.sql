CREATE TABLE IF NOT EXISTS "chamado_categorias" (
  "id" serial PRIMARY KEY NOT NULL,
  "codigo" varchar(40) NOT NULL,
  "nome" varchar(80) NOT NULL,
  "cor" varchar(20) NOT NULL DEFAULT 'slate',
  "ativo" boolean NOT NULL DEFAULT true,
  "ordem" integer NOT NULL DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "chamado_categorias_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
INSERT INTO "chamado_categorias" ("codigo", "nome", "cor", "ativo", "ordem")
SELECT v.codigo, v.nome, v.cor, v.ativo, v.ordem
FROM (VALUES
  ('INCIDENTE', 'Incidente', 'red', true, 1),
  ('SOLICITACAO', 'Solicitacao', 'blue', true, 2),
  ('MANUTENCAO_CORRETIVA', 'Manutencao corretiva', 'amber', true, 3),
  ('MANUTENCAO_PREVENTIVA', 'Manutencao preventiva', 'emerald', true, 4),
  ('OUTRO', 'Outro', 'slate', true, 5)
) AS v(codigo, nome, cor, ativo, ordem)
WHERE NOT EXISTS (SELECT 1 FROM "chamado_categorias");
