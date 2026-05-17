-- Migration: Add motivo_aprovacao column to amostra tables
-- Execute no Neon SQL Editor

ALTER TABLE produto_cru_amostra ADD COLUMN IF NOT EXISTS motivo_aprovacao TEXT;
ALTER TABLE produto_cru_acabamento_amostra ADD COLUMN IF NOT EXISTS motivo_aprovacao TEXT;
