-- Add historico JSONB column to amostra tables

ALTER TABLE produto_cru_amostra
ADD COLUMN IF NOT EXISTS historico jsonb DEFAULT '[]'::jsonb;

ALTER TABLE produto_cru_acabamento_amostra
ADD COLUMN IF NOT EXISTS historico jsonb DEFAULT '[]'::jsonb;
