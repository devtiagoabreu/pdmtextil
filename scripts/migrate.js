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

    // Insere regras de notificação para requisições de corte caso não existam
    const reqCorteExistentes = await sql`SELECT count(*) FROM notificacao_regras WHERE tipo = 'REQUISICAO_CORTE'`
    if (reqCorteExistentes[0].count === "0") {
      await sql`INSERT INTO notificacao_regras (tipo, roles) VALUES ('REQUISICAO_CORTE', '["COMERCIAL","DESENVOLVIMENTO","ADMIN","SUDO","QUALIDADE","TECELAGEM","BENEFICIAMENTO","PCP"]'::jsonb)`
      await sql`INSERT INTO notificacao_regras (tipo, roles) VALUES ('REQUISICAO_CORTE_STATUS', '["COMERCIAL","DESENVOLVIMENTO","ADMIN","SUDO","QUALIDADE","TECELAGEM","BENEFICIAMENTO","PCP"]'::jsonb)`
      console.log("✓ Regras de notificação para requisições de corte inseridas")
    }

    console.log("\n✅ Migration concluída com sucesso!")
    
  } catch (error) {
    console.error("❌ Erro na migration:", error.message)
    process.exit(1)
  }
  
  process.exit(0)
}

migrate()