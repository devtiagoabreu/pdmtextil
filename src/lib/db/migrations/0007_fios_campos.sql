-- Migration: Add fields to fios and fios_fornecedores
-- titulagem_real, ncm, links em fios
-- valor_unitario em fios_fornecedores

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fios' AND column_name = 'titulagem_real') THEN
    ALTER TABLE fios ADD COLUMN titulagem_real varchar(20);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fios' AND column_name = 'ncm') THEN
    ALTER TABLE fios ADD COLUMN ncm varchar(10);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fios' AND column_name = 'links') THEN
    ALTER TABLE fios ADD COLUMN links jsonb DEFAULT '[]';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fios_fornecedores' AND column_name = 'valor_unitario') THEN
    ALTER TABLE fios_fornecedores ADD COLUMN valor_unitario numeric(10,2);
  END IF;
END $$;
