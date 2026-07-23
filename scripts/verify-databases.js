const postgres = require("postgres")
const dotenv = require("dotenv")

dotenv.config({ path: ".env.local" })

async function getTables(sql) {
  const result = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
  `
  return result.map(r => r.table_name)
}

async function compareDatabases() {
  const databases = [
    { name: "pdm_textil", url: process.env.DATABASE_URL },
    { name: "pdm_pro_textil", url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
    { name: "pdm_ibirapuera", url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
  ]

  console.log("🔍 Comparando tabelas entre bancos de dados...\n")
  
  const dbTables = {}
  
  for (const db of databases) {
    if (db.url) {
      try {
        const sql = postgres(db.url, { prepare: false })
        dbTables[db.name] = await getTables(sql)
        await sql.end()
        console.log(`✅ ${db.name}: ${dbTables[db.name].length} tabelas`)
      } catch (error) {
        console.error(`❌ Erro ao conectar com ${db.name}:`, error.message)
        dbTables[db.name] = []
      }
    }
  }
  
  // Compare tables
  const mainDb = "pdm_textil"
  if (!dbTables[mainDb]) {
    console.error(`❌ Banco principal ${mainDb} não encontrado`)
    return
  }
  
  const mainTables = new Set(dbTables[mainDb])
  
  for (const [dbName, tables] of Object.entries(dbTables)) {
    if (dbName === mainDb) continue
    
    const dbTableSet = new Set(tables)
    const missingInDb = [...mainTables].filter(t => !dbTableSet.has(t))
    const extraInDb = [...dbTableSet].filter(t => !mainTables.has(t))
    
    if (missingInDb.length === 0 && extraInDb.length === 0) {
      console.log(`✅ ${dbName}: Sincronizado com ${mainDb}`)
    } else {
      console.log(`⚠️  ${dbName}: Diferentes de ${mainDb}`)
      if (missingInDb.length > 0) {
        console.log(`   Faltando em ${dbName}: ${missingInDb.join(", ")}`)
      }
      if (extraInDb.length > 0) {
        console.log(`   Extra em ${dbName}: ${extraInDb.join(", ")}`)
      }
    }
  }
}

compareDatabases()