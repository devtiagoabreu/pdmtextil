-- Migration: Rename fields in bases_urdume and create base_urdume_fios table
-- Run this on your Neon database

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bases_urdume' AND column_name = 'densidade') THEN
    ALTER TABLE bases_urdume RENAME COLUMN densidade TO fios;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bases_urdume' AND column_name = 'tratamento_encolagem') THEN
    ALTER TABLE bases_urdume RENAME COLUMN tratamento_encolagem TO tratamento;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'bases_urdume' AND column_name = 'composicao_fios') THEN
    ALTER TABLE bases_urdume DROP COLUMN composicao_fios;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS base_urdume_fios (
  id SERIAL PRIMARY KEY,
  base_urdume_id INTEGER NOT NULL REFERENCES bases_urdume(id) ON DELETE CASCADE,
  fio_id INTEGER NOT NULL REFERENCES fios(id),
  created_at TIMESTAMP DEFAULT NOW()
);
