require('dotenv').config({ path: '.env.local' })
const postgres = require('postgres')

async function migrate() {
  console.log('🚀 Executando migração...')
  
  const connectionString = process.env.DATABASE_URL
  const client = postgres(connectionString)
  
  try {
    // Create bases_urdume table
    await client`CREATE TABLE IF NOT EXISTS bases_urdume (
      id SERIAL PRIMARY KEY,
      codigo_completo VARCHAR(30) NOT NULL UNIQUE,
      codigo_base VARCHAR(10) NOT NULL UNIQUE,
      nome VARCHAR(200) NOT NULL,
      descricao TEXT,
      composicao_fios JSONB,
      densidade NUMERIC(6,2),
      tratamento_encolagem VARCHAR(100),
      tensao_urdume NUMERIC(6,2),
      largura NUMERIC(6,2),
      observacoes TEXT,
      ativo BOOLEAN DEFAULT true,
      criado_por INTEGER REFERENCES usuarios(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`
    console.log('✅ Tabela bases_urdume criada')
    
    // Create estampas table
    await client`CREATE TABLE IF NOT EXISTS estampas (
      id SERIAL PRIMARY KEY,
      codigo_desenho VARCHAR(4) NOT NULL,
      variante VARCHAR(2) NOT NULL,
      nome VARCHAR(200) NOT NULL,
      tipo VARCHAR(50),
      imagem_url VARCHAR(500),
      ativo BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`
    console.log('✅ Tabela estampas criada')
    
    // Add columns to cores_solidas
    await client`ALTER TABLE cores_solidas ADD COLUMN IF NOT EXISTS familia VARCHAR(50)`
    await client`ALTER TABLE cores_solidas ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true`
    console.log('✅ Colunas adicionadas em cores_solidas')
    
    // Insert seed data for bases_urdume
    await client`INSERT INTO bases_urdume (codigo_completo, codigo_base, nome, descricao, densidade, ativo) VALUES
      ('4.UR001.CRU.000001', 'UR001', 'Base Algodão 30/1', 'Base de urdume 100% algodão', '30', true),
      ('4.UR002.CRU.000001', 'UR002', 'Base Poliester 68', 'Base de urdume polyester', '24', true)
      ON CONFLICT (codigo_base) DO NOTHING`
    console.log('✅ Dados inseridos em bases_urdume')
    
    // Insert seed data for cores_solidas
    await client`INSERT INTO cores_solidas (codigo, nome, pantone, familia, ativo) VALUES
      ('0001A1', 'Azul Marinho', '2955C', 'AZUL', true),
      ('0002R1', 'Vermelho', '186C', 'VERMELHO', true),
      ('0003B1', 'Branco', 'WHITE', 'BRANCO', true)
      ON CONFLICT (codigo) DO NOTHING`
    console.log('✅ Dados inseridos em cores_solidas')
    
    // Insert seed data for estampas (sem ON CONFLICT - sem unique constraint)
    const checkEstampa = await client`SELECT id FROM estampas WHERE codigo_desenho = '5001'`
    if (checkEstampa.length === 0) {
      await client`INSERT INTO estampas (codigo_desenho, variante, nome, tipo, ativo) VALUES
        ('5001', '01', 'Floral Botânico', 'FLORAL', true),
        ('6001', '01', 'Lista Grosso', 'LISTRADO', true),
        ('7001', '01', 'Poa Pequeno', 'POA', true)`
      console.log('✅ Dados inseridos em estampas')
    } else {
      console.log('⏭️ Estampas já existem, pulando seed')
    }
    
    console.log('\n🎉 Migração concluída com sucesso!')
  } catch (error) {
    console.error('❌ Erro na migração:', error)
  } finally {
    await client.end()
  }
}

migrate()