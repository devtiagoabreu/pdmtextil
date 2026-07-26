ALTER TABLE crm_whatsapp_catalogos ADD COLUMN IF NOT EXISTS tipo_pessoa VARCHAR(5) NOT NULL DEFAULT 'AMBOS';
CREATE INDEX IF NOT EXISTS idx_catalogos_tipo_pessoa ON crm_whatsapp_catalogos(tipo_pessoa);
