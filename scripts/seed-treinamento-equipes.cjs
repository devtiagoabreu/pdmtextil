const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8")
const match = envContent.match(/DATABASE_URL="(.*)"/)
if (!match) { console.error("DATABASE_URL not found"); process.exit(1) }

const client = postgres(match[1], { prepare: false })

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "seed-treinamento-equipes.sql"), "utf-8")

  try {
    await client.unsafe(sql)
    console.log("Treinamento equipes seeded successfully!")
  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  await client.end()
}

main().catch(e => { console.error(e); process.exit(1) })
