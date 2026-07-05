CREATE TABLE IF NOT EXISTS crm_paises (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  codigo VARCHAR(5) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'crm_estados' AND column_name = 'pais_id') THEN
    ALTER TABLE crm_estados ADD COLUMN pais_id INTEGER REFERENCES crm_paises(id);
  END IF;
END $$;
