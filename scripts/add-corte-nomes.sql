-- Adicionar colunas de nome (texto livre) para cliente/fornecedor/representante
-- nas tabelas de requisições de corte

-- Tabela pai
ALTER TABLE requisicoes_corte ADD COLUMN IF NOT EXISTS cliente_nome varchar(200);
ALTER TABLE requisicoes_corte ADD COLUMN IF NOT EXISTS fornecedor_nome varchar(200);
ALTER TABLE requisicoes_corte ADD COLUMN IF NOT EXISTS representante_nome varchar(200);

-- Tabela filha
ALTER TABLE requisicoes_corte_itens ADD COLUMN IF NOT EXISTS cliente_nome varchar(200);
ALTER TABLE requisicoes_corte_itens ADD COLUMN IF NOT EXISTS fornecedor_nome varchar(200);
ALTER TABLE requisicoes_corte_itens ADD COLUMN IF NOT EXISTS representante_nome varchar(200);
