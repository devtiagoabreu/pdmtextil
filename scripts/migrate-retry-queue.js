const { Client } = require("pg")
const fs = require("fs")
const path = require("path")
require("dotenv").config({ path: ".env.local" })

const sql = fs.readFileSync(path.join(__dirname, "../src/lib/db/migrations/0033_add_whatsapp_retry_queue.sql"), "utf8")

const urls = [
  { name: "pdm_textil", url: process.env.DATABASE_URL },
  { name: "pdm_pro_textil", url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
  { name: "pdm_ibirapuera", url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
  { name: "neon", url: process.env.DATABASE_URL_NEON },
]

async function runMigration() {
  for (const db of urls) {
    if (!db.url) {
      console.log(`${db.name}: URL not found, skipping`)
      continue
    }
    try {
      const useSsl = db.url.includes("neon.tech") || db.url.includes("sslmode")
      const client = new Client({
        connectionString: db.url,
        ssl: useSsl ? { rejectUnauthorized: false } : false,
      })
      await client.connect()
      await client.query(sql)
      await client.end()
      console.log(`${db.name}: OK`)
    } catch (e) {
      console.error(`${db.name}: ERROR - ${e.message}`)
    }
  }
}

runMigration()
