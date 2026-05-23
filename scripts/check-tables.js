const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envPath = path.join(__dirname, "..", ".env.local")
const envContent = fs.readFileSync(envPath, "utf-8")
const dbUrlMatch = envContent.match(/^DATABASE_URL="(.+)"$/m)
const sql = postgres(dbUrlMatch[1], { prepare: false })

;(async () => {
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`
  console.log("Tabelas:", tables.map(t => t.table_name).join(", "))
  await sql.end()
})()
