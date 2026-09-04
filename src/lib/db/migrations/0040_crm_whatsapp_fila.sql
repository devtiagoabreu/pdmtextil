CREATE TABLE IF NOT EXISTS crm_whatsapp_fila (
  id SERIAL PRIMARY KEY,
  remote_jid VARCHAR(255) NOT NULL,
  push_name VARCHAR(255),
  mensagem TEXT NOT NULL,
  execution_id VARCHAR(100),
  payload JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
  tentativas INTEGER NOT NULL DEFAULT 0,
  max_tentativas INTEGER NOT NULL DEFAULT 3,
  ultimo_erro TEXT,
  processado_em TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_fila_status ON crm_whatsapp_fila(status) WHERE status IN ('PENDENTE','PROCESSANDO');
