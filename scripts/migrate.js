const { neon } = require("@neondatabase/serverless")
const dotenv = require("dotenv")

dotenv.config({ path: ".env.local" })

const sql = neon(process.env.DATABASE_URL)

async function migrate() {
  console.log("Criando tabelas no banco de dados...")
  
  try {
    // Fios
    await sql`
      CREATE TABLE IF NOT EXISTS fios (
        id serial PRIMARY KEY,
        codigo_completo varchar(30) NOT NULL UNIQUE,
        codigo_fio varchar(10) NOT NULL UNIQUE,
        nome varchar(200) NOT NULL,
        nome_comercial varchar(200),
        composicao varchar(200),
        titulo varchar(20),
        titulagem_real varchar(20),
        ncm varchar(10),
        torcao varchar(20),
        resistencia numeric(10,2),
        alongamento numeric(5,2),
        links jsonb DEFAULT '[]',
        observacoes text,
        ativo boolean DEFAULT true,
        id_integracao varchar(100),
        criado_por integer,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )
    `
    console.log("✓ Tabela fios criada")
    
    // Cores Sólidas
    await sql`
      CREATE TABLE IF NOT EXISTS cores_solidas (
        id serial PRIMARY KEY,
        codigo varchar(6) NOT NULL UNIQUE,
        nome varchar(100) NOT NULL,
        pantone varchar(20),
        familia varchar(50),
        ativo boolean DEFAULT true
      )
    `
    console.log("✓ Tabela cores_solidas criada")
    
    // Cores Fundo
    await sql`
      CREATE TABLE IF NOT EXISTS cores_fundo (
        id serial PRIMARY KEY,
        codigo varchar(3) NOT NULL UNIQUE,
        nome varchar(100) NOT NULL,
        descricao text,
        ativo boolean DEFAULT true
      )
    `
    console.log("✓ Tabela cores_fundo criada")
    
    // Acabamentos
    await sql`
      CREATE TABLE IF NOT EXISTS acabamentos (
        id serial PRIMARY KEY,
        nome varchar(100) NOT NULL,
        descricao text,
        categoria varchar(50),
        ativo boolean DEFAULT true
      )
    `
    console.log("✓ Tabela acabamentos criada")
    
    // Máquinas
    await sql`
      CREATE TABLE IF NOT EXISTS maquinas (
        id serial PRIMARY KEY,
        codigo varchar(30) NOT NULL UNIQUE,
        nome varchar(100) NOT NULL,
        tipo varchar(50),
        velocidade_maxima numeric(10,2),
        capacidade_carga numeric(10,2),
        disponivel boolean DEFAULT true,
        ativo boolean DEFAULT true
      )
    `
    console.log("✓ Tabela maquinas criada")
    
    // Operações
    await sql`
      CREATE TABLE IF NOT EXISTS operacoes (
        id serial PRIMARY KEY,
        codigo varchar(20) NOT NULL UNIQUE,
        nome varchar(100) NOT NULL,
        tipo varchar(50),
        descricao text,
        ativo boolean DEFAULT true
      )
    `
    console.log("✓ Tabela operacoes criada")

    // Bases Urdume
    await sql`
      CREATE TABLE IF NOT EXISTS bases_urdume (
        id serial PRIMARY KEY,
        codigo_completo varchar(30) NOT NULL UNIQUE,
        codigo_base varchar(10) NOT NULL UNIQUE,
        nome varchar(200) NOT NULL,
        descricao text,
        densidade numeric(6,2),
        tratamento varchar(100),
        tensao_urdume numeric(6,2),
        largura numeric(6,2),
        observacoes text,
        ativo boolean DEFAULT true,
        id_integracao varchar(100),
        criado_por integer REFERENCES usuarios(id),
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )
    `
    console.log("✓ Tabela bases_urdume criada")

    await sql`
      CREATE TABLE IF NOT EXISTS base_urdume_fios (
        id serial PRIMARY KEY,
        base_urdume_id integer NOT NULL REFERENCES bases_urdume(id) ON DELETE CASCADE,
        fio_id integer NOT NULL REFERENCES fios(id),
        created_at timestamp DEFAULT now()
      )
    `
    console.log("✓ Tabela base_urdume_fios criada")

    // Produtos Cru
    await sql`
      CREATE TABLE IF NOT EXISTS produtos_cru (
        id serial PRIMARY KEY,
        codigo_pdm varchar(30) NOT NULL UNIQUE,
        descricao varchar(500) NOT NULL,
        solicitacao_desenvolvimento_id integer REFERENCES solicitacoes(id),
        status varchar(30) NOT NULL DEFAULT 'DESENVOLVIMENTO',
        ficha_tecnica jsonb,
        ativo boolean DEFAULT true,
        id_integracao_erp_cru varchar(100),
        id_integracao varchar(100),
        criado_por integer REFERENCES usuarios(id),
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )
    `
    console.log("✓ Tabela produtos_cru criada")
    
    await sql`
      CREATE TABLE IF NOT EXISTS produto_cru_composicao (
        id serial PRIMARY KEY,
        produto_cru_id integer NOT NULL REFERENCES produtos_cru(id) ON DELETE CASCADE,
        material varchar(200) NOT NULL,
        percentual numeric(5,2) NOT NULL
      )
    `
    console.log("✓ Tabela produto_cru_composicao criada")
    
    await sql`
      CREATE TABLE IF NOT EXISTS produto_cru_estrutura (
        id serial PRIMARY KEY,
        produto_cru_id integer NOT NULL REFERENCES produtos_cru(id) ON DELETE CASCADE,
        tipo varchar(20) NOT NULL,
        fio_id integer REFERENCES fios(id),
        base_urdume_id integer REFERENCES bases_urdume(id),
        ordem integer
      )
    `
    console.log("✓ Tabela produto_cru_estrutura criada")
    
    await sql`
      CREATE TABLE IF NOT EXISTS produto_cru_amostra (
        id serial PRIMARY KEY,
        produto_cru_id integer NOT NULL REFERENCES produtos_cru(id) ON DELETE CASCADE,
        descricao varchar(500),
        status varchar(30) DEFAULT 'PENDENTE',
        motivo_aprovacao text,
        observacoes text,
        data timestamp DEFAULT now(),
        created_at timestamp DEFAULT now()
      )
    `
    console.log("✓ Tabela produto_cru_amostra criada")
    
    await sql`
      CREATE TABLE IF NOT EXISTS produto_cru_acabamento (
        id serial PRIMARY KEY,
        produto_cru_id integer NOT NULL REFERENCES produtos_cru(id) ON DELETE CASCADE,
        tipo_acabamento varchar(50) NOT NULL,
        descricao varchar(500),
        id_integracao_erp_acabado varchar(100),
        possui_receita boolean DEFAULT false
      )
    `
    console.log("✓ Tabela produto_cru_acabamento criada")
    
    await sql`
      CREATE TABLE IF NOT EXISTS produto_cru_acabamento_amostra (
        id serial PRIMARY KEY,
        acabamento_id integer NOT NULL REFERENCES produto_cru_acabamento(id) ON DELETE CASCADE,
        descricao varchar(500),
        status varchar(30) DEFAULT 'PENDENTE',
        motivo_aprovacao text,
        observacoes text,
        data timestamp DEFAULT now(),
        created_at timestamp DEFAULT now()
      )
    `
    console.log("✓ Tabela produto_cru_acabamento_amostra criada")
    
    await sql`
      CREATE TABLE IF NOT EXISTS produto_cru_acabamento_receita (
        id serial PRIMARY KEY,
        acabamento_id integer NOT NULL REFERENCES produto_cru_acabamento(id) ON DELETE CASCADE,
        tipo_receita varchar(50) NOT NULL,
        parametros jsonb DEFAULT '{}'::jsonb
      )
    `
    console.log("✓ Tabela produto_cru_acabamento_receita criada")
    
    await sql`ALTER TABLE produto_cru_amostra ADD COLUMN IF NOT EXISTS motivo_aprovacao TEXT`
    console.log("✓ Coluna motivo_aprovacao em produto_cru_amostra")
    await sql`ALTER TABLE produto_cru_acabamento_amostra ADD COLUMN IF NOT EXISTS motivo_aprovacao TEXT`
    console.log("✓ Coluna motivo_aprovacao em produto_cru_acabamento_amostra")
    
    await sql`
      CREATE TABLE IF NOT EXISTS email_config (
        id SERIAL PRIMARY KEY,
        host VARCHAR(255) NOT NULL DEFAULT 'smtp.gmail.com',
        port INTEGER NOT NULL DEFAULT 587,
        "user" VARCHAR(255) NOT NULL,
        "pass" VARCHAR(255) NOT NULL,
        from_name VARCHAR(255) DEFAULT 'PDM Têxtil',
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `
    console.log("✓ Tabela email_config criada")
    
    await sql`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(50) NOT NULL,
        mensagem TEXT NOT NULL,
        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
        usuario_nome VARCHAR(255),
        link VARCHAR(500),
        lida BOOLEAN DEFAULT false,
        lida_em TIMESTAMP,
        created_at TIMESTAMP DEFAULT now()
      )
    `
    console.log("✓ Tabela notificacoes criada")
    
    await sql`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) NOT NULL UNIQUE,
        label VARCHAR(100) NOT NULL,
        description TEXT,
        permissions JSONB DEFAULT '{}'::jsonb,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `
    console.log("✓ Tabela roles criada")
    
    const existingRoles = await sql`SELECT count(*) FROM roles`
    if (existingRoles[0].count === "0") {
      await sql`INSERT INTO roles (name, label, description, permissions) VALUES
        ('COMERCIAL', 'Comercial', 'Acesso ao módulo comercial e solicitações', '{"solicitacoes":"criar","clientes":"visualizar"}'::jsonb),
        ('QUALIDADE', 'Qualidade', 'Aprovação e controle de qualidade', '{"amostras":"aprovar"}'::jsonb),
        ('TECELAGEM', 'Tecelagem', 'Acesso ao módulo de tecelagem', '{"produtos":"gerenciar"}'::jsonb),
        ('BENEFICIAMENTO', 'Beneficiamento', 'Acesso ao módulo de beneficiamento', '{"produtos":"gerenciar","receitas":"gerenciar"}'::jsonb),
        ('PCP', 'PCP', 'Planejamento e controle de produção', '{"producao":"gerenciar"}'::jsonb),
        ('DESENVOLVIMENTO', 'Desenvolvimento', 'Desenvolvimento de novos produtos', '{"produtos":"criar"}'::jsonb),
        ('ADMIN', 'Administrador', 'Acesso total ao sistema', '{"admin":"tudo"}'::jsonb)
      `
    }
    console.log("✓ Roles padrão inseridas")
    
    await sql`
      CREATE TABLE IF NOT EXISTS produtos_quimicos (
        id SERIAL PRIMARY KEY,
        codigo VARCHAR(50) NOT NULL UNIQUE,
        nome VARCHAR(200) NOT NULL,
        descricao TEXT,
        categoria VARCHAR(100),
        unidade_padrao VARCHAR(20) NOT NULL DEFAULT 'kg',
        tipo VARCHAR(50),
        concentracao VARCHAR(50),
        densidade NUMERIC(8,4),
        ph NUMERIC(4,1),
        observacoes TEXT,
        ficha_seguranca VARCHAR(500),
        id_integracao VARCHAR(100),
        ativo BOOLEAN DEFAULT true,
        criado_por INTEGER REFERENCES usuarios(id),
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `
    console.log("✓ Tabela produtos_quimicos criada")
    
    await sql`
      CREATE TABLE IF NOT EXISTS produto_cru_receita (
        id SERIAL PRIMARY KEY,
        amostra_id INTEGER NOT NULL REFERENCES produto_cru_acabamento_amostra(id) ON DELETE CASCADE,
        descricao VARCHAR(500) NOT NULL,
        instrucoes TEXT,
        versao INTEGER NOT NULL DEFAULT 1,
        receita_original_id INTEGER,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `
    console.log("✓ Tabela produto_cru_receita criada")
    await sql`ALTER TABLE produto_cru_receita ADD COLUMN IF NOT EXISTS versao INTEGER NOT NULL DEFAULT 1`
    await sql`ALTER TABLE produto_cru_receita ADD COLUMN IF NOT EXISTS receita_original_id INTEGER`
    
    await sql`
      CREATE TABLE IF NOT EXISTS produto_cru_receita_item (
        id SERIAL PRIMARY KEY,
        receita_id INTEGER NOT NULL REFERENCES produto_cru_receita(id) ON DELETE CASCADE,
        quimico_id INTEGER REFERENCES produtos_quimicos(id) ON DELETE SET NULL,
        descricao VARCHAR(300),
        unidade VARCHAR(20) NOT NULL DEFAULT 'g/L',
        quantidade_metro NUMERIC(10,4) NOT NULL,
        estagio VARCHAR(10) NOT NULL DEFAULT 'A',
        ordem INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT now()
      )
    `
    console.log("✓ Tabela produto_cru_receita_item criada")

    await sql`ALTER TABLE produtos_cru ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb`
    console.log("✓ Coluna links em produtos_cru")
    await sql`ALTER TABLE produto_cru_amostra ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb`
    console.log("✓ Coluna links em produto_cru_amostra")
    await sql`ALTER TABLE produto_cru_acabamento_amostra ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '[]'::jsonb`
    console.log("✓ Coluna links em produto_cru_acabamento_amostra")

    await sql`
      CREATE TABLE IF NOT EXISTS notificacao_regras (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(50) NOT NULL UNIQUE,
        roles JSONB NOT NULL DEFAULT '[]'::jsonb,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `
    console.log("✓ Tabela notificacao_regras criada")

    // Popula regras default (todos os tipos com array vazio => notifica todos)
    const regrasExistentes = await sql`SELECT count(*) FROM notificacao_regras`
    if (regrasExistentes[0].count === "0") {
      const tipos = [
        'SOLICITACAO_CRIADA', 'SOLICITACAO_APROVADA', 'SOLICITACAO_REPROVADA', 'SOLICITACAO_ATUALIZADA',
        'PRODUTO_CRU_CRIADO', 'PRODUTO_CRU_ATUALIZADO', 'PRODUTO_CRU_EXCLUIDO',
        'AMOSTRA_CRIADA', 'AMOSTRA_APROVADA', 'AMOSTRA_REPROVADA', 'AMOSTRA_ATUALIZADA', 'AMOSTRA_EXCLUIDA',
        'ACABAMENTO_CRIADO', 'ACABAMENTO_EXCLUIDO',
      ]
      for (const tipo of tipos) {
        await sql`INSERT INTO notificacao_regras (tipo, roles) VALUES (${tipo}, '["COMERCIAL","DESENVOLVIMENTO","ADMIN","SUDO","QUALIDADE","TECELAGEM","BENEFICIAMENTO","PCP"]'::jsonb)`
      }
    }
    console.log("✓ Regras de notificação padrão inseridas")

    await sql`
      CREATE TABLE IF NOT EXISTS bancos_dados (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        connection_string VARCHAR(500) NOT NULL,
        ativo BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT now(),
        updated_at TIMESTAMP DEFAULT now()
      )
    `
    console.log("✓ Tabela bancos_dados criada")

    // Atualiza regras existentes que ficaram com array vazio (da seed anterior)
    const defaultRoles = '["COMERCIAL","DESENVOLVIMENTO","ADMIN","SUDO","QUALIDADE","TECELAGEM","BENEFICIAMENTO","PCP"]'
    await sql`UPDATE notificacao_regras SET roles = ${defaultRoles}::jsonb WHERE roles = '[]'::jsonb`
    const atualizadas = await sql`SELECT count(*) FROM notificacao_regras`
    console.log(`✓ ${atualizadas[0].count} regras de notificação no total`)

    await sql`
      CREATE TABLE IF NOT EXISTS requisicoes_corte (
        id SERIAL PRIMARY KEY,
        requisitante_id INTEGER NOT NULL REFERENCES usuarios(id),
        status VARCHAR(30) NOT NULL DEFAULT 'SOLICITADO',
        observacoes TEXT,
        entregue_por VARCHAR(200),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("✓ Tabela requisicoes_corte criada")

    // Remove colunas antigas (migração header + itens)
    await sql`ALTER TABLE requisicoes_corte DROP COLUMN IF EXISTS codigo_produto`
    await sql`ALTER TABLE requisicoes_corte DROP COLUMN IF EXISTS ordem`
    await sql`ALTER TABLE requisicoes_corte DROP COLUMN IF EXISTS artigo`
    await sql`ALTER TABLE requisicoes_corte DROP COLUMN IF EXISTS cor`
    await sql`ALTER TABLE requisicoes_corte DROP COLUMN IF EXISTS desenho`
    await sql`ALTER TABLE requisicoes_corte DROP COLUMN IF EXISTS quantidade`
    console.log("✓ Colunas antigas removidas de requisicoes_corte")

    await sql`
      CREATE TABLE IF NOT EXISTS requisicoes_corte_itens (
        id SERIAL PRIMARY KEY,
        requisicao_corte_id INTEGER NOT NULL REFERENCES requisicoes_corte(id) ON DELETE CASCADE,
        codigo_produto VARCHAR(100),
        ordem VARCHAR(100),
        artigo VARCHAR(200),
        cor VARCHAR(100),
        desenho VARCHAR(100),
        quantidade VARCHAR(50) NOT NULL
      )
    `
    console.log("✓ Tabela requisicoes_corte_itens criada")

    await sql`
      CREATE TABLE IF NOT EXISTS requisicoes_amostra_comercial (
        id SERIAL PRIMARY KEY,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDENTE',
        solicitante_id INTEGER NOT NULL REFERENCES usuarios(id),
        responsavel_id INTEGER REFERENCES usuarios(id),
        cliente VARCHAR(200),
        produto_cru_id INTEGER NOT NULL REFERENCES produtos_cru(id),
        solicitacao_desenvolvimento_id INTEGER,
        titulo VARCHAR(500),
        quantidade VARCHAR(100),
        motivo TEXT,
        observacoes TEXT,
        historico JSONB DEFAULT '[]'::jsonb,
        prazo_desejado TIMESTAMP,
        id_integracao VARCHAR(100),
        criado_por INTEGER REFERENCES usuarios(id),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("✓ Tabela requisicoes_amostra_comercial criada")

    // Insere regras de notificação para amostra comercial caso não existam
    const amostraComercialRegras = await sql`SELECT count(*) FROM notificacao_regras WHERE tipo = 'AMOSTRA_COMERCIAL_CRIADA'`
    if (amostraComercialRegras[0].count === "0") {
      const rolesDefault = '["COMERCIAL","DESENVOLVIMENTO","ADMIN","SUDO","QUALIDADE","TECELAGEM","PCP"]'
      await sql`INSERT INTO notificacao_regras (tipo, roles) VALUES
        ('AMOSTRA_COMERCIAL_CRIADA', ${rolesDefault}::jsonb),
        ('AMOSTRA_COMERCIAL_STATUS', ${rolesDefault}::jsonb)`
      console.log("✓ Regras de notificação para amostra comercial inseridas")
    }

    // Insere regras de notificação para requisições de corte caso não existam
    const reqCorteExistentes = await sql`SELECT count(*) FROM notificacao_regras WHERE tipo = 'REQUISICAO_CORTE'`
    if (reqCorteExistentes[0].count === "0") {
      await sql`INSERT INTO notificacao_regras (tipo, roles) VALUES ('REQUISICAO_CORTE', '["COMERCIAL","DESENVOLVIMENTO","ADMIN","SUDO","QUALIDADE","TECELAGEM","BENEFICIAMENTO","PCP"]'::jsonb)`
      await sql`INSERT INTO notificacao_regras (tipo, roles) VALUES ('REQUISICAO_CORTE_STATUS', '["COMERCIAL","DESENVOLVIMENTO","ADMIN","SUDO","QUALIDADE","TECELAGEM","BENEFICIAMENTO","PCP"]'::jsonb)`
      console.log("✓ Regras de notificação para requisições de corte inseridas")
    }

    // Coluna quantidade_produzida em amostras
    await sql`ALTER TABLE produto_cru_amostra ADD COLUMN IF NOT EXISTS quantidade_produzida VARCHAR(50)`
    await sql`ALTER TABLE produto_cru_acabamento_amostra ADD COLUMN IF NOT EXISTS quantidade_produzida VARCHAR(50)`
    await sql`ALTER TABLE produto_cru_amostra ADD COLUMN IF NOT EXISTS id_integracao_erp_cru VARCHAR(100)`
    console.log("✓ Colunas quantidade_produzida e id_integracao_erp_cru adicionadas em amostras")

    await sql`
      CREATE TABLE IF NOT EXISTS integracoes (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        base_url VARCHAR(500) NOT NULL,
        tipo_auth VARCHAR(30) NOT NULL DEFAULT 'bearer',
        auth_config JSON DEFAULT '{}',
        telas JSON DEFAULT '[]',
        mapping JSON DEFAULT '{}',
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("✓ Tabela integracoes criada")

    // Add new columns if upgrading from previous version
    await sql`ALTER TABLE integracoes ADD COLUMN IF NOT EXISTS telas JSON DEFAULT '[]'`
    await sql`ALTER TABLE integracoes ADD COLUMN IF NOT EXISTS mapping JSON DEFAULT '{}'`
    console.log("✓ Colunas telas e mapping adicionadas em integracoes")

    await sql`
      CREATE TABLE IF NOT EXISTS config_empresa (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(200) NOT NULL,
        documento VARCHAR(20),
        endereco VARCHAR(300),
        cidade VARCHAR(100),
        uf VARCHAR(2),
        telefone VARCHAR(20),
        email VARCHAR(150),
        logo_url VARCHAR(500),
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("✓ Tabela config_empresa criada")

    // Chat Corporativo
    await sql`
      CREATE TABLE IF NOT EXISTS chats (
        id SERIAL PRIMARY KEY,
        tipo VARCHAR(20) NOT NULL DEFAULT 'LIVRE',
        titulo VARCHAR(200) NOT NULL,
        entidade_tipo VARCHAR(50),
        entidade_id INTEGER,
        criado_por INTEGER NOT NULL REFERENCES usuarios(id),
        updated_at TIMESTAMP DEFAULT NOW(),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("✓ Tabela chats criada")

    await sql`
      CREATE TABLE IF NOT EXISTS chat_mensagens (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        remetente_id INTEGER NOT NULL REFERENCES usuarios(id),
        mensagem TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("✓ Tabela chat_mensagens criada")

    await sql`
      CREATE TABLE IF NOT EXISTS chat_participantes (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        adicionado_em TIMESTAMP DEFAULT NOW(),
        ultima_mensagem_lida_id INTEGER
      )
    `
    console.log("✓ Tabela chat_participantes criada")

    await sql`
      CREATE TABLE IF NOT EXISTS chat_leituras (
        id SERIAL PRIMARY KEY,
        mensagem_id INTEGER NOT NULL REFERENCES chat_mensagens(id) ON DELETE CASCADE,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        lida_em TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("✓ Tabela chat_leituras criada")

    // Romaneios de Expedição
    await sql`
      CREATE TABLE IF NOT EXISTS romaneios (
        id SERIAL PRIMARY KEY,
        romaneio INTEGER NOT NULL UNIQUE,
        pedido INTEGER,
        cnpj VARCHAR(18),
        nome_cliente VARCHAR(200),
        fantasia VARCHAR(200),
        cidade VARCHAR(100),
        uf VARCHAR(2),
        nome_representante VARCHAR(200),
        nome_regiao VARCHAR(100),
        situacao VARCHAR(30),
        emissao TIMESTAMP,
        entrega TIMESTAMP,
        chegada TIMESTAMP,
        periodo INTEGER,
        linha VARCHAR(100),
        grupo VARCHAR(100),
        sub VARCHAR(100),
        total_pecas INTEGER DEFAULT 0,
        total_metragem NUMERIC(12,2),
        total_peso_bruto NUMERIC(12,4),
        total_peso_liquido NUMERIC(12,4),
        id_integracao VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("✓ Tabela romaneios criada")

    await sql`
      CREATE TABLE IF NOT EXISTS romaneio_pecas (
        id SERIAL PRIMARY KEY,
        romaneio_id INTEGER NOT NULL REFERENCES romaneios(id) ON DELETE CASCADE,
        codigo_rolo INTEGER NOT NULL,
        produto VARCHAR(100),
        narrativa TEXT,
        lote INTEGER,
        lote_produto VARCHAR(50),
        quantidade NUMERIC(12,2),
        peso_bruto NUMERIC(12,4),
        peso_liquido NUMERIC(12,4),
        data_entrada TIMESTAMP,
        op INTEGER,
        nome_operador VARCHAR(100),
        largura NUMERIC(8,2),
        gramatura NUMERIC(8,2),
        endereco_rolo VARCHAR(50),
        nuance VARCHAR(50),
        qualidade INTEGER,
        pontuacao NUMERIC(8,2),
        cor VARCHAR(100),
        vendido NUMERIC(12,2),
        saldo NUMERIC(12,2),
        unitario NUMERIC(12,4),
        valor_vendido NUMERIC(12,2),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("✓ Tabela romaneio_pecas criada")

    await sql`CREATE INDEX IF NOT EXISTS idx_romaneio_pecas_romaneio_id ON romaneio_pecas(romaneio_id)`
    console.log("✓ Índice romaneio_pecas criado")

    // Tabela de Status
    await sql`
      CREATE TABLE IF NOT EXISTS status (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        rotulo VARCHAR(100),
        tipo VARCHAR(50) NOT NULL,
        cor VARCHAR(7),
        ordem INTEGER DEFAULT 0,
        ativo BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    // Remove unique de nome isolado (caso exista de migration anterior) e adiciona composite (nome + tipo)
    await sql`ALTER TABLE status DROP CONSTRAINT IF EXISTS status_nome_key`
    await sql`ALTER TABLE status DROP CONSTRAINT IF EXISTS status_unique_nome_tipo`
    await sql`ALTER TABLE status ADD CONSTRAINT status_unique_nome_tipo UNIQUE (nome, tipo)`
    console.log("✓ Tabela status criada")

    // Popula status existentes (idempotente — só insere se não existir)
    const statusExistentes = await sql`SELECT count(*) FROM status`
    if (statusExistentes[0].count === "0") {
      await sql`INSERT INTO status (nome, rotulo, tipo, cor, ordem) VALUES
        -- Solicitação de Desenvolvimento
        ('PENDENTE', 'Pendente', 'SOLICITACAO_DESENVOLVIMENTO', '#f59e0b', 1),
        ('AGUARDANDO_INFO', 'Aguardando Info', 'SOLICITACAO_DESENVOLVIMENTO', '#ea580c', 2),
        ('AGUARDANDO_MATERIA_PRIMA', 'Aguard. Matéria Prima', 'SOLICITACAO_DESENVOLVIMENTO', '#eab308', 3),
        ('EM_DESENVOLVIMENTO', 'Em Desenvolvimento', 'SOLICITACAO_DESENVOLVIMENTO', '#6366f1', 4),
        ('APROVADO', 'Aprovado', 'SOLICITACAO_DESENVOLVIMENTO', '#14b8a6', 5),
        ('REPROVADO', 'Reprovado', 'SOLICITACAO_DESENVOLVIMENTO', '#ef4444', 6),
        ('CONCLUIDO_DEV', 'Concluído Desenvolvimento', 'SOLICITACAO_DESENVOLVIMENTO', '#22c55e', 9),
        ('APROVADO_CLI', 'Aprovado pelo Cliente', 'SOLICITACAO_DESENVOLVIMENTO', '#06b6d4', 10),
        ('CONCLUIDO', 'Concluído', 'SOLICITACAO_DESENVOLVIMENTO', '#16a34a', 11),
        -- Produto Cru
        ('DESENVOLVIMENTO', 'Em Desenvolvimento', 'PRODUTO_CRU', '#6366f1', 1),
        ('APROVADO', 'Aprovado', 'PRODUTO_CRU', '#14b8a6', 2),
        ('REPROVADO', 'Reprovado', 'PRODUTO_CRU', '#ef4444', 3),
        ('EM_PRODUCAO', 'Em Produção', 'PRODUTO_CRU', '#a855f7', 4),
        ('OBSOLETO', 'Obsoleto', 'PRODUTO_CRU', '#6b7280', 5),
        -- Amostra (Tecido Cru / Acabamento)
        ('PENDENTE', 'Pendente', 'AMOSTRA', '#f59e0b', 1),
        ('APROVADO', 'Aprovado', 'AMOSTRA', '#14b8a6', 2),
        ('REPROVADA', 'Reprovada', 'AMOSTRA', '#ef4444', 3),
        ('EM_PRODUCAO_TEC', 'Em Produção Tecelagem', 'AMOSTRA', '#a855f7', 4),
        ('EM_PRODUCAO_BEN', 'Em Produção Beneficiamento', 'AMOSTRA', '#a855f7', 5),
        ('APROVADO_DESENVOLVIMENTO', 'Aprovado Desenvolvimento', 'AMOSTRA', '#14b8a6', 6),
        ('APROVADO_COMERCIAL', 'Aprovado Comercial', 'AMOSTRA', '#14b8a6', 7),
        -- Requisição de Corte
        ('SOLICITADO', 'Solicitado', 'REQUISICAO_CORTE', '#f59e0b', 1),
        ('PROCESSANDO', 'Processando', 'REQUISICAO_CORTE', '#6366f1', 2),
        ('ATENDIDO', 'Atendido', 'REQUISICAO_CORTE', '#22c55e', 3),
        -- Amostra Comercial
        ('PENDENTE', 'Pendente', 'AMOSTRA_COMERCIAL', '#f59e0b', 1),
        ('AGUARDANDO_INFO', 'Aguardando Info', 'AMOSTRA_COMERCIAL', '#ea580c', 2),
        ('EM_PRODUCAO', 'Em Produção', 'AMOSTRA_COMERCIAL', '#6366f1', 3),
        ('APROVADO', 'Aprovado', 'AMOSTRA_COMERCIAL', '#22c55e', 4),
        ('REPROVADO', 'Reprovado', 'AMOSTRA_COMERCIAL', '#ef4444', 5),
        ('CONCLUIDO', 'Concluído', 'AMOSTRA_COMERCIAL', '#16a34a', 6)
      `
    console.log("✓ Status padrão inseridos")
    } else {
      console.log("✓ Status já existem — pulando inserção")
    }

    // ==================== CRM (Fase 1) ====================
    await sql`
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
        ativo BOOLEAN DEFAULT true,
        id_integracao VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("✓ Tabela crm_empresas criada")

    await sql`
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("✓ Tabela crm_leads criada")

    await sql`
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
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `
    console.log("✓ Tabela crm_contatos criada")

    console.log("\n✅ Migration concluída com sucesso!")
    
  } catch (error) {
    console.error("❌ Erro na migration:", error.message)
    process.exit(1)
  }
  
  process.exit(0)
}

migrate()