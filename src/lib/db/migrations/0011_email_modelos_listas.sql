CREATE TABLE IF NOT EXISTS "email_modelos" (
  "id" serial PRIMARY KEY NOT NULL,
  "nome" varchar(255) NOT NULL,
  "assunto" varchar(500) NOT NULL DEFAULT '',
  "html" text NOT NULL DEFAULT '',
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "email_listas" (
  "id" serial PRIMARY KEY NOT NULL,
  "nome" varchar(255) NOT NULL,
  "descricao" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "email_lista_contatos" (
  "id" serial PRIMARY KEY NOT NULL,
  "lista_id" integer NOT NULL REFERENCES "email_listas"("id") ON DELETE CASCADE,
  "nome" varchar(255) NOT NULL,
  "email" varchar(255) NOT NULL,
  "created_at" timestamp DEFAULT now()
);
