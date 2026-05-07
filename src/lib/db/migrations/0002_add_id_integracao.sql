-- Migration: Adicionar campo idIntegracao às tabelas existentes
-- Apenas ALTER TABLE, sem CREATE TABLE

ALTER TABLE fornecedores ADD COLUMN "id_integracao" varchar(100);
ALTER TABLE fios ADD COLUMN "id_integracao" varchar(100);
ALTER TABLE fios_fornecedores ADD COLUMN "id_integracao" varchar(100);
ALTER TABLE bases_urdume ADD COLUMN "id_integracao" varchar(100);
ALTER TABLE cores_solidas ADD COLUMN "id_integracao" varchar(100);
ALTER TABLE cores_fundo ADD COLUMN "id_integracao" varchar(100);
ALTER TABLE estampas ADD COLUMN "id_integracao" varchar(100);
ALTER TABLE clientes ADD COLUMN "id_integracao" varchar(100);
ALTER TABLE maquinas ADD COLUMN "id_integracao" varchar(100);
ALTER TABLE operacoes ADD COLUMN "id_integracao" varchar(100);
ALTER TABLE acabamentos ADD COLUMN "id_integracao" varchar(100);