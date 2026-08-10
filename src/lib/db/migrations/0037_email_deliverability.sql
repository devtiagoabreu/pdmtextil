-- user_email_config: limite diario por remetente
ALTER TABLE user_email_config ADD COLUMN IF NOT EXISTS limite_diario INTEGER NOT NULL DEFAULT 1500;

-- email_optouts: descadastros em massa
CREATE TABLE IF NOT EXISTS email_optouts (
  id serial PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  criado_em timestamp DEFAULT now()
);

-- email_enviados: registro do momento em que o email foi efetivamente enviado
ALTER TABLE email_enviados ADD COLUMN IF NOT EXISTS enviado_em timestamp;
CREATE INDEX IF NOT EXISTS idx_email_enviados_enviado_em ON email_enviados(enviado_em);
