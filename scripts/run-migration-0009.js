const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envPath = path.join(__dirname, "..", ".env.local")
const envContent = fs.readFileSync(envPath, "utf-8")
const dbUrlMatch = envContent.match(/^DATABASE_URL="(.+)"$/m)
const sql = postgres(dbUrlMatch[1], { prepare: false })

;(async () => {
  const migrationSql = fs.readFileSync(path.join(__dirname, "..", "src", "lib", "db", "migrations", "0009_sistema.sql"), "utf-8")
  console.log("Executando migration 0009_sistema.sql...")
  await sql.unsafe(migrationSql)
  console.log("Migration 0009 concluída!")
  await sql.end()
})()
