const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8")
const match = envContent.match(/DATABASE_URL="(.*)"/)
if (!match) { console.error("DATABASE_URL not found"); process.exit(1) }

const client = postgres(match[1], { prepare: false })

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "add-user-menus.sql"), "utf-8")

  // Split by semicolons and run each statement
  const statements = sql.split(";").map(s => s.trim()).filter(s => s.length > 0)
  for (const stmt of statements) {
    try {
      await client.unsafe(stmt)
      console.log(`Ran: ${stmt.substring(0, 80)}...`)
    } catch (err) {
      // Ignore "already exists" errors
      const pgErr = /** @type {{ code?: string }} */ (err)
      if (pgErr.code === "42P07" || pgErr.code === "42701") {
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
