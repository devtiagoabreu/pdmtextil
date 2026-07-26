CREATE TABLE IF NOT EXISTS crm_whatsapp_retry_queue (
  id SERIAL PRIMARY KEY,
  remote_jid VARCHAR(255) NOT NULL,
  mensagem TEXT NOT NULL,
  tentativas INTEGER NOT NULL DEFAULT 0,
  max_tentativas INTEGER NOT NULL DEFAULT 3,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
  ultimo_erro TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  proximo_retry_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_retry_queue_status ON crm_whatsapp_retry_queue(status);
CREATE INDEX IF NOT EXISTS idx_retry_queue_proximo ON crm_whatsapp_retry_queue(proximo_retry_at) WHERE status = 'PENDENTE';
