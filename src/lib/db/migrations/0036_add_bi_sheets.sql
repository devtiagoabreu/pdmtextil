CREATE TABLE IF NOT EXISTS bi_sheets (
  id varchar(64) PRIMARY KEY,
  url text NOT NULL,
  title varchar(255),
  data jsonb NOT NULL,
  loaded_at timestamp,
  updated_at timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS config_geral (
  chave varchar(100) PRIMARY KEY,
  valor text,
  updated_at timestamp DEFAULT now()
);

INSERT INTO config_geral (chave, valor) VALUES ('bi_ttl_minutos', '10')
ON CONFLICT (chave) DO NOTHING;
