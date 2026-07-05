const fs = require("fs")
const path = require("path")
const postgres = require("postgres")

const envContent = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf-8")
const match = envContent.match(/DATABASE_URL="(.*)"/)
if (!match) { console.error("DATABASE_URL not found"); process.exit(1) }

const client = postgres(match[1], { prepare: false })

async function main() {
  const sql = `
INSERT INTO status (nome, rotulo, tipo, cor, ordem, ativo)
VALUES
  ('AGENDADA', 'Agendada', 'VISITA', '#3b82f6', 1, true),
  ('REALIZADA', 'Realizada', 'VISITA', '#22c55e', 2, true),
  ('CANCELADA', 'Cancelada', 'VISITA', '#ef4444', 3, true)
ON CONFLICT (nome, tipo) DO NOTHING;
  `

  try {
    await client.unsafe(sql)
    console.log("VISITA statuses inserted successfully!")
  } catch (err) {
    console.error(err)
    process.exit(1)
  }

  await client.end()
}

main().catch(e => { console.error(e); process.exit(1) })
