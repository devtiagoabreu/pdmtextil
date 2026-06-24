const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const url = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8").match(/DATABASE_URL="(.*)"/)[1]
const c = postgres(url, { prepare: false })

async function main() {
  const r = await c`SELECT nome, rotulo, tipo FROM "status" WHERE nome IN ('EM_PRODUCAO_TEC','EM_PRODUCAO_BEN','PILOTAGEM','CONCLUIDO_DEV','APROVADO_CLI') ORDER BY tipo, ordem`
  console.log(JSON.stringify(r, null, 2))
  await c.end()
}

main().catch(e => { console.error(e); process.exit(1) })
