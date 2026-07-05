CREATE TABLE IF NOT EXISTS clientes_representantes (
  id SERIAL PRIMARY KEY,
  cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  representante_id INTEGER NOT NULL REFERENCES representantes(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(cliente_id, representante_id)
);
