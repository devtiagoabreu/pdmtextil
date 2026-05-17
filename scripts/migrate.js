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
        torcao varchar(20),
        resistencia numeric(10,2),
        alongamento numeric(5,2),
        fornecedor varchar(200),
        observacoes text,
        ativo boolean DEFAULT true,
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
    
    console.log("\n✅ Migration concluída com sucesso!")
    
  } catch (error) {
    console.error("❌ Erro na migration:", error.message)
    process.exit(1)
  }
  
  process.exit(0)
}

migrate()