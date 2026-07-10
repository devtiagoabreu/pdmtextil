-- Renomeia crm_empresas para crm_pessoas (conceito unificado PF/PJ)
ALTER TABLE crm_empresas RENAME TO crm_pessoas;

-- Renomeia indices para manter consistencia
ALTER INDEX IF EXISTS crm_empresas_cnpj_unique RENAME TO crm_pessoas_cnpj_unique;
