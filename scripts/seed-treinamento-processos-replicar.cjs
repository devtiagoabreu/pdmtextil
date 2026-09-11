const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8")

function urlFor(name) {
  const m = envContent.match(new RegExp(name + '="(.*)"'))
  if (!m) { console.error(`${name} not found`); process.exit(1) }
  return m[1]
}

const DBS = [
  { name: "DATABASE_URL_PDM_PRO_TEXTIL", label: "pdm_pro_textil" },
  { name: "DATABASE_URL_PDM_IBIRAPUERA", label: "pdm_ibirapuera" },
  { name: "DATABASE_URL_NEON", label: "neon" },
]

const sql = fs.readFileSync(path.join(__dirname, "seed-treinamento-processos.sql"), "utf-8")

async function main() {
  for (const db of DBS) {
    const client = postgres(urlFor(db.name), { prepare: false })
    try {
      await client.unsafe(sql)
      console.log(`${db.label}: seeded successfully!`)
    } catch (err) {
      console.error(`${db.label}: FAILED`)
      console.error(err.message || err)
    } finally {
      await client.end()
    }
  }
}

main().catch((e) => { console.error(e); process.exit(1) })