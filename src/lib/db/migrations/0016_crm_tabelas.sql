-- CRM: Regiões Comerciais
CREATE TABLE IF NOT EXISTS crm_regioes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  uf VARCHAR(2),
  gerente_id INTEGER REFERENCES usuarios(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM: Equipes Comerciais
CREATE TABLE IF NOT EXISTS crm_equipes (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  regiao_id INTEGER REFERENCES crm_regioes(id),
  responsavel_id INTEGER REFERENCES usuarios(id),
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM: Empresas
CREATE TABLE IF NOT EXISTS crm_empresas (
  id SERIAL PRIMARY KEY,
  razao_social VARCHAR(250) NOT NULL,
  nome_fantasia VARCHAR(200),
  cnpj VARCHAR(18) NOT NULL UNIQUE,
  segmento VARCHAR(100),
  porte VARCHAR(50),
  site VARCHAR(255),
  observacoes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'NOVO',
  responsavel_id INTEGER REFERENCES usuarios(id),
  cliente_id INTEGER REFERENCES clientes(id),
  resumo_ia TEXT,
  sugestao_ia TEXT,
  data_resumo_ia TIMESTAMPTZ,
  ativo BOOLEAN DEFAULT true,
  id_integracao VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM: Leads
CREATE TABLE IF NOT EXISTS crm_leads (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  email VARCHAR(255),
  telefone VARCHAR(20),
  celular VARCHAR(20),
  empresa_nome VARCHAR(200),
  cargo VARCHAR(100),
  origem VARCHAR(30) NOT NULL DEFAULT 'OUTRO',
  status VARCHAR(30) NOT NULL DEFAULT 'NOVO',
  descricao TEXT,
  responsavel_id INTEGER REFERENCES usuarios(id),
  empresa_id INTEGER REFERENCES crm_empresas(id),
  id_integracao VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add IA columns to leads (if table already existed without them)
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS score INTEGER;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS segmento_ia VARCHAR(100);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS porte_ia VARCHAR(50);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS data_classificacao_ia TIMESTAMPTZ;

-- Add IA columns to empresas (if table already existed without them)
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS resumo_ia TEXT;
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS sugestao_ia TEXT;
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS data_resumo_ia TIMESTAMPTZ;
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS id_integracao VARCHAR(100);

-- CRM: Contatos
CREATE TABLE IF NOT EXISTS crm_contatos (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  cargo VARCHAR(100),
  email VARCHAR(255),
  telefone VARCHAR(20),
  celular VARCHAR(20),
  whatsapp VARCHAR(20),
  principal BOOLEAN DEFAULT false,
  observacoes TEXT,
  empresa_id INTEGER NOT NULL REFERENCES crm_empresas(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM: Oportunidades
CREATE TABLE IF NOT EXISTS crm_oportunidades (
  id SERIAL PRIMARY KEY,
  titulo VARCHAR(300) NOT NULL,
  descricao TEXT,
  valor_estimado NUMERIC(12, 2),
  status VARCHAR(30) NOT NULL DEFAULT 'NOVO',
  lead_id INTEGER REFERENCES crm_leads(id),
  empresa_id INTEGER REFERENCES crm_empresas(id),
  contato_id INTEGER REFERENCES crm_contatos(id),
  responsavel_id INTEGER REFERENCES usuarios(id),
  data_fechamento_prevista DATE,
  probabilidade INTEGER DEFAULT 0,
  motivo_perda TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM: Visitas
CREATE TABLE IF NOT EXISTS crm_visitas (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES crm_empresas(id),
  oportunidade_id INTEGER REFERENCES crm_oportunidades(id),
  contato_id INTEGER REFERENCES crm_contatos(id),
  data_visita DATE NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'PRESENCIAL',
  status VARCHAR(20) NOT NULL DEFAULT 'AGENDADA',
  motivo_cancelamento TEXT,
  relato TEXT,
  fotos JSONB DEFAULT '[]',
  criado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM: Tarefas
CREATE TABLE IF NOT EXISTS crm_tarefas (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES crm_empresas(id),
  oportunidade_id INTEGER REFERENCES crm_oportunidades(id),
  titulo VARCHAR(300) NOT NULL,
  descricao TEXT,
  tipo VARCHAR(20) NOT NULL DEFAULT 'TAREFA',
  data_prevista DATE,
  data_conclusao DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE',
  responsavel_id INTEGER REFERENCES usuarios(id),
  criado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM: Propostas
CREATE TABLE IF NOT EXISTS crm_propostas (
  id SERIAL PRIMARY KEY,
  oportunidade_id INTEGER REFERENCES crm_oportunidades(id),
  empresa_id INTEGER NOT NULL REFERENCES crm_empresas(id),
  titulo VARCHAR(300) NOT NULL,
  valor NUMERIC(12, 2),
  descricao TEXT,
  condicoes_pagamento TEXT,
  prazo_entrega VARCHAR(200),
  arquivo_url VARCHAR(500),
  status VARCHAR(20) NOT NULL DEFAULT 'ENVIADA',
  data_envio TIMESTAMPTZ,
  data_resposta TIMESTAMPTZ,
  criado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM: Timeline de Eventos
CREATE TABLE IF NOT EXISTS crm_timeline_eventos (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER NOT NULL REFERENCES crm_empresas(id),
  tipo VARCHAR(30) NOT NULL,
  descricao TEXT NOT NULL,
  metadados JSONB DEFAULT '{}',
  data_evento TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM: WhatsApp Mensagens
CREATE TABLE IF NOT EXISTS crm_whatsapp_mensagens (
  id SERIAL PRIMARY KEY,
  empresa_id INTEGER REFERENCES crm_empresas(id),
  contato_id INTEGER REFERENCES crm_contatos(id),
  mensagem TEXT NOT NULL,
  tipo VARCHAR(10) NOT NULL DEFAULT 'RECEBIDA',
  status VARCHAR(10) NOT NULL DEFAULT 'RECEBIDA',
  lida BOOLEAN DEFAULT false,
  external_id VARCHAR(255),
  remote_jid VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM: Campanhas
CREATE TABLE IF NOT EXISTS crm_campanhas (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(300) NOT NULL,
  tipo VARCHAR(20) NOT NULL DEFAULT 'WHATSAPP',
  descricao TEXT,
  data_inicio DATE,
  data_fim DATE,
  orcamento NUMERIC(12, 2),
  leads_gerados INTEGER DEFAULT 0,
  custo_aquisicao NUMERIC(12, 2),
  status VARCHAR(20) NOT NULL DEFAULT 'ATIVA',
  criado_por INTEGER REFERENCES usuarios(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CRM: Previsão de Vendas
CREATE TABLE IF NOT EXISTS crm_previsao_vendas (
  id SERIAL PRIMARY KEY,
  periodo VARCHAR(7) NOT NULL,
  valor_previsto NUMERIC(14, 2) NOT NULL,
  valor_real NUMERIC(14, 2),
  dados JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist (for tables created before this migration)
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes(id);
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS resumo_ia TEXT;
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS sugestao_ia TEXT;
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS data_resumo_ia TIMESTAMPTZ;
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS id_integracao VARCHAR(100);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS segmento_ia VARCHAR(100);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS porte_ia VARCHAR(50);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS data_classificacao_ia TIMESTAMPTZ;

-- Endereço nas empresas e visitas
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS endereco VARCHAR(300);
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS numero VARCHAR(20);
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS complemento VARCHAR(200);
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS bairro VARCHAR(150);
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS cidade VARCHAR(150);
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS uf VARCHAR(2);
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS cep VARCHAR(10);
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS endereco VARCHAR(300);
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS numero VARCHAR(20);
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS complemento VARCHAR(200);
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS bairro VARCHAR(150);
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS cidade VARCHAR(150);
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS uf VARCHAR(2);
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS cep VARCHAR(10);

-- CRM: Estados (UF)
CREATE TABLE IF NOT EXISTS crm_estados (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(100) NOT NULL UNIQUE,
  uf VARCHAR(2) NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
COMMENT ON TABLE crm_estados IS 'Estados brasileiros usados nos dropdowns de UF do CRM';

-- CRM: Cidades
CREATE TABLE IF NOT EXISTS crm_cidades (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(200) NOT NULL,
  estado_id INTEGER NOT NULL REFERENCES crm_estados(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (nome, estado_id)
);
COMMENT ON TABLE crm_cidades IS 'Cidades brasileiras usadas nos dropdowns de cidade do CRM';
