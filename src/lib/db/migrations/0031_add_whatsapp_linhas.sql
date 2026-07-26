CREATE TABLE IF NOT EXISTS crm_whatsapp_linhas (
  id SERIAL PRIMARY KEY,
  numero INTEGER NOT NULL UNIQUE,
  nome VARCHAR(100) NOT NULL,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_linhas_numero ON crm_whatsapp_linhas(numero);
CREATE INDEX IF NOT EXISTS idx_linhas_ativo ON crm_whatsapp_linhas(ativo);

INSERT INTO crm_whatsapp_linhas (numero, nome) VALUES
  (1, 'Linha Lencol'),
  (2, 'Linha Hospitalar (lencois e campos)'),
  (3, 'Tecidos para Lateral de Colchao'),
  (4, 'Tecidos Rusticos e Decoracao'),
  (5, 'Movelaria e Forros')
ON CONFLICT (numero) DO NOTHING;
