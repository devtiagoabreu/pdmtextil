const { neon } = require("@neondatabase/serverless")
const dotenv = require("dotenv")

dotenv.config({ path: ".env.local" })

const sql = neon(process.env.DATABASE_URL)

async function migrate() {
  console.log("Criando tabelas de fornecedores...")
  
  try {
    // Fornecedores
    await sql`
      CREATE TABLE IF NOT EXISTS fornecedores (
        id serial PRIMARY KEY,
        nome varchar(200) NOT NULL,
        cnpj varchar(18),
        razao_social varchar(250),
        email varchar(150),
        telefone varchar(20),
        contato varchar(100),
        endereco varchar(300),
        cidade varchar(100),
        uf varchar(2),
        ativo boolean DEFAULT true,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      )
    `
    console.log("✓ Tabela fornecedores criada")

    // Fios-Fornecedores (relação N:N)
    await sql`
      CREATE TABLE IF NOT EXISTS fios_fornecedores (
        id serial PRIMARY KEY,
        fio_id integer NOT NULL REFERENCES fios(id) ON DELETE CASCADE,
        fornecedor_id integer NOT NULL REFERENCES fornecedores(id) ON DELETE CASCADE,
        codigo_fornecedor varchar(50),
        observacoes text,
        created_at timestamp DEFAULT now()
      )
    `
    console.log("✓ Tabela fios_fornecedores criada")

    console.log("\n✅ Migration de fornecedores concluída!")
    
  } catch (error) {
    console.error("❌ Erro:", error.message)
    process.exit(1)
  }
  
  process.exit(0)
}

migrate()