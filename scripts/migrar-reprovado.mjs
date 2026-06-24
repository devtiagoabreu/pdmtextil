const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envPath = path.join(__dirname, "..", ".env.local")
const envContent = fs.readFileSync(envPath, "utf-8")
const match = envContent.match(/DATABASE_URL="(.*)"/)
if (!match) {
  console.error("DATABASE_URL not found in .env.local")
  process.exit(1)
}

const client = postgres(match[1], { prepare: false })

async function main() {
  // Update amostras that have REPROVADO status
  const r1 = await client`
    UPDATE "produto_cru_amostra" SET status = 'REPROVADA'
    WHERE status = 'REPROVADO'
    RETURNING id
  `
  console.log(`produto_cru_amostra: ${r1.length} rows updated (IDs: ${r1.map(r => r.id).join(", ") || "none"})`)

  // Update acabamento amostras that have REPROVADO status
  const r2 = await client`
    UPDATE "produto_cru_acabamento_amostra" SET status = 'REPROVADA'
    WHERE status = 'REPROVADO'
    RETURNING id
  `
  console.log(`produto_cru_acabamento_amostra: ${r2.length} rows updated (IDs: ${r2.map(r => r.id).join(", ") || "none"})`)

  await client.end()
}

main().catch(e => { console.error(e); process.exit(1) })
