const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })

const MIGRATION_SQL = `
-- ============================================
-- Sincronizar pdm_pro_textil, pdm_ibirapuera e neon com pdm_textil
-- ============================================

-- crm_contatos: adicionar cliente_id
DO $$ BEGIN
  ALTER TABLE crm_contatos ADD COLUMN IF NOT EXISTS cliente_id integer REFERENCES clientes(id);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- crm_visitas: adicionar colunas faltantes
DO $$ BEGIN
  ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS cliente_id integer REFERENCES clientes(id);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS hora varchar(5);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS check_in_time timestamp;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS check_out_time timestamp;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS check_in_lat double precision;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS check_in_lng double precision;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS check_out_lat double precision;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS check_out_lng double precision;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS duracao_estimada integer;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- crm_visitas_localizacoes: adicionar colunas faltantes
DO $$ BEGIN
  ALTER TABLE crm_visitas_localizacoes ADD COLUMN IF NOT EXISTS observacao text;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_visitas_localizacoes ADD COLUMN IF NOT EXISTS foto_url varchar(500);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_visitas_localizacoes ADD COLUMN IF NOT EXISTS tipo varchar(50);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_visitas_localizacoes ADD COLUMN IF NOT EXISTS criado_por integer REFERENCES usuarios(id);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_visitas_localizacoes ADD COLUMN IF NOT EXISTS created_at timestamp DEFAULT now();
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- crm_notificacoes: adicionar metadados
DO $$ BEGIN
  ALTER TABLE crm_notificacoes ADD COLUMN IF NOT EXISTS metadados jsonb;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- crm_pessoas: adicionar colunas faltantes
DO $$ BEGIN
  ALTER TABLE crm_pessoas ADD COLUMN IF NOT EXISTS tipo_pessoa varchar(10);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_pessoas ADD COLUMN IF NOT EXISTS nome varchar(200);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_pessoas ADD COLUMN IF NOT EXISTS cpf varchar(14);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- neon does not have crm_empresas (migrated to crm_pessoas); skip for neon
DO $$ BEGIN
  ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS endereco varchar(300);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS numero varchar(20);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS complemento varchar(200);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS bairro varchar(150);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS cidade varchar(150);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS uf varchar(2);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS cep varchar(10);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS tipo_pessoa varchar(10);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS cpf varchar(14);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS nome varchar(200);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- crm_leads: adicionar colunas faltantes
DO $$ BEGIN
  ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS pagina_inicial varchar(100);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS pessoa_id integer;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- crm_pesquisas_respostas: adicionar colunas faltantes
DO $$ BEGIN
  ALTER TABLE crm_pesquisas_respostas ADD COLUMN IF NOT EXISTS tipo varchar(50);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- crm_pesquisas_satisfacao: adicionar colunas faltantes (nova estrutura visitas)
DO $$ BEGIN
  ALTER TABLE crm_pesquisas_satisfacao ADD COLUMN IF NOT EXISTS visita_id integer REFERENCES crm_visitas(id);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_pesquisas_satisfacao ADD COLUMN IF NOT EXISTS email varchar(200);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_pesquisas_satisfacao ADD COLUMN IF NOT EXISTS nome varchar(200);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_pesquisas_satisfacao ADD COLUMN IF NOT EXISTS token varchar(100);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_pesquisas_satisfacao ADD COLUMN IF NOT EXISTS enviado_em timestamp;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_pesquisas_satisfacao ADD COLUMN IF NOT EXISTS aberto_em timestamp;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- crm_email_config: adicionar colunas faltantes (nova estrutura)
DO $$ BEGIN
  ALTER TABLE crm_email_config ADD COLUMN IF NOT EXISTS host varchar(200);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_email_config ADD COLUMN IF NOT EXISTS port integer;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_email_config ADD COLUMN IF NOT EXISTS "user" varchar(200);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_email_config ADD COLUMN IF NOT EXISTS pass varchar(500);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_email_config ADD COLUMN IF NOT EXISTS reply_to varchar(200);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- fios: adicionar fornecedor
DO $$ BEGIN
  ALTER TABLE fios ADD COLUMN IF NOT EXISTS fornecedor varchar(200);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- logs: adicionar colunas faltantes
DO $$ BEGIN
  ALTER TABLE logs ADD COLUMN IF NOT EXISTS acao varchar(100);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE logs ADD COLUMN IF NOT EXISTS dados jsonb;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE logs ADD COLUMN IF NOT EXISTS erro text;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- produto_cru_acabamento_amostra: adicionar dados
DO $$ BEGIN
  ALTER TABLE produto_cru_acabamento_amostra ADD COLUMN IF NOT EXISTS dados jsonb;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- produto_cru_amostra: adicionar dados
DO $$ BEGIN
  ALTER TABLE produto_cru_amostra ADD COLUMN IF NOT EXISTS dados jsonb;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- crm_whatsapp_flow_logs: criar tabela de logs do fluxo WhatsApp
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

-- crm_whatsapp_retry_queue: fila de retry para mensagens WhatsApp
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

-- crm_leads: adicionar score e prioridade
DO $$ BEGIN
  ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS score integer DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS prioridade varchar(20) DEFAULT 'BAIXA';
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- ai_chaves: tabela de chaves de IA com fallback
CREATE TABLE IF NOT EXISTS ai_chaves (
  id serial PRIMARY KEY,
  provedor varchar(30) NOT NULL DEFAULT 'groq',
  nome varchar(100) NOT NULL,
  chave_api varchar(500) NOT NULL,
  url_base varchar(500),
  modelo varchar(200),
  ordem integer NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true,
  fail_count integer NOT NULL DEFAULT 0,
  ultima_falha timestamp,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- bi_sheets: cache compartilhado de planilhas do BI
CREATE TABLE IF NOT EXISTS bi_sheets (
  id varchar(64) PRIMARY KEY,
  url text NOT NULL,
  title varchar(255),
  data jsonb NOT NULL,
  loaded_at timestamp,
  updated_at timestamp DEFAULT now()
);

-- config_geral: configuracoes chave/valor
CREATE TABLE IF NOT EXISTS config_geral (
  chave varchar(100) PRIMARY KEY,
  valor text,
  updated_at timestamp DEFAULT now()
);
INSERT INTO config_geral (chave, valor) VALUES ('bi_ttl_minutos', '10')
ON CONFLICT (chave) DO NOTHING;

-- email_disparos: fila de disparos de email em massa
CREATE TABLE IF NOT EXISTS email_disparos (
  id serial PRIMARY KEY,
  nome varchar(255) NOT NULL DEFAULT '',
  para varchar(50) NOT NULL,
  listas json,
  assunto varchar(500) NOT NULL DEFAULT '',
  preheader varchar(255),
  html text NOT NULL DEFAULT '',
  modo_envio varchar(20) DEFAULT 'bcc',
  remetente varchar(20) DEFAULT 'sistema',
  remessa_id varchar(36) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'fila',
  total integer DEFAULT 0,
  enviados integer DEFAULT 0,
  falhas integer DEFAULT 0,
  erro text,
  criado_por integer REFERENCES usuarios(id),
  criado_em timestamp DEFAULT now(),
  iniciado_em timestamp,
  concluido_em timestamp
);
CREATE INDEX IF NOT EXISTS idx_email_disparos_status ON email_disparos(status);
DO $$ BEGIN
  ALTER TABLE email_enviados ADD COLUMN IF NOT EXISTS disparo_id integer REFERENCES email_disparos(id);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_email_enviados_disparo_id ON email_enviados(disparo_id);

-- user_email_config: limite diario por remetente
DO $$ BEGIN
  ALTER TABLE user_email_config ADD COLUMN IF NOT EXISTS limite_diario integer NOT NULL DEFAULT 1500;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- email_optouts: descadastros em massa
CREATE TABLE IF NOT EXISTS email_optouts (
  id serial PRIMARY KEY,
  email varchar(255) NOT NULL UNIQUE,
  criado_em timestamp DEFAULT now()
);

-- email_enviados: registro do momento do envio
DO $$ BEGIN
  ALTER TABLE email_enviados ADD COLUMN IF NOT EXISTS enviado_em timestamp;
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
CREATE INDEX IF NOT EXISTS idx_email_enviados_enviado_em ON email_enviados(enviado_em);

-- crm_segmentos: tabela de segmentos CRM
CREATE TABLE IF NOT EXISTS crm_segmentos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- clientes: adicionar segmento
DO $$ BEGIN
  ALTER TABLE clientes ADD COLUMN IF NOT EXISTS segmento varchar(100);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- crm_propostas: adicionar cliente_id e liberar empresa_id
DO $$ BEGIN
  ALTER TABLE crm_propostas ADD COLUMN IF NOT EXISTS cliente_id integer REFERENCES clientes(id);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE crm_propostas ALTER COLUMN empresa_id DROP NOT NULL;
EXCEPTION WHEN undefined_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- crm_oportunidades: adicionar cliente_id
DO $$ BEGIN
  ALTER TABLE crm_oportunidades ADD COLUMN IF NOT EXISTS cliente_id integer REFERENCES clientes(id);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;

-- crm_viagens: tabela de viagens CRM
CREATE TABLE IF NOT EXISTS crm_viagens (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(300) NOT NULL,
  descricao TEXT,
  destino_cidade VARCHAR(150),
  destino_uf VARCHAR(2),
  data_inicio DATE,
  data_fim DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'PLANEJADA',
  criado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- crm_viagens_investimentos: despesas/investimentos da viagem
CREATE TABLE IF NOT EXISTS crm_viagens_investimentos (
  id SERIAL PRIMARY KEY,
  viagem_id INTEGER NOT NULL REFERENCES crm_viagens(id) ON DELETE CASCADE,
  tipo VARCHAR(30) NOT NULL,
  valor NUMERIC(12,2),
  observacao TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- crm_visitas: vínculo com viagem
DO $$ BEGIN
  ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS viagem_id integer REFERENCES crm_viagens(id);
EXCEPTION WHEN duplicate_column THEN NULL; WHEN undefined_table THEN NULL;
END $$;
`

async function migrateDb(name, url) {
  const pool = new Pool({ connectionString: url })
  try {
    await pool.query(MIGRATION_SQL)
    console.log(`${name}: OK`)
  } catch (e) {
    console.error(`${name}: ERROR - ${e.message}`)
  } finally {
    await pool.end()
  }
}

async function main() {
  const targets = [
    { name: 'pdm_pro_textil', url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
    { name: 'pdm_ibirapuera', url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
    { name: 'neon', url: process.env.DATABASE_URL_NEON },
  ]

  for (const t of targets) {
    if (t.url) await migrateDb(t.name, t.url)
  }
  console.log('Done!')
}

main().catch(e => { console.error(e); process.exit(1) })
