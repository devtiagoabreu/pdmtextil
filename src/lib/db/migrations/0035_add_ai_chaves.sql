CREATE TABLE IF NOT EXISTS ai_chaves (
  id serial PRIMARY KEY,
  provedor varchar(30) NOT NULL DEFAULT 'groq',
  nome varchar(100) NOT NULL,
  chave_api varchar(500) NOT NULL,
  url_base varchar(500),
  modelo varchar(200),
  ordem integer NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true,
  fail_count integer NOT NULL DEFAULT 0,
  ultima_falha timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);
