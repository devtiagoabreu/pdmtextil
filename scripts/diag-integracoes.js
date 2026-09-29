// Lista integrações cadastradas (nome, base_url, telas) — sem expor segredos.
require("dotenv").config({ path: ".env.local" })
const postgres = require("postgres")

const onlyDb = (process.argv.find((a) => a.startsWith("--db=")) || "").split("=")[1]
const DATABASES = [
  { name: "pdm_textil", url: process.env.DATABASE_URL },
  { name: "pdm_pro_textil", url: process.env.DATABASE_URL_PDM_PRO_TEXTIL },
  { name: "pdm_ibirapuera", url: process.env.DATABASE_URL_PDM_IBIRAPUERA },
]

async function main() {
  const alvos = onlyDb ? DATABASES.filter((d) => d.name === onlyDb) : DATABASES.slice(0, 1)
  for (const db of alvos) {
    if (!db.url) continue
    const sql = postgres(db.url, { max: 1 })
    const rows = await sql`
      SELECT nome, base_url, tipo_auth, telas, ativo FROM integracoes ORDER BY nome
    `
    console.log(`\n=== ${db.name} (${rows.length}) ===`)
    for (const r of rows) {
      console.log(`${r.ativo ? "[x]" : "[ ]"} ${r.nome}\n     ${r.base_url}\n     telas=${JSON.stringify(r.telas)} tipo=${r.tipo_auth}`)
    }
    await sql.end({ timeout: 5 })
  }
  process.exit(0)
}
main().catch((e) => {
  console.error(e)
  process.exit(1)
})
