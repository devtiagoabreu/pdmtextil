const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8")
const match = envContent.match(/DATABASE_URL="(.*)"/)
if (!match) { console.error("DATABASE_URL not found"); process.exit(1) }

const client = postgres(match[1], { prepare: false })

async function main() {
  const sql = `
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS cliente_id INTEGER REFERENCES clientes(id);
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS resumo_ia TEXT;
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS sugestao_ia TEXT;
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS data_resumo_ia TIMESTAMPTZ;
ALTER TABLE crm_empresas ADD COLUMN IF NOT EXISTS id_integracao VARCHAR(100);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS segmento_ia VARCHAR(100);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS porte_ia VARCHAR(50);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS data_classificacao_ia TIMESTAMPTZ;
  `

  try {
    await client.unsafe(sql)
    console.log("Missing columns added successfully!")
  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  await client.end()
}

main().catch(e => { console.error(e); process.exit(1) })
