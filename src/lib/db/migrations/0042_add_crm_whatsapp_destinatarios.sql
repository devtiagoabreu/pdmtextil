CREATE TABLE IF NOT EXISTS crm_whatsapp_destinatarios (
  id SERIAL PRIMARY KEY,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  tipo_pessoa VARCHAR(2) NOT NULL,
  created_at TIMESTAMP DEFAULT now(),
  CONSTRAINT crm_whatsapp_destinatarios_usuario_tipo_uq UNIQUE (usuario_id, tipo_pessoa)
);