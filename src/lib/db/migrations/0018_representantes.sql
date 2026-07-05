CREATE TABLE IF NOT EXISTS representantes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  cnpj VARCHAR(18) NOT NULL UNIQUE,
  razao_social VARCHAR(250),
  email VARCHAR(150),
  telefone VARCHAR(20),
  contato VARCHAR(100),
  endereco VARCHAR(300),
  cidade VARCHAR(100),
  uf VARCHAR(2),
  gerente_id INTEGER REFERENCES usuarios(id),
  ativo BOOLEAN DEFAULT true,
  id_integracao VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
