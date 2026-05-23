const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

// Read .env.local
const envPath = path.join(__dirname, "..", ".env.local")
const envContent = fs.readFileSync(envPath, "utf-8")
const match = envContent.match(/^DATABASE_URL="(.+)"$/m)
if (!match) {
  console.error("DATABASE_URL not found in .env.local")
  process.exit(1)
}

const databaseUrl = match[1]
console.log("Conectando ao Neon...")
const sql = postgres(databaseUrl, { prepare: false })

async function main() {
  console.log("Executando migration 0010_amostras_historico...")
  
  await sql.unsafe(`
    ALTER TABLE produto_cru_amostra
    ADD COLUMN IF NOT EXISTS historico jsonb DEFAULT '[]'::jsonb;
  `)
  console.log("  ✓ historico adicionado em produto_cru_amostra")

  await sql.unsafe(`
    ALTER TABLE produto_cru_acabamento_amostra
    ADD COLUMN IF NOT EXISTS historico jsonb DEFAULT '[]'::jsonb;
  `)
  console.log("  ✓ historico adicionado em produto_cru_acabamento_amostra")

  console.log("Migration concluída com sucesso!")
  await sql.end()
}

main().catch((err) => {
  console.error("Erro:", err)
  process.exit(1)
})
