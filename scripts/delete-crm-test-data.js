const { Client } = require("pg")

require("dotenv").config({ path: ".env.local" })

const DATABASES = {
  pdm_textil: process.env.DATABASE_URL,
  pdm_pro_textil: process.env.DATABASE_URL_PDM_PRO_TEXTIL,
  pdm_ibirapuera: process.env.DATABASE_URL_PDM_IBIRAPUERA,
  neon: process.env.DATABASE_URL_NEON,
}

const DELETE_ORDER = [
  "DELETE FROM crm_whatsapp_retry_queue",
  "DELETE FROM crm_whatsapp_flow_logs",
  "DELETE FROM crm_whatsapp_mensagens",
  "DELETE FROM crm_whatsapp_conversas",
  "DELETE FROM crm_oportunidades WHERE lead_id IS NOT NULL",
  "DELETE FROM crm_leads",
]

const COUNT_TABLES = [
  "crm_leads",
  "crm_whatsapp_mensagens",
  "crm_whatsapp_conversas",
  "crm_whatsapp_flow_logs",
  "crm_whatsapp_retry_queue",
  "crm_oportunidades",
]

async function deleteFromDatabase(name, connectionString) {
  console.log(`\n=== ${name} ===`)
  const client = new Client({ connectionString, connectionTimeoutMillis: 15000 })

  try {
    await client.connect()
  } catch (e) {
    console.log(`  ERRO ao conectar: ${e.message}`)
    return
  }

  for (const sql of DELETE_ORDER) {
    try {
      const res = await client.query(sql)
      console.log(`  ${sql.substring(0, 50)}... => ${res.rowCount} rows deleted`)
    } catch (e) {
      console.log(`  ${sql.substring(0, 50)}... => ERRO: ${e.message.substring(0, 80)}`)
    }
  }

  console.log(`\n  Counts apos delete:`)
  for (const table of COUNT_TABLES) {
    try {
      const res = await client.query(`SELECT COUNT(*) AS total FROM ${table}`)
      console.log(`    ${table}: ${res.rows[0].total}`)
    } catch (e) {
      console.log(`    ${table}: SKIP`)
    }
  }

  await client.end()
}

async function main() {
  console.log("Deletando leads, WhatsApp messages, conversas e oportunidades vinculadas...\n")

  for (const [name, url] of Object.entries(DATABASES)) {
    await deleteFromDatabase(name, url)
  }

  console.log("\n=== Concluido ===")
}

main().catch(console.error)
