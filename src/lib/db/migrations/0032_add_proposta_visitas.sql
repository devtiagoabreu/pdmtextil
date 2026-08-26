ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS proposta_id INTEGER REFERENCES crm_propostas(id);
