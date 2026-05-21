-- Seed default permissions for all active roles
UPDATE roles SET permissions = '{
  "SOLICITACOES": ["VIEW", "INSERT", "UPDATE", "DELETE"],
  "PRODUTO_CRU": ["VIEW", "INSERT", "UPDATE", "DELETE"],
  "CADASTROS": ["VIEW", "INSERT", "UPDATE", "DELETE"],
  "AMOSTRAS": ["VIEW", "INSERT", "UPDATE", "DELETE"],
  "USUARIOS": ["VIEW", "INSERT", "UPDATE", "DELETE"],
  "CONFIGURACOES": ["VIEW", "INSERT", "UPDATE", "DELETE"]
}'::jsonb, updated_at = NOW() WHERE ativo = true;
