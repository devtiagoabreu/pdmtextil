-- Suporte PF/PJ para crm_empresas (renomeado conceitualmente para "Pessoas")
ALTER TABLE crm_empresas 
  ADD COLUMN IF NOT EXISTS tipo_pessoa VARCHAR(2) NOT NULL DEFAULT 'PJ',
  ADD COLUMN IF NOT EXISTS cpf VARCHAR(14),
  ADD COLUMN IF NOT EXISTS nome VARCHAR(250),
  ALTER COLUMN razao_social DROP NOT NULL,
  ALTER COLUMN cnpj DROP NOT NULL;

-- Remove unique constraint do cnpj (pode ter NULL p/ PF)
DROP INDEX IF EXISTS crm_empresas_cnpj_key;
CREATE UNIQUE INDEX IF NOT EXISTS crm_empresas_cnpj_unique ON crm_empresas(cnpj) WHERE cnpj IS NOT NULL;

-- tipo_pessoa no lead
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS tipo_pessoa VARCHAR(2);

-- Atualiza leads existentes com tipo_pessoa baseado em empresaNome
UPDATE crm_leads SET tipo_pessoa = CASE WHEN empresa_nome IS NOT NULL AND empresa_nome <> '' THEN 'PJ' ELSE 'PF' END WHERE tipo_pessoa IS NULL;
