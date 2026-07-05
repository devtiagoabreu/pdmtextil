-- Adiciona gerente_id aos estados (como em regioes)
ALTER TABLE crm_estados ADD COLUMN IF NOT EXISTS gerente_id INTEGER REFERENCES usuarios(id);
