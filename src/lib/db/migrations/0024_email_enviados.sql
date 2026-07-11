CREATE TABLE IF NOT EXISTS "email_enviados" (
  "id" serial PRIMARY KEY NOT NULL,
  "lista_id" integer REFERENCES "email_listas"("id"),
  "email" varchar(255) NOT NULL,
  "nome" varchar(255),
  "assunto" varchar(500) NOT NULL DEFAULT '',
  "status" varchar(20) NOT NULL DEFAULT 'enviado',
  "error" text,
  "tracking_id" varchar(36) UNIQUE,
  "aberto_em" timestamp,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_email_enviados_tracking_id" ON "email_enviados"("tracking_id");
CREATE INDEX IF NOT EXISTS "idx_email_enviados_created_at" ON "email_enviados"("created_at");
