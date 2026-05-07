-- Script SQL para adicionar idIntegracao às tabelas existentes
-- Execute este script no Neon SQL Editor

-- fornecedores
ALTER TABLE fornecedores ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);

-- fios
ALTER TABLE fios ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);

-- fios_fornecedores
ALTER TABLE fios_fornecedores ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);

-- bases_urdume
ALTER TABLE bases_urdume ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);

-- cores_solidas
ALTER TABLE cores_solidas ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);

-- cores_fundo
ALTER TABLE cores_fundo ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);

-- estampas
ALTER TABLE estampas ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);

-- clientes
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);

-- maquinas
ALTER TABLE maquinas ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);

-- operacoes
ALTER TABLE operacoes ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);

-- acabamentos
ALTER TABLE acabamentos ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);

-- solicitacoes
ALTER TABLE solicitacoes ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);

-- anexos
ALTER TABLE anexos ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);

-- usuarios
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS "id_integracao" varchar(100);