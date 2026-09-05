CREATE TABLE IF NOT EXISTS crm_whatsapp_bot_logs (
  id SERIAL PRIMARY KEY,
  tipo VARCHAR(20) NOT NULL,
  origem VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,
  detalhe JSONB DEFAULT '{}',
  erro TEXT,
  created_at TIMESTAMP DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_bot_logs_created_at ON crm_whatsapp_bot_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bot_logs_tipo ON crm_whatsapp_bot_logs(tipo);
CREATE INDEX IF NOT EXISTS idx_bot_logs_status ON crm_whatsapp_bot_logs(status);