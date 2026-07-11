CREATE TABLE IF NOT EXISTS "email_cliques" (
  "id" serial PRIMARY KEY NOT NULL,
  "envio_id" integer REFERENCES "email_enviados"("id") ON DELETE CASCADE,
  "url_original" text NOT NULL,
  "clicked_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_email_cliques_envio_id" ON "email_cliques"("envio_id");
