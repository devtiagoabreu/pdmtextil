const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8")
const match = envContent.match(/DATABASE_URL="(.*)"/)
if (!match) { console.error("DATABASE_URL not found"); process.exit(1) }

const client = postgres(match[1], { prepare: false })

async function main() {
  const sql = `
ALTER TABLE crm_pessoas ADD COLUMN IF NOT EXISTS endereco VARCHAR(300);
ALTER TABLE crm_pessoas ADD COLUMN IF NOT EXISTS numero VARCHAR(20);
ALTER TABLE crm_pessoas ADD COLUMN IF NOT EXISTS complemento VARCHAR(200);
ALTER TABLE crm_pessoas ADD COLUMN IF NOT EXISTS bairro VARCHAR(150);
ALTER TABLE crm_pessoas ADD COLUMN IF NOT EXISTS cidade VARCHAR(150);
ALTER TABLE crm_pessoas ADD COLUMN IF NOT EXISTS uf VARCHAR(2);
ALTER TABLE crm_pessoas ADD COLUMN IF NOT EXISTS cep VARCHAR(10);
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS endereco VARCHAR(300);
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS numero VARCHAR(20);
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS complemento VARCHAR(200);
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS bairro VARCHAR(150);
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS cidade VARCHAR(150);
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS uf VARCHAR(2);
ALTER TABLE crm_visitas ADD COLUMN IF NOT EXISTS cep VARCHAR(10);
  `

  try {
    await client.unsafe(sql)
    console.log("Address columns added successfully!")
  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  await client.end()
}

main().catch(e => { console.error(e); process.exit(1) })
