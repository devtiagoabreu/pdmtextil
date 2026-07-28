const { Client } = require("pg")
const fs = require("fs")
const path = require("path")

const DATABASES = {
  pdm_textil: "postgresql://postgres:SENHA_REMOVIDA@HOST_REMOVIDO:21237/pdm_textil",
  pdm_pro_textil: "postgresql://postgres:SENHA_REMOVIDA@HOST_REMOVIDO:21237/pdm_pro_textil",
  pdm_ibirapuera: "postgresql://postgres:SENHA_REMOVIDA@HOST_REMOVIDO:21237/pdm_ibirapuera",
  neon: "postgresql://neondb_owner:NEON_PASSWORD_REMOVIDA@ep-delicate-dew-acaz6kqb-pooler.sa-east-1.aws.neon.tech/db_pmtprotextil?sslmode=require",
}

const TABLES = [
  "crm_leads",
  "crm_whatsapp_mensagens",
  "crm_whatsapp_conversas",
  "crm_whatsapp_flow_logs",
  "crm_whatsapp_retry_queue",
  "crm_oportunidades",
]

const bkpDir = path.join(__dirname, "..", "bkp")
if (!fs.existsSync(bkpDir)) fs.mkdirSync(bkpDir, { recursive: true })

async function backupDatabase(name, connectionString) {
  console.log(`\n=== Backup: ${name} ===`)
  const client = new Client({ connectionString, connectionTimeoutMillis: 15000 })
  
  try {
    await client.connect()
  } catch (e) {
    console.log(`  ERRO ao conectar: ${e.message}`)
    return
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
  const dbDir = path.join(bkpDir, `${name}_${timestamp}`)
  fs.mkdirSync(dbDir, { recursive: true })

  for (const table of TABLES) {
    try {
      const res = await client.query(`SELECT row_to_json(t) AS data FROM (SELECT * FROM ${table}) t`)
      const rows = res.rows.map((r) => r.data)
      const filePath = path.join(dbDir, `${table}.json`)
      fs.writeFileSync(filePath, JSON.stringify(rows, null, 2))
      console.log(`  ${table}: ${rows.length} rows`)
    } catch (e) {
      console.log(`  ${table}: SKIP (${e.message.substring(0, 80)})`)
    }
  }

  await client.end()
  console.log(`  -> ${dbDir}`)
}

async function main() {
  console.log("Backup das tabelas CRM/WhatsApp...\n")
  
  for (const [name, url] of Object.entries(DATABASES)) {
    await backupDatabase(name, url)
  }
  
  console.log("\n=== Concluido ===")
}

main().catch(console.error)
