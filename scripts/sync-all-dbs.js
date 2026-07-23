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
