-- Migration: Add crm_whatsapp_flow_logs table
-- Execute on all 4 databases: pdm_textil, pdm_pro_textil, pdm_ibirapuera, Neon

CREATE TABLE IF NOT EXISTS crm_whatsapp_flow_logs (
  id SERIAL PRIMARY KEY,
  execution_id VARCHAR(36) NOT NULL,
  remote_jid VARCHAR(255),
  push_name VARCHAR(255),
  step VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'success',
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',
  error TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flow_logs_execution_id ON crm_whatsapp_flow_logs(execution_id);
CREATE INDEX IF NOT EXISTS idx_flow_logs_created_at ON crm_whatsapp_flow_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_flow_logs_status ON crm_whatsapp_flow_logs(status);
