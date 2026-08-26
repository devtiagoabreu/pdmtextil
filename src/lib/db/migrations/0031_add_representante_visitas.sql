ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS representante_id INTEGER REFERENCES representantes(id);
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS representante_nome VARCHAR(300);
