const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8")
const match = envContent.match(/DATABASE_URL="(.*)"/)
if (!match) { console.error("DATABASE_URL not found"); process.exit(1) }

const client = postgres(match[1], { prepare: false })

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "add-perfil-menus.sql"), "utf-8")

  const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0)
  for (const stmt of statements) {
    try {
      await client.unsafe(stmt)
      console.log(`Ran: ${stmt.substring(0, 80)}...`)
    } catch (err) {
      const pgErr = /** @type {{ code?: string }} */ (err)
      if (pgErr.code === "42P07" || pgErr.code === "42701" || pgErr.code === "42P17") {
        console.log(`Skipped (already exists): ${stmt.substring(0, 60)}...`)
      } else {
        throw err
      }
    }
  }

  await client.end()
  console.log("Migration complete!")
}

main().catch(e => { console.error(e); process.exit(1) })
